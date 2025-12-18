
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Github, Chrome, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  onNavigateToPricing: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigateToPricing }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="max-w-4xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in zoom-in duration-300">
        
        {/* Left Side: Illustration/Benefits */}
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-6 tracking-tight">Welcome to the Future of Official Seals.</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl mt-1"><ShieldCheck size={20} /></div>
                <div>
                  <p className="font-bold text-lg">Secure & Official</p>
                  <p className="text-blue-100 text-sm">Your designs are encrypted and strictly for your use.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl mt-1"><ShieldCheck size={20} /></div>
                <div>
                  <p className="font-bold text-lg">Cyber Cafe Ready</p>
                  <p className="text-blue-100 text-sm">Subscription plans tailored for high-volume business use.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 pt-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Powered by JijiTechy</p>
          </div>

          {/* Abstract blobs */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-900 mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h3>
            <p className="text-slate-500 font-medium text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"} 
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-bold ml-1 hover:underline underline-offset-4"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSuccess(); }}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder="name@company.co.ke"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</button>
              </div>
            )}

            <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 mt-4">
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={20} />
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-slate-300">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Or continue with</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]">
              <Chrome size={18} /> <span className="text-sm font-bold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]">
              <Github size={18} /> <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-800 font-medium leading-relaxed">
              Cyber Cafe owner? <button onClick={onNavigateToPricing} className="font-bold underline">Upgrade to Business Tier</button> for unlimited monthly downloads and multi-terminal access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
