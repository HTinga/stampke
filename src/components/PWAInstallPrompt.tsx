/**
 * PWAInstallPrompt — shows a branded install banner when the browser
 * fires the beforeinstallprompt event (Chrome/Edge on desktop & Android)
 * On iOS Safari it shows manual instructions since iOS doesn't support
 * the beforeinstallprompt event.
 */

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import StampKELogo from './StampKELogo';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or in standalone mode (already installed)
    const wasDismissed = sessionStorage.getItem('stampke_pwa_dismissed');
    if (wasDismissed) return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Check iOS
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOSDevice && !('standalone' in navigator && (navigator as any).standalone)) {
      setIsIOS(true);
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Listen for Chrome/Edge install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('stampke_pwa_dismissed', '1');
  };

  if (!showBanner || installed || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[950] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a73e8] to-[#1557b0] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <StampKELogo size={24} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Install StampKE</p>
              <p className="text-blue-100 text-xs">Works offline · No app store needed</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-4">
          {isIOS ? (
            /* iOS Instructions */
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Add to Home Screen</p>
              <div className="space-y-2">
                {[
                  { step: '1', text: 'Tap the Share button', icon: '⬆️' },
                  { step: '2', text: 'Scroll down and tap "Add to Home Screen"', icon: '➕' },
                  { step: '3', text: 'Tap "Add" in the top right', icon: '✅' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-xs text-gray-700 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 text-center">
                Once installed, StampKE works like a native app on your iPhone or iPad.
              </p>
            </div>
          ) : (
            /* Chrome/Edge install */
            <div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Install StampKE as an app on your desktop or phone for faster access and offline use.
              </p>
              <div className="flex gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1.5">
                  <Monitor size={12} /> Desktop
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1.5">
                  <Smartphone size={12} /> Mobile
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1.5">
                  ⚡ Offline ready
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download size={15} /> Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
