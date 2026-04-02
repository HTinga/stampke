'use strict';
const supabase = require('@/config/supabase');

const INTASEND_API = process.env.INTASEND_API_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';
const IS_SANDBOX   = !INTASEND_API || INTASEND_API.includes('test') || INTASEND_API.includes('_test') || process.env.NODE_ENV === 'development';
const BASE_URL     = IS_SANDBOX ? 'https://sandbox.intasend.com' : 'https://payment.intasend.com';

const PLANS = {
  starter:    { name: 'Starter',      priceKES: 1000  },
  pro:        { name: 'Professional', priceKES: 2500  },
  business:   { name: 'Business',     priceKES: 7500 },
};

const intasend = async (path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${INTASEND_API}` },
    body:    JSON.stringify(body),
  });
  return res.json();
};

const mpesaStkPush = async (req, res) => {
  const { phone, amount, planId } = req.body;
  if (!phone || !amount || !planId)
    return res.status(400).json({ success: false, result: null, message: 'phone, amount and planId are required.' });
  if (!INTASEND_API)
    return res.status(400).json({ success: false, result: null, message: 'M-Pesa not configured.' });

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
      api_ref:     `tomo-${req.user.id}-${planId}-${Date.now()}`,
      callback_url: `${process.env.BACKEND_URL || FRONTEND_URL}/api/payments/mpesa/callback`,
    });

    if (data.invoice?.invoice_id) {
      await supabase
        .from('users')
        .update({
          pending_payment: {
            planId: planId,
            phone: normalized,
            checkoutRequestId: data.invoice.invoice_id,
            startedAt: new Date()
          }
        })
        .eq('id', req.user.id);

      return res.status(200).json({
        success: true,
        result:  { checkoutRequestId: data.invoice.invoice_id },
        message: 'M-Pesa prompt sent. Check your phone.',
      });
    }
    return res.status(400).json({ success: false, result: null, message: data.detail || data.message || 'M-Pesa request failed.' });
  } catch (err) {
    console.error('[M-Pesa STK]', err.message);
    return res.status(500).json({ success: false, result: null, message: 'M-Pesa service unavailable.' });
  }
};

const mpesaStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;
  if (!INTASEND_API)
    return res.status(200).json({ success: true, result: { status: 'pending' }, message: 'Checking...' });
  try {
    const data  = await intasend('/api/v1/payment/status/', { invoice_id: checkoutRequestId });
    const state = data.invoice?.state;

    if (state === 'COMPLETE') {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('pending_payment->>checkoutRequestId', checkoutRequestId)
        .single();
      
      if (user) {
        const planId = user.pending_payment?.planId;
        await supabase
          .from('users')
          .update({
            plan: planId,
            plan_activated_at: new Date(),
            pending_payment: null,
          })
          .eq('id', user.id);
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

const cardCheckout = async (req, res) => {
  const { planId, email } = req.body;
  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ success: false, result: null, message: 'Invalid plan.' });

  try {
    const data = await intasend('/api/v1/payment/collection/', {
      currency:     'KES',
      amount:       String(plan.priceKES),
      email:        email || req.user.email,
      first_name:   req.user.name?.split(' ')[0] || req.user.name || '',
      last_name:    req.user.name?.split(' ').slice(1).join(' ') || '',
      method:       'CARD-PAYMENT',
      api_ref:      `tomo-card-${req.user.id}-${planId}-${Date.now()}`,
      redirect_url: `${FRONTEND_URL}?payment=success&plan=${planId}`,
      cancel_url:   `${FRONTEND_URL}?payment=cancelled`,
    });

    if (data.url || data.checkout_url) {
      await supabase
        .from('users')
        .update({
          pending_payment: {
            planId: planId,
            startedAt: new Date()
          }
        })
        .eq('id', req.user.id);

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

const mpesaCallback = async (req, res) => {
  const { invoice } = req.body;
  if (invoice?.state === 'COMPLETE' && invoice?.api_ref) {
    const parts  = invoice.api_ref.split('-');
    const userId = parts[1];
    const planId = parts[2];
    if (userId && planId && PLANS[planId]) {
      await supabase
        .from('users')
        .update({
          plan: planId,
          plan_activated_at: new Date(),
          pending_payment: null,
        })
        .eq('id', userId);
    }
  }
  res.status(200).json({ received: true });
};

const stripeWebhook = (req, res) => res.status(404).json({ message: 'Stripe not configured.' });

module.exports = { mpesaStkPush, mpesaStatus, cardCheckout, mpesaCallback, stripeWebhook };

