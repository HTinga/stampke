
import React from 'react';
import { Check, Zap, Building2, Store, User, ArrowRight } from 'lucide-react';

interface SubscriptionPageProps {
  onSelectPlan: (planId: string) => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSelectPlan }) => {
  const tiers = [
    {
      id: 'personal',
      name: 'Individual',
      price: 'Free / PAYG',
      icon: <User className="text-slate-400" />,
      description: 'Perfect for one-off official documents.',
      features: [
        'Pay KES 650 per download',
        'Standard AI Conversion',
        'Watermarked Previews',
        '25+ Authentic Templates'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Designer',
      price: 'KES 2,499',
      period: '/mo',
      icon: <Zap className="text-blue-600" />,
      description: 'For professionals creating stamps regularly.',
      features: [
        '25 Downloads per month',
        'Premium Font Library',
        'Advanced AI Conversion',
        'Priority Export Rendering',
        'Cloud Storage for Designs'
      ],
      cta: 'Subscribe Pro',
      popular: true
    },
    {
      id: 'business',
      name: 'Cyber Cafe / Business',
      price: 'KES 5,999',
      period: '/mo',
      icon: <Store className="text-emerald-600" />,
      description: 'The ultimate tool for high-traffic businesses.',
      features: [
        'Unlimited Downloads',
        'Up to 5 Terminal Logins',
        'Custom Logo Support',
        'Whitelabel Export (No Metadata)',
        '24/7 Priority Support',
        'Batch Processing AI'
      ],
      cta: 'Go Unlimited',
      popular: false
    }
  ];

  return (
    <div className="py-20 px-4 bg-white animate-in slide-in-from-bottom-8 duration-700">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-blue-100">
          Pricing Plans
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">Choose Your <span className="text-blue-600">Power Level.</span></h2>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          From one-time users to busy cyber cafes, we have a plan that scales with your official needs.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div 
            key={tier.id}
            className={`relative flex flex-col p-8 rounded-[40px] border transition-all duration-300 ${
              tier.popular 
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105 z-10' 
                : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100'
            }`}
          >
            {tier.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${tier.popular ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                {tier.icon}
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">{tier.name}</h3>
              <p className={`text-sm font-medium ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>{tier.description}</p>
            </div>

            <div className="mb-10">
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-black tracking-tighter">{tier.price}</span>
                {tier.period && <span className={`text-sm font-bold pb-1 ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>{tier.period}</span>}
              </div>
            </div>

            <ul className="flex-1 space-y-4 mb-10">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`mt-1 p-0.5 rounded-full ${tier.popular ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    <Check size={12} />
                  </div>
                  <span className={`text-sm font-bold ${tier.popular ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => onSelectPlan(tier.id)}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                tier.popular 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/40' 
                  : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {tier.cta} <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-20 p-10 bg-blue-50 rounded-[40px] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h4 className="text-2xl font-black text-slate-900 mb-2">Need a custom solution?</h4>
          <p className="text-slate-600 font-medium">For government institutions and large law firms with 50+ members.</p>
        </div>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shrink-0">Contact Enterprise</button>
      </div>
    </div>
  );
};

export default SubscriptionPage;
