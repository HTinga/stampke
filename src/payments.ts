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
// No free tier — each feature gets 1 trial use, then paywall
export const PLANS = {
  starter: {
    id: 'starter', name: 'Starter', price: 1000, currency: 'KES', period: '/month',
    features: ['eSign (unlimited)', 'Stamp Designer', 'Apply Stamp to PDF', 'Stamp Templates', 'AI Stamp Digitizer'],
    flutterwavePriceKES: 1000,
    mpesaPriceKES: 1000,
  },
  pro: {
    id: 'pro', name: 'Professional', price: 2500, currency: 'KES', period: '/month',
    features: ['Everything in Starter', 'Smart Invoice & Payments', 'PDF Editor & Annotations', 'AI Audio Summarizer', 'Document Templates', 'Priority support'],
    flutterwavePriceKES: 2500,
    mpesaPriceKES: 2500,
  },
  business: {
    id: 'business', name: 'Business', price: 7500, currency: 'KES', period: '/month',
    features: ['Everything in Professional', 'Virtual Assistants Platform', 'Web Scrapping Tool', 'Admin sub-accounts', 'White-label branding', 'Dedicated support'],
    flutterwavePriceKES: 7500,
    mpesaPriceKES: 7500,
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ── Card payment via Flutterwave ──────────────────────────────────────────────
// Returns a Flutterwave hosted checkout URL — user pays, is redirected back
export async function startCardPayment(planId: 'starter' | 'pro' | 'business', email?: string): Promise<void> {
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
  planId: 'starter' | 'pro' | 'business',
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
