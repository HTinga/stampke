import React, { useState } from 'react';
import { Check, Zap, Crown, Shield, CreditCard, Smartphone, Loader2, X, AlertCircle } from 'lucide-react';
import { PLANS, startStripeCheckout, startMpesaPayment, checkMpesaStatus, formatPrice } from '../src/payments';

interface UpgradeModalProps {
  userEmail: string;
  currentPlan: string;
  onClose: () => void;
}

const FEATURE_LISTS = {
  free:       ['eSign (unlimited)', 'Stamp Designer', 'Stamp Applier', 'Basic templates'],
  pro:        ['Everything in Free', 'Smart Invoice', 'Client CRM', 'PDF Editor', 'AI Scanner', 'WorkHub', 'DocumentsHub', 'Activity Log'],
  enterprise: ['Everything in Pro', 'White-label branding', 'Priority support', 'Custom integrations', 'Team accounts'],
};

export default function UpgradeModal({ userEmail, currentPlan, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [payMethod, setPayMethod]       = useState<'stripe' | 'mpesa'>('mpesa');
  const [mpesaPhone, setMpesaPhone]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [mpesaPending, setMpesaPending] = useState<string | null>(null);
  const [error, setError]               = useState('');
  const [pollCount, setPollCount]       = useState(0);

  const plan = PLANS[selectedPlan];

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      if (payMethod === 'stripe') {
        await startStripeCheckout(selectedPlan, userEmail);
        // redirects to Stripe — no further action needed
      } else {
        // M-Pesa STK push
        if (!mpesaPhone.match(/^(254|0)[17]\d{8}$/)) {
          setError('Enter a valid Kenyan phone number (e.g. 0712345678 or 254712345678)');
          setLoading(false);
          return;
        }
        const phone = mpesaPhone.startsWith('0') ? '254' + mpesaPhone.slice(1) : mpesaPhone;
        const { checkoutRequestId } = await startMpesaPayment(selectedPlan, phone, userEmail);
        setMpesaPending(checkoutRequestId);
        // Start polling
        pollMpesa(checkoutRequestId, 0);
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollMpesa = async (requestId: string, count: number) => {
    if (count > 24) { // 2 minutes max
      setError('Payment timed out. Check your phone and try again.');
      setMpesaPending(null);
      return;
    }
    await new Promise(r => setTimeout(r, 5000)); // wait 5s
    const status = await checkMpesaStatus(requestId);
    setPollCount(count + 1);
    if (status === 'paid') {
      setMpesaPending(null);
      onClose();
      window.location.reload(); // refresh to pick up new plan from server
    } else if (status === 'failed') {
      setMpesaPending(null);
      setError('Payment was declined or cancelled. Please try again.');
    } else {
      pollMpesa(requestId, count + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d1117]/95 z-[700] flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
          <div>
            <h2 className="text-xl font-black text-white">Upgrade Your Plan</h2>
            <p className="text-sm text-[#8b949e]">Unlock all Tomo tools — pay via M-Pesa or card</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#8b949e] hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan selector */}
          <div className="grid grid-cols-2 gap-3">
            {(['pro', 'enterprise'] as const).map(pid => {
              const p   = PLANS[pid];
              const sel = selectedPlan === pid;
              return (
                <button key={pid} onClick={() => setSelectedPlan(pid)}
                  className={`p-4 rounded-2xl border text-left transition-all ${sel ? 'border-[#1f6feb] bg-[#1f6feb]/10' : 'border-[#30363d] hover:border-[#58a6ff]'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {pid === 'pro' ? <Zap size={16} className="text-blue-400" /> : <Crown size={16} className="text-purple-400" />}
                    <span className="font-bold text-white">{p.name}</span>
                    {pid === 'pro' && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">Popular</span>}
                  </div>
                  <p className="text-xl font-black text-white">{formatPrice(p.price)} <span className="text-xs text-[#8b949e] font-normal">/month</span></p>
                  <ul className="mt-3 space-y-1">
                    {FEATURE_LISTS[pid].slice(0, 4).map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                        <Check size={10} className="text-emerald-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPayMethod('mpesa')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${payMethod === 'mpesa' ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#30363d] hover:border-[#58a6ff]'}`}>
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">M</div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">M-Pesa</p>
                  <p className="text-[10px] text-[#8b949e]">Pay via phone</p>
                </div>
              </button>
              <button onClick={() => setPayMethod('stripe')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${payMethod === 'stripe' ? 'border-[#1f6feb] bg-[#1f6feb]/10' : 'border-[#30363d] hover:border-[#58a6ff]'}`}>
                <div className="w-8 h-8 bg-[#635bff] rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard size={14} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Card / Stripe</p>
                  <p className="text-[10px] text-[#8b949e]">Visa, Mastercard</p>
                </div>
              </button>
            </div>
          </div>

          {/* M-Pesa phone input */}
          {payMethod === 'mpesa' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block mb-2">M-Pesa Phone Number</label>
              <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#1f6feb]">
                <Smartphone size={14} className="text-[#8b949e]" />
                <input value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#8b949e]"
                  placeholder="0712 345 678" type="tel" />
              </div>
              <p className="text-[10px] text-[#8b949e] mt-1">You'll receive an M-Pesa prompt on this number</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* M-Pesa pending state */}
          {mpesaPending ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-emerald-400 animate-spin" />
              </div>
              <h3 className="font-bold text-white mb-2">Check Your Phone</h3>
              <p className="text-sm text-[#8b949e]">An M-Pesa prompt has been sent to <strong className="text-white">{mpesaPhone}</strong>. Enter your PIN to complete payment.</p>
              <p className="text-xs text-[#8b949e] mt-3">Waiting for confirmation... ({pollCount * 5}s)</p>
            </div>
          ) : (
            <button onClick={handlePay} disabled={loading}
              className="w-full py-4 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              {loading ? 'Processing...' : `Pay ${formatPrice(plan.price)} / month via ${payMethod === 'mpesa' ? 'M-Pesa' : 'Card'}`}
            </button>
          )}

          <p className="text-[10px] text-center text-[#8b949e]">
            Secure payment · Cancel anytime · Instant activation
          </p>
        </div>
      </div>
    </div>
  );
}
