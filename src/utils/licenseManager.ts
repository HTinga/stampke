import CryptoJS from 'crypto-js';

export interface LicenseData {
  ids: string[];     // Authorized Machine IDs
  expiry: string;    // ISO Date
  plan: '3-gadgets' | '5-gadgets';
  version: string;
}

// In a real production app, this would be more obscured or injected via build env
const SECRET = 'STAMPKE-OFFLINE-AUTHORITY-KEY-2027';

/**
 * Encrypts license data into a Base64 string for the user.
 * (Used by the admin/key-gen tool)
 */
export const encryptLicense = (data: LicenseData): string => {
  const json = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(json, SECRET).toString();
  return encrypted;
};

/**
 * Decrypts and validates a license key string.
 * (Used in the standalone app)
 */
export const decryptLicense = (keyStr: string): LicenseData | null => {
  try {
    const [ivHex, encrypted] = keyStr.split(':');
    if (!ivHex || !encrypted) return null;

    const key = CryptoJS.SHA256(SECRET);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedData) return null;
    return JSON.parse(decryptedData);
  } catch (err) {
    console.warn('[LicenseManager] Decryption failed:', err);
    return null;
  }
};

/**
 * Validates if the current machine and date are allowed by the license.
 */
export const isLicenseValid = (license: LicenseData | null, currentMachineId: string): { valid: boolean; reason?: string } => {
  if (!license) return { valid: false, reason: 'Invalid or missing security key.' };

  // 1. Check machine ID
  if (!license.ids.includes(currentMachineId)) {
    return { valid: false, reason: `Not authorized for this gadget. Machine ID: ${currentMachineId}` };
  }

  // 2. Check expiry
  const expiryDate = new Date(license.expiry);
  const now = new Date();
  if (now > expiryDate) {
    return { valid: false, reason: `Security key expired on ${expiryDate.toLocaleDateString()}. Please renew.` };
  }

  return { valid: true };
};
