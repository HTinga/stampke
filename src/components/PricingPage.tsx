import React, { useState } from 'react';
import { Check, Zap, Crown, ArrowRight, Smartphone, CreditCard, X, Loader2, Shield, Star } from 'lucide-react';
import { PLANS, startMpesaPayment, startCardPayment, checkMpesaStatus, formatPrice } from '../payments';
import type { PlanId } from '../payments';

interface PricingPageProps {
  userEmail?: string;
  userName?:  string;
  currentPlan?: string;
  onClose?: () => void;
}

type MpesaStep = 'phone' | 'waiting' | 'done' | 'failed';

export default function PricingPage({ userEmail = '', userName = '', currentPlan = 'trial', onClose }: PricingPageProps) {
  const [loading, setLoading]       = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaFlow, setMpesaFlow]   = useState<{ planId: PlanId; step: MpesaStep; reqId?: string } | null>(null);

  // ── Card (Flutterwave hosted) ─────────────────────────────────────────────
  const handleCard = async (planId: PlanId) => {
    setError(''); setLoading(`card-${planId}`);
    try { await startCardPayment(planId, userEmail); }
    catch (e: any) { setError(e.message); setLoading(null); }
  };

  // ── M-Pesa ────────────────────────────────────────────────────────────────
  const submitMpesa = async () => {
    if (!mpesaFlow) return;
    const digits = mpesaPhone.replace(/\D/g, '');
    if (digits.length < 9) { setError('Enter a valid Safaricom number e.g. 0712 345 678'); return; }
    setError(''); setLoading('mpesa');
    try {
      const { checkoutRequestId } = await startMpesaPayment(mpesaFlow.planId, digits);
      setMpesaFlow(f => f ? { ...f, step: 'waiting', reqId: checkoutRequestId } : null);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const status = await checkMpesaStatus(checkoutRequestId);
        if (status === 'paid')              { clearInterval(poll); setMpesaFlow(f => f ? { ...f, step: 'done' }   : null); setLoading(null); }
        if (status === 'failed' || attempts >= 20) { clearInterval(poll); setMpesaFlow(f => f ? { ...f, step: 'failed' } : null); setLoading(null); }
      }, 3000);
    } catch (e: any) { setError(e.message); setLoading(null); }
  };

  const planList = [PLANS.starter, PLANS.professional, PLANS.enterprise];
  const isPaid   = currentPlan === 'starter' || currentPlan === 'professional' || currentPlan === 'enterprise';

  const planIcon = (id: string) => {
    if (id === 'enterprise') return <Crown size={15} className="text-purple-400" />;
    if (id === 'professional') return <Zap size={15} className="text-[#58a6ff]" />;
    return <Star size={15} className="text-emerald-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="text-center mb-10 relative">
        {onClose && <button onClick={onClose} className="absolute right-0 top-0 p-2 text-[#8b949e] hover:text-white"><X size={20} /></button>}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1f6feb]/15 border border-[#1f6feb]/30 rounded-full mb-4">
          <Shield size={13} className="text-[#58a6ff]" />
          <span className="text-xs font-semibold text-[#58a6ff]">Pay via M-Pesa or Card · Secured by IntaSend</span>
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Simple, honest pricing</h2>
        <p className="text-[#8b949e]">Each feature includes <strong className="text-white">1 free trial</strong>. Upgrade to unlock unlimited access.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        {planList.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const isPop     = plan.id === 'professional';
          return (
            <div key={plan.id} className={`relative flex flex-col bg-[#161b22] border rounded-2xl p-6 ${isPop ? 'border-[#1f6feb] ring-1 ring-[#1f6feb]/20' : 'border-[#30363d]'}`}>
              {isPop && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#1f6feb] rounded-full text-[10px] font-black text-white uppercase tracking-wider">Most Popular</div>}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {planIcon(plan.id)}
                  <h3 className="font-bold text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{formatPrice(plan.price)}</span>
                  <span className="text-[#8b949e] text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#e6edf3]">
                    <Check size={12} className="text-emerald-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full py-2.5 bg-[#21262d] text-[#8b949e] rounded-xl text-sm font-bold text-center">Current Plan</div>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => handleCard(plan.id as PlanId)} disabled={!!loading}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${isPop ? 'bg-[#1f6feb] hover:bg-[#388bfd] text-white' : 'bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white'}`}>
                    {loading === `card-${plan.id}` ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                    Pay by Card
                  </button>
                  <button onClick={() => { setMpesaFlow({ planId: plan.id as PlanId, step: 'phone' }); setError(''); }} disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00a550]/15 hover:bg-[#00a550]/25 text-[#00d265] border border-[#00a550]/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                    <Smartphone size={13} /> Pay with M-Pesa
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-xl mb-4">{error}</p>}

      <p className="text-center text-xs text-[#8b949e]">
        Payments processed by <strong className="text-white">IntaSend</strong> · Safaricom M-Pesa &amp; Visa/Mastercard accepted ·
        Questions? <a href="mailto:support@stampke.com" className="text-[#58a6ff] hover:underline">support@stampke.com</a>
      </p>

      {/* M-Pesa modal */}
      {mpesaFlow && (
        <div className="fixed inset-0 bg-[#0d1117]/95 z-[700] flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-full max-w-sm text-center space-y-5">
            {mpesaFlow.step === 'phone' && <>
              <div className="w-14 h-14 bg-[#00a550]/15 rounded-2xl flex items-center justify-center mx-auto"><Smartphone size={28} className="text-[#00d265]" /></div>
              <h3 className="font-bold text-white text-lg">Pay with M-Pesa</h3>
              <p className="text-[#8b949e] text-sm">Enter your Safaricom number. You'll receive an STK push to confirm <strong className="text-white">{formatPrice(PLANS[mpesaFlow.planId].price)}/mo</strong></p>
              <input type="tel" placeholder="0712 345 678" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00a550]" />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setMpesaFlow(null); setError(''); }} className="flex-1 py-3 bg-[#21262d] text-[#8b949e] rounded-xl text-sm font-bold">Cancel</button>
                <button onClick={submitMpesa} disabled={loading === 'mpesa'}
                  className="flex-1 py-3 bg-[#00a550] hover:bg-[#00c060] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading === 'mpesa' ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />} Send Request
                </button>
              </div>
            </>}
            {mpesaFlow.step === 'waiting' && <>
              <Loader2 size={40} className="animate-spin text-[#00d265] mx-auto" />
              <h3 className="font-bold text-white">Check Your Phone</h3>
              <p className="text-[#8b949e] text-sm">An M-Pesa prompt was sent to <strong className="text-white">{mpesaPhone}</strong>. Enter your PIN to complete payment.</p>
              <p className="text-xs text-[#8b949e]">This window will update automatically...</p>
            </>}
            {mpesaFlow.step === 'done' && <>
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto"><Check size={28} className="text-emerald-400" /></div>
              <h3 className="font-bold text-white">Payment Successful! 🎉</h3>
              <p className="text-[#8b949e] text-sm">Your {PLANS[mpesaFlow.planId].name} plan is now active.</p>
              <button onClick={() => window.location.reload()} className="w-full py-3 bg-[#1f6feb] text-white rounded-xl font-bold text-sm">Continue to StampKE</button>
            </>}
            {mpesaFlow.step === 'failed' && <>
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto"><X size={28} className="text-red-400" /></div>
              <h3 className="font-bold text-white">Payment Not Completed</h3>
              <p className="text-[#8b949e] text-sm">The request timed out or was cancelled. Please try again.</p>
              <div className="flex gap-3">
                <button onClick={() => { setMpesaFlow(null); setError(''); }} className="flex-1 py-3 bg-[#21262d] text-[#8b949e] rounded-xl text-sm font-bold">Cancel</button>
                <button onClick={() => setMpesaFlow({ ...mpesaFlow, step: 'phone' })} className="flex-1 py-3 bg-[#00a550] text-white rounded-xl text-sm font-bold">Try Again</button>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
