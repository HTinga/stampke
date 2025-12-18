
import React from 'react';
import { Check, Zap, Building2, Store, User, ArrowRight, ShieldCheck, PenTool, Layers } from 'lucide-react';

interface SubscriptionPageProps {
  onSelectPlan: (planId: string) => void;
  t: any;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSelectPlan, t }) => {
  const tiers = [
    {
      id: 'FREE',
      name: t.individual,
      price: 'KES 650',
      period: t.sw === 'Bei' ? '/faili' : '/file',
      icon: <User className="text-slate-400" />,
      description: t.sw === 'Bei' ? 'Kwa ajili ya nyaraka moja tu.' : 'Perfect for one-off official documents.',
      features: [
        t.sw === 'Bei' ? 'Lipia unapotumia' : 'Pay per high-res download',
        t.sw === 'Bei' ? 'AI ya hali ya juu' : 'Standard AI Conversion',
        '25+ Authentic Templates',
        t.sw === 'Bei' ? 'Kurekebisha kwa msingi' : 'Basic Customization'
      ],
      cta: t.payAsYouGo,
      popular: false
    },
    {
      id: 'PRO',
      name: t.professional,
      price: 'KES 2,499',
      period: t.sw === 'Bei' ? '/mwezi' : '/mo',
      icon: <Zap className="text-blue-600" />,
      description: t.sw === 'Bei' ? 'Pata sahihi na vyeti.' : 'Unlock signatures & certificates.',
      features: [
        '25 Downloads per month',
        t.sw === 'Bei' ? 'Sahihi ya kidijitali' : 'Digital Signature Overlay',
        t.sw === 'Bei' ? 'Vyeti vya ukweli' : 'Authenticity Certificates',
        'Cloud Storage for Seals',
        'Priority Export Rendering'
      ],
      cta: t.upgrade,
      popular: true
    },
    {
      id: 'BUSINESS',
      name: t.business,
      price: 'KES 5,999',
      period: t.sw === 'Bei' ? '/mwezi' : '/mo',
      icon: <Store className="text-emerald-600" />,
      description: t.sw === 'Bei' ? 'Chombo bora kwa kazi nyingi.' : 'The ultimate tool for high volume.',
      features: [
        'Unlimited Downloads',
        t.sw === 'Bei' ? 'Mashine ya mihuri mingi' : 'Bulk Stamping Engine',
        'Up to 5 Terminal Logins',
        'Whitelabel Export',
        'Dedicated Support Line'
      ],
      cta: t.goUnlimited,
      popular: false
    }
  ];

  return (
    <div className="py-20 px-4 bg-white animate-in slide-in-from-bottom-8 duration-700">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-blue-100">
          Scaling Your Administrative Workflow
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
          {t.sw === 'Bei' ? 'Chagua ' : 'Choose Your '}<span className="text-blue-600">{t.sw === 'Bei' ? 'Mpango.' : 'Plan.'}</span>
        </h2>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Unlock high-fidelity administrative tools tailored for the Kenyan market.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div 
            key={tier.id}
            className={`relative flex flex-col p-10 rounded-[48px] border transition-all duration-500 ${
              tier.popular 
                ? 'bg-slate-900 text-white border-slate-900 shadow-[0_40px_80px_-15px_rgba(30,64,175,0.3)] scale-105 z-10' 
                : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:shadow-xl'
            }`}
          >
            {tier.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                Best for Advocates
              </div>
            )}

            <div className="mb-10">
              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 ${tier.popular ? 'bg-white/10' : 'bg-white shadow-md'}`}>
                {tier.icon}
              </div>
              <h3 className="text-3xl font-black mb-3 tracking-tight">{tier.name}</h3>
              <p className={`text-sm font-medium ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>{tier.description}</p>
            </div>

            <div className="mb-10 flex items-end gap-1">
              <span className="text-4xl font-black tracking-tighter">{tier.price}</span>
              {tier.period && <span className={`text-sm font-bold pb-1 ${tier.popular ? 'text-slate-400' : 'text-slate-500'}`}>{tier.period}</span>}
            </div>

            <ul className="flex-1 space-y-5 mb-12">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className={`mt-1 p-0.5 rounded-full ${tier.popular ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className={`text-sm font-bold ${tier.popular ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => onSelectPlan(tier.id)}
              className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                tier.popular 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-900/40' 
                  : 'bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tier.cta} <ArrowRight size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;
