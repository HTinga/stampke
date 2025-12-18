
import React from 'react';
import { PlayCircle, CheckCircle } from 'lucide-react';

const DemoSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
              See How It's <span className="text-blue-600">Made.</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Our advanced editor simulates the physics of a physical rubber stamp. High-fidelity vector generation ensures your seal looks perfect on every document.
            </p>
            <div className="space-y-4">
              {['Choose your official shape', 'Customize text paths', 'Add AI-distressed rustness', 'Download print-ready SVG'].map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="font-bold text-slate-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg aspect-square bg-white rounded-[40px] shadow-2xl p-4 relative group">
            <div className="absolute inset-0 bg-blue-600/5 rounded-[40px] animate-pulse"></div>
            <div className="relative z-10 w-full h-full border-2 border-dashed border-slate-200 rounded-[32px] flex items-center justify-center overflow-hidden">
              {/* Animated Demo SVG */}
              <svg viewBox="0 0 400 400" className="w-64 h-64">
                <circle cx="200" cy="200" r="150" fill="none" stroke="#1e3a8a" strokeWidth="4" className="animate-[dash_3s_ease-in-out_infinite]" strokeDasharray="1000" />
                <circle cx="200" cy="200" r="130" fill="none" stroke="#1e3a8a" strokeWidth="2" opacity="0.5" />
                <text x="200" y="200" textAnchor="middle" fontSize="32" fontWeight="900" fill="#1e3a8a" className="animate-bounce">
                  OFFICIAL
                </text>
                <g className="animate-[stamp-press_2s_infinite]">
                  <rect x="100" y="300" width="200" height="20" rx="4" fill="#1e3a8a" opacity="0.2" />
                </g>
              </svg>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                <PlayCircle size={14} /> LIVE DESIGN PREVIEW
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes stamp-press {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-50px); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default DemoSection;
