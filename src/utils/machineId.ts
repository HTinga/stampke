import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import CryptoJS from 'crypto-js';

// Define window interface for Electron bridge
declare global {
  interface Window {
    electronAPI: {
      getMachineId: () => Promise<string>;
    };
  }
}

/**
 * Returns a persistent, device-unique hardware fingerprint string.
 * Supporting: Mobile (Capacitor) and Windows (Electron).
 */
export const getMachineId = async (): Promise<string> => {
  // 1. Try Electron Bride (Windows Native)
  if (window.electronAPI && typeof window.electronAPI.getMachineId === 'function') {
    try {
      const id = await window.electronAPI.getMachineId();
      if (id) return id;
    } catch (err) {
      console.warn('[MachineId] Electron bridge failed, falling back...');
    }
  }

  // 2. Try Capacitor / Web Fallback
  try {
    const { id: existingId } = await Preferences.get({ key: 'stampke_machine_id' });
    if (existingId) return existingId;

    // Generate a new persistent ID if none exists
    const info = await Device.getId();
    let rawId = info.identifier;

    if (!rawId) {
      // Last resort: browser/device fingerprint simulation
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
      ].join('|');
      rawId = CryptoJS.SHA256(fingerprint).toString().toUpperCase();
    }

    const finalId = 'STAMPKE-' + CryptoJS.SHA256(rawId).toString().toUpperCase().slice(0, 16);
    await Preferences.set({ key: 'stampke_machine_id', value: finalId });
    return finalId;
  } catch (err) {
    console.error('[MachineId] Failed to generate/retrieve ID:', err);
    return 'STAMPKE-UNK-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
};
