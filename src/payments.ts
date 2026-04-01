// ── Payments: IntaSend ONLY (M-Pesa STK + Card) ───────────────────────────────
// IntaSend: intasend.com — Kenya M-Pesa and international cards
// NO Flutterwave, NO Stripe — IntaSend only as instructed

const apiUrl = () => (import.meta as any).env?.VITE_API_URL || '';
const token  = () => localStorage.getItem('tomo_token') || '';

const authFetch = (path: string, opts: RequestInit = {}) =>
  fetch(`${apiUrl()}/api${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    ...opts,
  }).then(r => r.json());

// ── Plans: 3 tiers, correct prices, NO trial, NO free tier ────────────────────
// Only superadmin gets free access. All other users must pay.
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 1500,
    currency: 'KES',
    period: '/month',
    description: 'For individuals and freelancers.',
    popular: false,
    mpesaPriceKES: 1500,
    features: [
      'eSign — unlimited signatures',
      'Stamp Designer & Applier',
      'Smart Invoice (unlimited)',
      'Virtual Assistants',
      'Email support',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 3000,
    currency: 'KES',
    period: '/month',
    description: 'For growing businesses and teams.',
    popular: true,
    mpesaPriceKES: 3000,
    features: [
      'Everything in Starter',
      'PDF Editor & Transcriber',
      'Priority support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 10000,
    currency: 'KES',
    period: '/year',
    description: 'For large organisations & offline use.',
    popular: false,
    mpesaPriceKES: 10000,
    features: [
      'Everything in Professional',
      'Download App (Desktop & Mobile)',
      'API Package (eSign, Stamp, Invoice, Transcriber)',
      'Virtual Assistants (Priority)',
      'Dedicated account manager',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ── M-Pesa STK push (via IntaSend) ───────────────────────────────────────────
export async function startMpesaPayment(
  planId: PlanId,
  phone: string,
): Promise<{ checkoutRequestId: string }> {
  const data = await authFetch('/payments/mpesa/stk-push', {
    method: 'POST',
    body: JSON.stringify({ planId, phone }),
  });
  if (!data.success) throw new Error(data.message || 'M-Pesa payment failed.');
  return { checkoutRequestId: data.result.checkoutRequestId };
}

// ── Card payment (via IntaSend) ───────────────────────────────────────────────
export async function startCardPayment(planId: PlanId, email?: string): Promise<void> {
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

// ── Poll M-Pesa status ────────────────────────────────────────────────────────
export async function checkMpesaStatus(
  checkoutRequestId: string,
): Promise<'pending' | 'paid' | 'failed'> {
  const data = await authFetch(`/payments/mpesa/status/${checkoutRequestId}`);
  return data.result?.status || 'pending';
}

export function formatPrice(amount: number, currency = 'KES'): string {
  return `${currency} ${amount.toLocaleString('en-KE')}`;
}
