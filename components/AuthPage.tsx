
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Github, Chrome, ShieldCheck, MessageCircle } from 'lucide-react';
import { UserAccount, SubscriptionTier } from '../types';

interface AuthPageProps {
  onSuccess: (user: UserAccount) => void;
  onNavigateToPricing: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigateToPricing }) => {
  const [isLogin, setIsLogin] = useState(true);

  const mockLogin = (type: 'GMAIL' | 'WHATSAPP') => {
    const mockUser: UserAccount = {
      id: Math.random().toString(36).substr(2, 9),
      email: type === 'GMAIL' ? 'user@gmail.com' : undefined,
      whatsapp: type === 'WHATSAPP' ? '+254712345678' : undefined,
      role: 'USER',
      tier: SubscriptionTier.FREE,
      expiryDate: null,
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    onSuccess(mockUser);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[64px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300">
        
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-black mb-8 tracking-tighter leading-tight">Identity & <br/>Authority.</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-2xl mt-1"><ShieldCheck size={24} /></div>
                <div>
                  <p className="font-black text-xl">Verified Access</p>
                  <p className="text-blue-100 text-sm font-medium">Your stamps are legally linked to your identity.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-2xl mt-1"><ShieldCheck size={24} /></div>
                <div>
                  <p className="font-black text-xl">Cyber Cafe Ready</p>
                  <p className="text-blue-100 text-sm font-medium">Business plans tailored for high-volume use.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 relative z-10">Protected by JijiTechy GateKeeper</p>
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="md:w-1/2 p-12 md:p-16">
          <div className="mb-12">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h3>
            <p className="text-slate-500 font-medium">Securely access your administrative tools.</p>
          </div>

          <div className="space-y-4 mb-12">
            <button 
              onClick={() => mockLogin('GMAIL')}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
            >
              <Chrome size={20} className="text-red-500" /> Continue with Google
            </button>
            <button 
              onClick={() => mockLogin('WHATSAPP')}
              className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-900/10"
            >
              <MessageCircle size={20} /> Login with WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-300 dark:text-slate-700 mb-12">
            <div className="h-[1px] flex-1 bg-current"></div>
            <span className="text-[9px] font-black uppercase tracking-widest">Enterprise Access</span>
            <div className="h-[1px] flex-1 bg-current"></div>
          </div>

          <p className="text-xs text-slate-500 text-center font-medium leading-relaxed">
            By signing in, you agree to our <button className="underline font-bold">Judicial Terms of Use</button> and <button className="underline font-bold">Data Sovereignty Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
