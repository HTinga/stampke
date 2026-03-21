// ── Payments: Stripe (international) + M-Pesa (Kenya) ────────────────────────
// Stripe:  cards, Apple Pay, Google Pay — 2.9% + $0.30 per transaction
// M-Pesa:  Kenya mobile money via IntaSend — most Kenyan users prefer this
// Docs: https://stripe.com/docs  |  https://intasend.com/docs

// ── Stripe ────────────────────────────────────────────────────────────────────
export const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

// Subscription plans — match Stripe product IDs in your dashboard
export const PLANS = {
  free: {
    id:       'free',
    name:     'Free',
    price:    0,
    currency: 'KES',
    features: ['eSign', 'Stamp Designer'],
    stripePriceId: null,
  },
  pro: {
    id:       'pro',
    name:     'Professional',
    price:    2499,
    currency: 'KES',
    period:   'month',
    features: ['All tools', 'Invoicing', 'Client CRM', 'Smart Invoice', 'WorkHub'],
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID as string,
    mpesaPriceKES: 2499,
  },
  enterprise: {
    id:         'enterprise',
    name:       'Enterprise',
    price:      9999,
    currency:   'KES',
    period:     'month',
    features:   ['Everything in Pro', 'White-label', 'Priority support', 'Custom integrations'],
    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID as string,
    mpesaPriceKES: 9999,
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ── Start Stripe Checkout ─────────────────────────────────────────────────────
export async function startStripeCheckout(planId: 'pro' | 'enterprise', userEmail: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const token  = localStorage.getItem('tomo_token') || '';

  const res = await fetch(`${apiUrl}/api/payments/stripe/checkout`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ planId, email: userEmail }),
  });
  const data = await res.json();

  if (data.success && data.result?.url) {
    window.location.href = data.result.url;  // redirect to Stripe hosted checkout
  } else {
    throw new Error(data.message || 'Failed to start checkout');
  }
}

// ── Start M-Pesa STK Push ─────────────────────────────────────────────────────
// Triggers an M-Pesa payment prompt on the user's phone
export async function startMpesaPayment(
  planId: 'pro' | 'enterprise',
  phone: string,  // Format: 254712345678
  userEmail: string
): Promise<{ checkoutRequestId: string }> {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const token  = localStorage.getItem('tomo_token') || '';
  const plan   = PLANS[planId];

  const res = await fetch(`${apiUrl}/api/payments/mpesa/stk-push`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({
      phone,
      amount:  plan.mpesaPriceKES,
      planId,
      email:   userEmail,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'M-Pesa payment failed');
  return { checkoutRequestId: data.result.checkoutRequestId };
}

// ── Poll M-Pesa payment status ─────────────────────────────────────────────────
export async function checkMpesaStatus(checkoutRequestId: string): Promise<'pending' | 'paid' | 'failed'> {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const token  = localStorage.getItem('tomo_token') || '';

  const res  = await fetch(`${apiUrl}/api/payments/mpesa/status/${checkoutRequestId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.result?.status || 'pending';
}

// ── Format price for display ──────────────────────────────────────────────────
export function formatPrice(amount: number, currency = 'KES'): string {
  if (currency === 'KES') return `KES ${amount.toLocaleString('en-KE')}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
}
