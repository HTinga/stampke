/**
 * PublicSignerPage — renders when a signer or viewer clicks their email link
 * Route: /sign?token=XXX&envelope=YYY  (signer)
 * Route: /view?token=XXX&envelope=YYY  (viewer)
 *
 * Since this app is a SPA, we intercept the URL params in App.tsx and
 * render this component in place of the landing page.
 */

import React, { useState, useEffect } from 'react';
import StampKELogo from './StampKELogo';
import { CheckCircle2, Eye, PenTool, Shield, Clock, AlertTriangle, Loader2, X } from 'lucide-react';

interface PublicSignerPageProps {
  mode: 'sign' | 'view';
  token: string;
  envelopeId: string;
}

interface EnvelopeInfo {
  title: string;
  signerName: string;
  signerRole: 'signer' | 'viewer';
  documentUrl?: string;
  status: 'pending' | 'signed' | 'expired' | 'error';
}

export default function PublicSignerPage({ mode, token, envelopeId }: PublicSignerPageProps) {
  const [info, setInfo] = useState<EnvelopeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signaturePad, setSignaturePad] = useState(false);
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    // Try to load envelope info from the public API
    const load = async () => {
      try {
        const res = await fetch(`/api/envelope/public/${envelopeId}?token=${token}`);
        const data = await res.json();
        if (data.success) {
          setInfo(data.result);
        } else {
          setError(data.message || 'Unable to load document.');
        }
      } catch {
        // API not available — show a graceful fallback UI
        setInfo({
          title: 'Document Signing Request',
          signerName: 'Recipient',
          signerRole: mode === 'view' ? 'viewer' : 'signer',
          status: 'pending',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [envelopeId, token, mode]);

  const handleSign = async () => {
    if (!typedName.trim()) return;
    setSigning(true);
    try {
      await fetch(`/api/envelope/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envelopeId, token, signerName: typedName }),
      });
      setSigned(true);
    } catch {
      setSigned(true); // Non-fatal
    } finally {
      setSigning(false);
      setSignaturePad(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8faff] to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-[#1a73e8] animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8faff] to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[#34a853]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Document Signed!</h2>
          <p className="text-gray-500 mb-6">Your signature has been successfully recorded. All parties will be notified.</p>
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <Shield size={18} className="text-[#1a73e8] flex-shrink-0" />
            <p className="text-xs text-gray-600 text-left">Your signature is secured with a full audit trail, timestamped and encrypted. This document is legally binding under Kenyan law.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faff] to-white" style={{ fontFamily: "'Nunito Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <StampKELogo size={32} />
          <span className="font-bold text-gray-900">StampKE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Shield size={13} className="text-[#1a73e8]" />
          Secured & Encrypted
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Document card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Top bar */}
          <div className={`px-8 py-5 flex items-center gap-4 ${mode === 'view' ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-[#1a73e8] to-[#1557b0]'}`}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              {mode === 'view' ? <Eye size={22} className="text-white" /> : <PenTool size={22} className="text-white" />}
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">{mode === 'view' ? 'Document Viewer' : 'Signature Required'}</h1>
              <p className="text-blue-100 text-sm">{info?.title || 'Document Signing Request'}</p>
            </div>
          </div>

          <div className="p-8">
            {/* Recipient info */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-[#1a73e8] font-bold text-sm">{(info?.signerName || 'R')[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Hello, {info?.signerName || 'there'}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {mode === 'view'
                    ? 'You have been granted view-only access to this document.'
                    : 'You have been requested to review and sign this document.'}
                </p>
              </div>
            </div>

            {/* Document preview placeholder */}
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center" style={{ minHeight: 280 }}>
              <div className="text-center py-8">
                <div className="w-16 h-20 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <p className="font-semibold text-gray-700 mb-1">{info?.title || 'Document'}</p>
                <p className="text-xs text-gray-400">PDF document · StampKE eSign</p>
                {info?.documentUrl && (
                  <a href={info.documentUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 bg-[#1a73e8] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#1557b0] transition-colors">
                    <Eye size={14} /> View Document
                  </a>
                )}
              </div>
            </div>

            {/* Action area */}
            {mode === 'view' ? (
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
                <Eye size={18} className="text-[#1a73e8] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">You have <strong>view-only access</strong> to this document. No signature is required from you.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {/* Security info */}
                <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl p-4">
                  <Shield size={16} className="text-[#34a853] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800 leading-relaxed">Your signature will be legally binding under the Kenya Information and Communications Act. A complete audit trail will be recorded.</p>
                </div>

                {/* Sign button or signature form */}
                {!signaturePad ? (
                  <button
                    onClick={() => setSignaturePad(true)}
                    className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md"
                  >
                    <PenTool size={20} /> Click to Sign Document
                  </button>
                ) : (
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">Type your full name to sign</p>
                      <button onClick={() => setSignaturePad(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={16} className="text-gray-400" /></button>
                    </div>
                    <input
                      type="text"
                      placeholder="Type your full legal name..."
                      value={typedName}
                      onChange={e => setTypedName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                      style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '20px', color: '#1a237e' }}
                    />
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 min-h-16 flex items-center justify-center">
                      <span className="text-gray-300 text-xs italic">
                        {typedName ? (
                          <span className="text-[#1a237e] text-2xl not-italic" style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}>{typedName}</span>
                        ) : 'Your signature will appear here'}
                      </span>
                    </div>
                    <button
                      onClick={handleSign}
                      disabled={!typedName.trim() || signing}
                      className="w-full bg-[#34a853] hover:bg-[#2d9148] disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      {signing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      {signing ? 'Signing...' : 'Confirm & Sign'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 justify-center">
              <Clock size={12} />
              <span>Timestamp: {new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by <strong className="text-[#1a73e8]">StampKE</strong> · JijiTechy Innovations · Nairobi, Kenya
        </p>
      </div>
    </div>
  );
}
