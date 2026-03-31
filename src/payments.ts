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
    price: 650,
    currency: 'KES',
    period: '/month',
    description: 'For individuals and freelancers.',
    popular: false,
    mpesaPriceKES: 650,
    features: [
      'eSign — sign & collect signatures',
      'Stamp Designer & Applier',
      'Smart Invoice (unlimited)',
      'Find Workers (browse)',
      'Add Clients',
      'Email support',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 2500,
    currency: 'KES',
    period: '/month',
    description: 'For growing businesses and teams.',
    popular: true,
    mpesaPriceKES: 2500,
    features: [
      'Everything in Starter',
      'PDF Editor & Presentations',
      'AI Receipt/Invoice Scanner',
      'Client CRM & Lead Tracking',
      'Recruit & Track (unlimited)',
      'WhatsApp Invoice Sharing',
      'Email Reminders',
      'Team Members (up to 5)',
      'Priority support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 5000,
    currency: 'KES',
    period: '/month',
    description: 'For large organisations.',
    popular: false,
    mpesaPriceKES: 5000,
    features: [
      'Everything in Professional',
      'Admin Panel access',
      'Unlimited team members',
      'White-label branding',
      'Dedicated account manager',
      'SLA & priority onboarding',
      'Custom integrations',
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
