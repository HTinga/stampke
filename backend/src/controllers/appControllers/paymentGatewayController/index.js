'use strict';
const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_placeholder');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const PLANS = {
  pro:        { name: 'Professional', priceKES: 2499, stripePriceId: process.env.STRIPE_PRO_PRICE_ID },
  enterprise: { name: 'Enterprise',   priceKES: 9999, stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID },
};
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const INTASEND_API = process.env.INTASEND_API_KEY || '';
const IS_SANDBOX   = process.env.NODE_ENV !== 'production';

const stripeCheckout = async (req, res) => {
  const { planId, email } = req.body;
  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ success: false, result: null, message: 'Invalid plan.' });
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_placeholder')
    return res.status(400).json({ success: false, result: null, message: 'Stripe not configured. Contact hempstonetinga@gmail.com to upgrade.' });
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', payment_method_types: ['card'],
    customer_email: email || req.user.email,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    metadata: { userId: req.user._id.toString(), planId },
    success_url: `${FRONTEND_URL}?payment=success&plan=${planId}`,
    cancel_url:  `${FRONTEND_URL}?payment=cancelled`,
  });
  return res.status(200).json({ success: true, result: { url: session.url }, message: 'Checkout session created.' });
};

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (err) { return res.status(400).send('Webhook signature failed'); }
  if (event.type === 'checkout.session.completed') {
    const { userId, planId } = event.data.object.metadata || {};
    if (userId && planId) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(userId, { plan: planId, planActivatedAt: new Date(), stripeCustomerId: event.data.object.customer });
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const User = mongoose.model('User');
    const user = await User.findOne({ stripeCustomerId: event.data.object.customer });
    if (user) await User.findByIdAndUpdate(user._id, { plan: 'free' });
  }
  res.json({ received: true });
};

const mpesaStkPush = async (req, res) => {
  const { phone, amount, planId } = req.body;
  if (!phone || !amount || !planId)
    return res.status(400).json({ success: false, result: null, message: 'phone, amount and planId required.' });
  if (!INTASEND_API)
    return res.status(400).json({ success: false, result: null, message: 'M-Pesa not configured. Contact hempstonetinga@gmail.com to upgrade.' });
  const baseUrl = IS_SANDBOX ? 'https://sandbox.intasend.com' : 'https://payment.intasend.com';
  const payload = {
    currency: 'KES', amount: String(amount), phone_number: phone,
    narrative: `Tomo ${PLANS[planId]?.name || planId} subscription`,
    api_ref: `tomo-${req.user._id}-${planId}-${Date.now()}`,
    callback_url: `${process.env.BACKEND_URL || FRONTEND_URL}/api/payments/mpesa/callback`,
  };
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(req.user._id, { 'pendingPayment.planId': planId, 'pendingPayment.phone': phone, 'pendingPayment.startedAt': new Date() });
  try {
    const response = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${INTASEND_API}` },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.invoice?.invoice_id) {
      await User.findByIdAndUpdate(req.user._id, { 'pendingPayment.checkoutRequestId': data.invoice.invoice_id });
      return res.status(200).json({ success: true, result: { checkoutRequestId: data.invoice.invoice_id }, message: 'M-Pesa STK push sent.' });
    }
    return res.status(400).json({ success: false, result: null, message: data.detail || 'M-Pesa request failed.' });
  } catch (err) {
    return res.status(500).json({ success: false, result: null, message: 'M-Pesa service unavailable.' });
  }
};

const mpesaStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;
  const baseUrl = IS_SANDBOX ? 'https://sandbox.intasend.com' : 'https://payment.intasend.com';
  try {
    const response = await fetch(`${baseUrl}/api/v1/payment/status/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${INTASEND_API}` },
      body: JSON.stringify({ invoice_id: checkoutRequestId }),
    });
    const data = await response.json();
    const state = data.invoice?.state;
    if (state === 'COMPLETE') {
      const User = mongoose.model('User');
      const user = await User.findOne({ 'pendingPayment.checkoutRequestId': checkoutRequestId });
      if (user) {
        const planId = user.pendingPayment?.planId;
        await User.findByIdAndUpdate(user._id, { plan: planId, planActivatedAt: new Date(), pendingPayment: null });
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Tomo <noreply@tomo.ke>', to: user.email,
            subject: `[Tomo] M-Pesa payment confirmed — ${PLANS[planId]?.name} active!`,
            html: `<p>Hi ${user.name}, payment received. Your <strong>${PLANS[planId]?.name}</strong> plan is now active. <a href="${FRONTEND_URL}">Open Tomo</a></p>`,
          });
        } catch (e) { console.error('[Email] mpesa confirm:', e.message); }
      }
      return res.status(200).json({ success: true, result: { status: 'paid' }, message: 'Payment confirmed.' });
    }
    if (['FAILED','CANCELLED'].includes(state))
      return res.status(200).json({ success: true, result: { status: 'failed' }, message: 'Payment failed.' });
    return res.status(200).json({ success: true, result: { status: 'pending' }, message: 'Pending.' });
  } catch (err) {
    return res.status(200).json({ success: true, result: { status: 'pending' }, message: 'Checking...' });
  }
};

const mpesaCallback = (req, res) => {
  console.log('[M-Pesa Callback]', JSON.stringify(req.body));
  res.status(200).json({ received: true });
};

module.exports = { stripeCheckout, stripeWebhook, mpesaStkPush, mpesaStatus, mpesaCallback };
