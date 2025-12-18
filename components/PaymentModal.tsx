
import React, { useState } from 'react';
import { X, Smartphone, CreditCard, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  price: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess, price }) => {
  const [method, setMethod] = useState<'MPESA' | 'STRIPE'>('MPESA');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'PAY' | 'PENDING' | 'SUCCESS'>('PAY');

  const handlePay = () => {
    setIsProcessing(true);
    // Simulation
    setTimeout(() => {
      setStep('PENDING');
      setTimeout(() => {
        setStep('SUCCESS');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }, 3000);
    }, 1000);
  };

  if (step === 'SUCCESS') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-[48px] p-16 text-center max-w-md w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} />
          </div>
          <h3 className="text-3xl font-black mb-4">Payment Confirmed!</h3>
          <p className="text-slate-500 font-medium">Your license has been activated. Thank you for using FreeStamps KE.</p>
        </div>
      </div>
    );
  }

  if (step === 'PENDING') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-[48px] p-16 text-center max-w-md w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <h3 className="text-3xl font-black mb-4">Awaiting Verification</h3>
          <p className="text-slate-500 font-medium">Please check your phone for the M-Pesa STK push and enter your PIN.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[64px] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-300">
        <div className="p-12 lg:p-16">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-4xl font-black tracking-tighter">Secure Checkout.</h3>
            <button onClick={onClose} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <button 
              onClick={() => setMethod('MPESA')}
              className={`p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${method === 'MPESA' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100'}`}
            >
              <Smartphone size={32} className={method === 'MPESA' ? 'text-emerald-600' : 'text-slate-300'} />
              <span className="font-black text-xs uppercase tracking-widest">M-Pesa STK</span>
            </button>
            <button 
              onClick={() => setMethod('STRIPE')}
              className={`p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${method === 'STRIPE' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100'}`}
            >
              <CreditCard size={32} className={method === 'STRIPE' ? 'text-blue-600' : 'text-slate-300'} />
              <span className="font-black text-xs uppercase tracking-widest">Card / Stripe</span>
            </button>
          </div>

          <div className="space-y-6">
            {method === 'MPESA' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number (254...)</label>
                <input 
                  type="text" 
                  placeholder="2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-xl font-black outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] text-center">
                 <p className="text-sm font-bold text-slate-400 mb-4">Redirect to Secure Stripe Portal</p>
                 <div className="flex justify-center gap-4 opacity-30 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
                 </div>
              </div>
            )}

            <div className="p-8 bg-slate-50 rounded-[32px] flex justify-between items-center">
               <span className="text-lg font-black">Total Payable</span>
               <span className="text-3xl font-black text-blue-600">{price}</span>
            </div>

            <button 
              onClick={handlePay}
              className={`w-full py-6 rounded-[28px] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${method === 'MPESA' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/10'} text-white`}
            >
              {method === 'MPESA' ? 'Initiate STK Push' : 'Proceed to Stripe'} <ArrowRight size={24} />
            </button>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <ShieldCheck size={14} /> Encrypted Secure Payments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
