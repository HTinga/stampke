// ── Payments: Flutterwave (cards) + M-Pesa (STK push) ────────────────────────
// Flutterwave: Visa/Mastercard — works in Kenya + 30+ African countries
//              3.8% per transaction — dashboard.flutterwave.com
// M-Pesa:      Safaricom STK push via IntaSend — intasend.com
// NO Stripe — not accessible from Kenya

const apiUrl = () => (import.meta as any).env?.VITE_API_URL || '';
const token  = () => localStorage.getItem('tomo_token') || '';

const authFetch = (path: string, opts: RequestInit = {}) =>
  fetch(`${apiUrl()}/api${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    ...opts,
  }).then(r => r.json());

// ── Subscription plans ────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id: 'free', name: 'Free', price: 0, currency: 'KES',
    features: ['eSign (unlimited)', 'Stamp Designer', 'Stamp Templates'],
    flutterwavePriceKES: 0,
    mpesaPriceKES: 0,
  },
  pro: {
    id: 'pro', name: 'Professional', price: 2499, currency: 'KES', period: 'month',
    features: ['Everything in Free', 'Smart Invoice', 'Client CRM', 'PDF Editor', 'WorkHub', 'AI Tools', 'Priority support'],
    flutterwavePriceKES: 2499,
    mpesaPriceKES: 2499,
  },
  enterprise: {
    id: 'enterprise', name: 'Enterprise', price: 9999, currency: 'KES', period: 'month',
    features: ['Everything in Pro', 'Admin sub-accounts', 'White-label', 'Dedicated support', 'Custom integrations'],
    flutterwavePriceKES: 9999,
    mpesaPriceKES: 9999,
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ── Card payment via Flutterwave ──────────────────────────────────────────────
// Returns a Flutterwave hosted checkout URL — user pays, is redirected back
export async function startCardPayment(planId: 'pro' | 'enterprise', email?: string): Promise<void> {
  const data = await authFetch('/payments/card/checkout', {
    method: 'POST',
    body: JSON.stringify({ planId, email }),
  });
  if (data.success && data.result?.url) {
    window.location.href = data.result.url;
  } else {
    throw new Error(data.message || 'Card checkout failed.');
  }
}

// ── M-Pesa STK push ───────────────────────────────────────────────────────────
export async function startMpesaPayment(
  planId: 'pro' | 'enterprise',
  phone: string,
): Promise<{ checkoutRequestId: string }> {
  const data = await authFetch('/payments/mpesa/stk-push', {
    method: 'POST',
    body: JSON.stringify({ planId, phone }),
  });
  if (!data.success) throw new Error(data.message || 'M-Pesa payment failed.');
  return { checkoutRequestId: data.result.checkoutRequestId };
}

// ── Poll M-Pesa payment status ────────────────────────────────────────────────
export async function checkMpesaStatus(
  checkoutRequestId: string,
): Promise<'pending' | 'paid' | 'failed'> {
  const data = await authFetch(`/payments/mpesa/status/${checkoutRequestId}`);
  return data.result?.status || 'pending';
}

// ── Format price ──────────────────────────────────────────────────────────────
export function formatPrice(amount: number, currency = 'KES'): string {
  if (currency === 'KES') return `KES ${amount.toLocaleString('en-KE')}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
