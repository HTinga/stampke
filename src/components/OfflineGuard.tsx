import React, { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, Clock, CheckCircle2, AlertCircle, Copy, LogOut } from 'lucide-react';
import { getMachineId } from '../utils/machineId';
import { decryptLicense, isLicenseValid, LicenseData } from '../utils/licenseManager';

interface Props {
  children: React.ReactNode;
}

export default function OfflineGuard({ children }: Props) {
  const [machineId, setMachineId] = useState('');
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trial state
  const [trialUsed, setTrialUsed] = useState(() => {
    return localStorage.getItem('stampke_trial_esign') === 'used' && 
           localStorage.getItem('stampke_trial_estamp') === 'used';
  });

  useEffect(() => {
    const initSecurity = async () => {
      const id = await getMachineId();
      setMachineId(id);

      const savedKey = localStorage.getItem('stampke_license_key');
      if (savedKey) {
        const decoded = decryptLicense(savedKey);
        const val = isLicenseValid(decoded, id);
        setLicense(decoded);
        setStatus(val);
      }
      setIsLoading(false);
    };
    
    initSecurity();
  }, []);

  const handleActivate = () => {
    const decoded = decryptLicense(keyInput);
    const val = isLicenseValid(decoded, machineId);
    
    if (val.valid) {
      localStorage.setItem('stampke_license_key', keyInput);
      setLicense(decoded);
      setStatus(val);
    } else {
      setStatus(val);
    }
  };

  const useTrial = () => {
    // In a real app, this would set specific limited flags
    localStorage.setItem('stampke_trial_esign', 'used');
    localStorage.setItem('stampke_trial_estamp', 'used');
    setTrialUsed(true);
    // For trial, we just "bypass" by setting a temporary valid status
    setStatus({ valid: true });
  };

  const copyId = () => {
    navigator.clipboard.writeText(machineId);
    alert('Machine ID copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-[#8b949e] font-sans">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold animate-pulse">Initializing Security Module...</p>
      </div>
    );
  }

  // If valid license, show the app
  if (status?.valid) {
    return <>{children}</>;
  }

  // Otherwise, show Lock Screen
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full"></div>
        
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20 shadow-inner">
            <Lock size={40} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">StampKE Standalone</h1>
          <p className="text-sm text-[#8b949e]">Hardware-Bound Security Active</p>
        </div>

        <div className="space-y-6 relative z-10">
          {/* Machine ID Section */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-4 transition-all hover:border-[#484f58]">
            <label className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest block mb-2">Unique Gadget ID</label>
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm font-mono text-blue-400 break-all">{machineId}</code>
              <button onClick={copyId} className="p-2 bg-[#21262d] hover:bg-[#30363d] rounded-xl text-[#8b949e] hover:text-white transition-all shadow-sm" title="Copy ID">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[10px] text-[#484f58] mt-2 italic font-medium">* Share this ID to receive your 1-year security key.</p>
          </div>

          {/* Activation Key Input */}
          <div>
            <label className="text-xs font-bold text-white block mb-2">Security Activation Key</label>
            <textarea 
              rows={3}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Paste your encrypted key here..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#484f58] focus:border-blue-500 outline-none transition-all resize-none font-mono"
            />
          </div>

          {status && !status.valid && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-100 font-medium">{status.reason}</p>
            </div>
          )}

          <button 
            onClick={handleActivate}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
          >
            <Shield size={18} className="group-hover:scale-110 transition-transform" />
            Unlock Authority Workspace
          </button>

          {/* Simple Trial Option */}
          {!trialUsed && (
            <div className="pt-2 text-center">
                <button 
                onClick={useTrial}
                className="text-[#8b949e] hover:text-white text-xs font-bold transition-colors underline underline-offset-4"
                >
                Start 1-Doc Free Trial
                </button>
            </div>
          )}

          <div className="pt-6 border-t border-[#30363d] flex justify-between items-center text-[10px] text-[#484f58] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Smartphone size={10}/> Multisync Ready</span>
            <span className="flex items-center gap-1.5"><Clock size={10}/> 1 Year License</span>
          </div>
        </div>
      </div>
    </div>
  );
}
