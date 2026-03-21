'use strict';
// ── Payment Gateway: IntaSend (M-Pesa + Card) ─────────────────────────────────
// No Stripe — IntaSend works fully in Kenya for both mobile money and cards
// Sign up free: https://intasend.com
// Sandbox: use test phone 254708374149, any amount

const mongoose   = require('mongoose');
const sendEmail  = require('@/utils/sendEmail');

const INTASEND_API = process.env.INTASEND_API_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IS_SANDBOX   = process.env.NODE_ENV !== 'production';
const BASE_URL     = IS_SANDBOX ? 'https://sandbox.intasend.com' : 'https://payment.intasend.com';

const PLANS = {
  pro:        { name: 'Professional', priceKES: 2499 },
  enterprise: { name: 'Enterprise',   priceKES: 9999 },
};

// ── Shared IntaSend fetch ─────────────────────────────────────────────────────
const intasend = async (path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${INTASEND_API}` },
    body:    JSON.stringify(body),
  });
  return res.json();
};

// ── M-Pesa STK Push ───────────────────────────────────────────────────────────
const mpesaStkPush = async (req, res) => {
  const { phone, amount, planId } = req.body;
  if (!phone || !amount || !planId)
    return res.status(400).json({ success: false, result: null, message: 'phone, amount and planId are required.' });
  if (!INTASEND_API)
    return res.status(400).json({ success: false, result: null, message: 'M-Pesa not configured. Contact hempstonetinga@gmail.com.' });

  // Normalize phone to 254...
  const rawPhone = String(phone).replace(/\D/g, '');
  const normalized = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1)
    : rawPhone.startsWith('254') ? rawPhone
    : '254' + rawPhone;

  try {
    const data = await intasend('/api/v1/payment/mpesa-stk-push/', {
      currency:    'KES',
      amount:      String(amount),
      phone_number: normalized,
      narrative:   `Tomo ${PLANS[planId]?.name || planId} subscription`,
      api_ref:     `tomo-${req.user._id}-${planId}-${Date.now()}`,
      callback_url: `${process.env.BACKEND_URL || FRONTEND_URL}/api/payments/mpesa/callback`,
    });

    if (data.invoice?.invoice_id) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(req.user._id, {
        'pendingPayment.planId':            planId,
        'pendingPayment.phone':             normalized,
        'pendingPayment.checkoutRequestId': data.invoice.invoice_id,
        'pendingPayment.startedAt':         new Date(),
      });
      return res.status(200).json({
        success: true,
        result:  { checkoutRequestId: data.invoice.invoice_id },
        message: 'M-Pesa prompt sent. Check your phone.',
      });
    }
    return res.status(400).json({ success: false, result: null, message: data.detail || data.message || 'M-Pesa request failed.' });
  } catch (err) {
    console.error('[M-Pesa STK]', err.message);
    return res.status(500).json({ success: false, result: null, message: 'M-Pesa service unavailable. Try again.' });
  }
};

// ── M-Pesa status poll ────────────────────────────────────────────────────────
const mpesaStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;
  if (!INTASEND_API)
    return res.status(200).json({ success: true, result: { status: 'pending' }, message: 'Checking...' });
  try {
    const data  = await intasend('/api/v1/payment/status/', { invoice_id: checkoutRequestId });
    const state = data.invoice?.state;

    if (state === 'COMPLETE') {
      const User = mongoose.model('User');
      const user = await User.findOne({ 'pendingPayment.checkoutRequestId': checkoutRequestId });
      if (user) {
        const planId = user.pendingPayment?.planId;
        await User.findByIdAndUpdate(user._id, {
          plan:            planId,
          planActivatedAt: new Date(),
          pendingPayment:  null,
        });
        sendEmail({
          to:      user.email,
          subject: `[Tomo] Payment confirmed — ${PLANS[planId]?.name} plan active!`,
          html:    `<p>Hi ${user.name}, your M-Pesa payment was received. Your <strong>${PLANS[planId]?.name}</strong> plan is now active. <a href="${FRONTEND_URL}">Open Tomo</a></p>`,
        });
      }
      return res.status(200).json({ success: true, result: { status: 'paid' }, message: 'Payment confirmed.' });
    }
    if (['FAILED', 'CANCELLED'].includes(state))
      return res.status(200).json({ success: true, result: { status: 'failed' }, message: 'Payment not completed.' });
    return res.status(200).json({ success: true, result: { status: 'pending' }, message: 'Waiting for payment...' });
  } catch (err) {
    return res.status(200).json({ success: true, result: { status: 'pending' }, message: 'Checking...' });
  }
};

// ── IntaSend Card checkout ────────────────────────────────────────────────────
const cardCheckout = async (req, res) => {
  const { planId, email } = req.body;
  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ success: false, result: null, message: 'Invalid plan.' });
  if (!INTASEND_API)
    return res.status(400).json({ success: false, result: null, message: 'Card payments not configured. Contact hempstonetinga@gmail.com.' });

  try {
    // IntaSend collection link API
    const data = await intasend('/api/v1/payment/collection/', {
      currency:     'KES',
      amount:       String(plan.priceKES),
      email:        email || req.user.email,
      first_name:   req.user.name.split(' ')[0] || req.user.name,
      last_name:    req.user.name.split(' ').slice(1).join(' ') || '',
      method:       'CARD-PAYMENT',
      api_ref:      `tomo-card-${req.user._id}-${planId}-${Date.now()}`,
      redirect_url: `${FRONTEND_URL}?payment=success&plan=${planId}`,
      cancel_url:   `${FRONTEND_URL}?payment=cancelled`,
    });

    if (data.url || data.checkout_url) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(req.user._id, {
        'pendingPayment.planId':    planId,
        'pendingPayment.startedAt': new Date(),
      });
      return res.status(200).json({
        success: true,
        result:  { url: data.url || data.checkout_url },
        message: 'Card checkout created.',
      });
    }
    return res.status(400).json({ success: false, result: null, message: data.detail || 'Card checkout failed.' });
  } catch (err) {
    console.error('[Card checkout]', err.message);
    return res.status(500).json({ success: false, result: null, message: 'Card payment service unavailable.' });
  }
};

// ── IntaSend webhook callback ─────────────────────────────────────────────────
const mpesaCallback = async (req, res) => {
  console.log('[IntaSend Callback]', JSON.stringify(req.body));
  // IntaSend posts payment result here — we primarily rely on polling
  // but also handle webhook for reliability
  const { invoice } = req.body;
  if (invoice?.state === 'COMPLETE' && invoice?.api_ref) {
    const parts  = invoice.api_ref.split('-');  // tomo-{userId}-{planId}-{ts}
    const userId = parts[1];
    const planId = parts[2];
    if (userId && planId && PLANS[planId]) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(userId, {
        plan:            planId,
        planActivatedAt: new Date(),
        pendingPayment:  null,
      });
      console.log(`[IntaSend] Plan ${planId} activated for user ${userId} via webhook`);
    }
  }
  res.status(200).json({ received: true });
};

// Stripe webhook stub — not used, kept to avoid 404 if someone hits it
const stripeWebhook = (req, res) => res.status(404).json({ message: 'Stripe not configured.' });

module.exports = { mpesaStkPush, mpesaStatus, cardCheckout, mpesaCallback, stripeWebhook };
