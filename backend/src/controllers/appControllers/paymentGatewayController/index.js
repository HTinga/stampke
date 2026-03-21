'use strict';
const mongoose = require('mongoose');
const logger   = require('@/utils/logger');

// ── Stripe ────────────────────────────────────────────────────────────────────
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
};

const PLAN_PRICES = {
  pro:        process.env.STRIPE_PRICE_PRO        || 'price_pro',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
};

// POST /api/payment/stripe/checkout — create Stripe checkout session
const stripeCheckout = async (req, res) => {
  const { plan } = req.body;
  if (!PLAN_PRICES[plan])
    return res.status(400).json({ success: false, result: null, message: 'Invalid plan.' });

  const stripe  = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode:            'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
    customer_email:  req.user.email,
    client_reference_id: req.user._id.toString(),
    metadata:        { userId: req.user._id.toString(), plan },
    success_url:     `${process.env.FRONTEND_URL}?payment=success&plan=${plan}`,
    cancel_url:      `${process.env.FRONTEND_URL}?payment=cancelled`,
  });
  return res.status(200).json({ success: true, result: { url: session.url }, message: 'Checkout session created.' });
};

// POST /api/payment/stripe/portal — billing portal to manage subscription
const stripePortal = async (req, res) => {
  const stripe = getStripe();
  const User   = mongoose.model('User');
  const user   = await User.findById(req.user._id);

  if (!user.stripeCustomerId)
    return res.status(400).json({ success: false, result: null, message: 'No active subscription found.' });

  const session = await stripe.billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: process.env.FRONTEND_URL,
  });
  return res.status(200).json({ success: true, result: { url: session.url }, message: 'Portal session created.' });
};

// POST /api/payment/stripe/webhook — Stripe calls this after payment events
// MUST be raw body — issue #5: signature verification
const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret)
    return res.status(400).json({ success: false, result: null, message: 'Webhook secret not configured.' });

  let event;
  try {
    // req.body must be raw Buffer for signature verification (issue #5)
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    logger.warn({ message: `Stripe webhook signature failed: ${err.message}` });
    return res.status(400).json({ success: false, result: null, message: 'Invalid signature.' });
  }

  const User = mongoose.model('User');

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      const plan    = session.metadata?.plan;
      if (userId && plan) {
        await User.findByIdAndUpdate(userId, {
          plan,
          stripeCustomerId:     session.customer,
          stripeSubscriptionId: session.subscription,
          planActivatedAt:      new Date(),
        });
        logger.info({ message: `Plan upgraded: ${plan}`, userId });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub    = event.data.object;
      const user   = await User.findOne({ stripeSubscriptionId: sub.id });
      if (user) {
        await User.findByIdAndUpdate(user._id, { plan: 'free', stripeSubscriptionId: null });
        logger.info({ message: 'Subscription cancelled', userId: user._id });
      }
      break;
    }
    case 'invoice.payment_failed': {
      logger.warn({ message: 'Stripe payment failed', customer: event.data.object.customer });
      break;
    }
    default:
      logger.debug({ message: `Unhandled Stripe event: ${event.type}` });
  }

  return res.status(200).json({ received: true });
};

// ── M-Pesa (via IntaSend — Kenyan payment gateway) ────────────────────────────
// POST /api/payment/mpesa/stk — trigger STK push to user's phone
const mpesaSTK = async (req, res) => {
  const { phone, amount, plan } = req.body;
  if (!phone || !amount)
    return res.status(400).json({ success: false, result: null, message: 'phone and amount are required.' });

  if (!process.env.INTASEND_API_KEY)
    return res.status(503).json({ success: false, result: null, message: 'M-Pesa not configured. Contact admin.' });

  try {
    const response = await fetch('https://sandbox.intasend.com/api/v1/payment/mpesa-stk-push/', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.INTASEND_API_KEY}`,
      },
      body: JSON.stringify({
        phone_number: phone.replace(/^0/, '254').replace(/^\+/, ''),
        amount:       Number(amount),
        narrative:    `Tomo ${plan || 'subscription'} payment`,
        email:        req.user.email,
        first_name:   req.user.name.split(' ')[0],
        last_name:    req.user.name.split(' ').slice(1).join(' ') || '.',
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      logger.warn({ message: 'M-Pesa STK failed', data });
      return res.status(400).json({ success: false, result: null, message: data?.detail || 'M-Pesa push failed.' });
    }

    return res.status(200).json({
      success: true,
      result:  { invoiceId: data.invoice?.invoice_id, state: data.invoice?.state },
      message: 'STK push sent. Check your phone to complete payment.',
    });
  } catch (err) {
    logger.error({ message: 'M-Pesa error', error: err.message });
    return res.status(500).json({ success: false, result: null, message: 'M-Pesa service unavailable.' });
  }
};

// POST /api/payment/mpesa/status — check STK payment status
const mpesaStatus = async (req, res) => {
  const { invoiceId } = req.body;
  if (!invoiceId)
    return res.status(400).json({ success: false, result: null, message: 'invoiceId required.' });

  try {
    const response = await fetch(`https://sandbox.intasend.com/api/v1/payment/${invoiceId}/`, {
      headers: { 'Authorization': `Bearer ${process.env.INTASEND_API_KEY}` },
    });
    const data = await response.json();
    const paid = data?.invoice?.state === 'COMPLETE';

    if (paid && req.body.plan) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(req.user._id, { plan: req.body.plan, planActivatedAt: new Date() });
    }

    return res.status(200).json({
      success: true,
      result:  { paid, state: data?.invoice?.state },
      message: paid ? 'Payment confirmed!' : `Status: ${data?.invoice?.state}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, result: null, message: 'Could not check payment status.' });
  }
};

// GET /api/payment/plans — return plan pricing (public)
const getPlans = async (req, res) => {
  return res.status(200).json({
    success: true,
    result: [
      {
        id: 'free', name: 'Free', price: 0, currency: 'KES',
        features: ['eSign (3/month)', 'Stamp designer', 'Basic templates'],
        cta: 'Get Started',
      },
      {
        id: 'pro', name: 'Professional', price: 2499, currency: 'KES', period: '/month',
        stripePriceId: process.env.STRIPE_PRICE_PRO,
        features: ['Unlimited eSign', 'Unlimited stamps', 'Smart Invoice', 'Client Manager', 'PDF Editor', 'WorkHub', 'AI Scan', 'QR Tracker'],
        cta: 'Start 7-day trial',
        popular: true,
      },
      {
        id: 'enterprise', name: 'Enterprise', price: null, currency: 'KES',
        features: ['Everything in Pro', 'White-label', 'Custom integrations', 'Dedicated support', 'SLA', 'Multi-team'],
        cta: 'Contact us',
      },
    ],
    message: 'Plans fetched.',
  });
};

module.exports = { stripeCheckout, stripePortal, stripeWebhook, mpesaSTK, mpesaStatus, getPlans };
