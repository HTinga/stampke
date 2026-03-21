import React, { useState } from 'react';
import { Check, Zap, Crown, ArrowRight, Smartphone, CreditCard, X, Loader2 } from 'lucide-react';
import { PLANS, startStripeCheckout, startMpesaPayment, checkMpesaStatus, formatPrice } from '../src/payments';

interface PricingPageProps {
  userEmail?: string;
  currentPlan?: string;
  onClose?: () => void;
}

export default function PricingPage({ userEmail = '', currentPlan = 'trial', onClose }: PricingPageProps) {
  const [loading, setLoading]       = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaFlow, setMpesaFlow]   = useState<{ planId: 'pro' | 'enterprise'; step: 'phone' | 'waiting' | 'done' | 'failed'; reqId?: string } | null>(null);
  const [error, setError]           = useState('');

  const handleStripe = async (planId: 'pro' | 'enterprise') => {
    setError('');
    setLoading(`stripe-${planId}`);
    try {
      await startStripeCheckout(planId, userEmail);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const handleMpesaStart = (planId: 'pro' | 'enterprise') => {
    setMpesaFlow({ planId, step: 'phone' });
    setError('');
  };

  const handleMpesaSubmit = async () => {
    if (!mpesaFlow) return;
    const phone = mpesaPhone.replace(/\D/g, '');
    if (phone.length < 9) { setError('Enter a valid Safaricom number e.g. 0712345678'); return; }
    // Normalize to 254...
    const normalized = phone.startsWith('0') ? '254' + phone.slice(1) : phone.startsWith('254') ? phone : '254' + phone;
    setError('');
    setLoading('mpesa');
    try {
      const { checkoutRequestId } = await startMpesaPayment(mpesaFlow.planId, normalized, userEmail);
      setMpesaFlow({ ...mpesaFlow, step: 'waiting', reqId: checkoutRequestId });
      // Poll every 3s up to 60s
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const status = await checkMpesaStatus(checkoutRequestId);
        if (status === 'paid') { clearInterval(poll); setMpesaFlow(f => f ? { ...f, step: 'done' } : null); setLoading(null); }
        if (status === 'failed' || attempts >= 20) { clearInterval(poll); setMpesaFlow(f => f ? { ...f, step: 'failed' } : null); setLoading(null); }
      }, 3000);
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  };

  const planList = [PLANS.free, PLANS.pro, PLANS.enterprise];

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="text-center mb-12 relative">
        {onClose && (
          <button onClick={onClose} className="absolute right-0 top-0 p-2 text-[#8b949e] hover:text-white">
            <X size={20} />
          </button>
        )}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1f6feb]/15 border border-[#1f6feb]/30 rounded-full mb-4">
          <Zap size={13} className="text-[#58a6ff]" />
          <span className="text-xs font-semibold text-[#58a6ff]">Pay via Card or M-Pesa</span>
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Simple, honest pricing</h2>
        <p className="text-[#8b949e]">eSign & Stamp Designer are <strong className="text-white">always free</strong>. Unlock everything else.</p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {planList.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const isPop     = plan.id === 'pro';

          return (
            <div key={plan.id} className={`relative bg-[#161b22] border rounded-2xl p-6 flex flex-col ${isPop ? 'border-[#1f6feb] ring-1 ring-[#1f6feb]/30' : 'border-[#30363d]'}`}>
              {isPop && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#1f6feb] rounded-full text-[10px] font-black text-white uppercase tracking-wider">Most Popular</div>
              )}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  {plan.id === 'enterprise' ? <Crown size={16} className="text-purple-400" /> : plan.id === 'pro' ? <Zap size={16} className="text-[#58a6ff]" /> : <Check size={16} className="text-emerald-400" />}
                  <h3 className="font-bold text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{plan.price === 0 ? 'Free' : formatPrice(plan.price)}</span>
                  {plan.price > 0 && <span className="text-[#8b949e] text-sm">/ month</span>}
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#e6edf3]">
                    <Check size={13} className="text-emerald-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 bg-[#21262d] text-[#8b949e] rounded-xl text-sm font-bold text-center">Current Plan</div>
              ) : plan.price === 0 ? (
                <div className="w-full py-2.5 bg-[#0d1117] border border-[#30363d] text-[#8b949e] rounded-xl text-sm font-bold text-center">Included</div>
              ) : (
                <div className="space-y-2">
                  {/* Stripe */}
                  <button
                    onClick={() => handleStripe(plan.id as 'pro' | 'enterprise')}
                    disabled={!!loading}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${isPop ? 'bg-[#1f6feb] hover:bg-[#388bfd] text-white' : 'bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d]'} disabled:opacity-50`}>
                    {loading === `stripe-${plan.id}` ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    Pay with Card
                  </button>
                  {/* M-Pesa */}
                  <button
                    onClick={() => handleMpesaStart(plan.id as 'pro' | 'enterprise')}
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00a550]/15 hover:bg-[#00a550]/25 text-[#00d265] border border-[#00a550]/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                    <Smartphone size={14} /> Pay with M-Pesa
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-xl">{error}</p>}

      {/* M-Pesa phone entry modal */}
      {mpesaFlow && (
        <div className="fixed inset-0 bg-[#0d1117]/95 z-[700] flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-full max-w-sm text-center space-y-5">
            {mpesaFlow.step === 'phone' && (
              <>
                <div className="w-14 h-14 bg-[#00a550]/15 rounded-2xl flex items-center justify-center mx-auto">
                  <Smartphone size={28} className="text-[#00d265]" />
                </div>
                <h3 className="font-bold text-white text-lg">Enter M-Pesa Number</h3>
                <p className="text-[#8b949e] text-sm">You'll receive an STK push on your phone to confirm the payment of <strong className="text-white">{formatPrice(PLANS[mpesaFlow.planId].mpesaPriceKES)}</strong></p>
                <input
                  type="tel" placeholder="e.g. 0712 345 678" value={mpesaPhone}
                  onChange={e => setMpesaPhone(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00a550]" />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setMpesaFlow(null); setError(''); }} className="flex-1 py-3 bg-[#21262d] text-[#8b949e] rounded-xl text-sm font-bold">Cancel</button>
                  <button onClick={handleMpesaSubmit} disabled={loading === 'mpesa'}
                    className="flex-1 py-3 bg-[#00a550] hover:bg-[#00c060] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading === 'mpesa' ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Send Request
                  </button>
                </div>
              </>
            )}
            {mpesaFlow.step === 'waiting' && (
              <>
                <Loader2 size={40} className="animate-spin text-[#00d265] mx-auto" />
                <h3 className="font-bold text-white">Check Your Phone</h3>
                <p className="text-[#8b949e] text-sm">An M-Pesa payment request has been sent to <strong className="text-white">{mpesaPhone}</strong>. Enter your PIN to complete.</p>
                <p className="text-xs text-[#8b949e]">Waiting for confirmation...</p>
              </>
            )}
            {mpesaFlow.step === 'done' && (
              <>
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Check size={28} className="text-emerald-400" />
                </div>
                <h3 className="font-bold text-white">Payment Successful! 🎉</h3>
                <p className="text-[#8b949e] text-sm">Your plan has been upgraded. Refresh the page to access all features.</p>
                <button onClick={() => window.location.reload()} className="w-full py-3 bg-[#1f6feb] text-white rounded-xl font-bold text-sm">Refresh Now</button>
              </>
            )}
            {mpesaFlow.step === 'failed' && (
              <>
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <X size={28} className="text-red-400" />
                </div>
                <h3 className="font-bold text-white">Payment Not Completed</h3>
                <p className="text-[#8b949e] text-sm">The M-Pesa request timed out or was cancelled. Please try again.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setMpesaFlow(null); setError(''); }} className="flex-1 py-3 bg-[#21262d] text-[#8b949e] rounded-xl text-sm font-bold">Cancel</button>
                  <button onClick={() => setMpesaFlow({ ...mpesaFlow, step: 'phone' })} className="flex-1 py-3 bg-[#00a550] text-white rounded-xl text-sm font-bold">Try Again</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-[#8b949e] mt-6">
        Payments secured by Stripe & Safaricom M-Pesa · Cancel anytime · 
        Questions? <a href="mailto:hempstonetinga@gmail.com" className="text-[#58a6ff] hover:underline">hempstonetinga@gmail.com</a>
      </p>
    </div>
  );
}
