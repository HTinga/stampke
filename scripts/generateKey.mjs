import { createHash, createCipheriv, randomBytes } from 'crypto';

/**
 * STANDALONE KEY GENERATOR for StampKE (Tomo) 
 * Usage: node generateKey.mjs "STAMPKE-ID1,STAMPKE-ID2" 2027-04-01 3
 */

const SECRET = 'STAMPKE-OFFLINE-AUTHORITY-KEY-2027';
const IV_LENGTH = 16;

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('\n--- StampKE Offline Key Generator ---');
  console.log('Usage: node generateKey.mjs <machine_ids_comma_separated> <expiry_yyyy_mm_dd> <tier_3_or_5>');
  console.log('Example: node generateKey.mjs "STAMPKE-123,STAMPKE-456" 2027-12-31 3\n');
  process.exit(1);
}

const [idsStr, expiry, tier] = args;
const ids = idsStr.split(',').map(id => id.trim());

const data = {
  ids,
  expiry: new Date(expiry).toISOString(),
  tier: parseInt(tier),
  issuedAt: new Date().toISOString()
};

// Encryption Logic (Same as in licenseManager.ts)
const encrypt = (payload) => {
  const key = createHash('sha256').update(SECRET).digest();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return iv.toString('hex') + ':' + encrypted;
};

try {
  const finalKey = encrypt(data);
  console.log('\n--- GENERATED SECURITY KEY ---');
  console.log(finalKey);
  console.log('-------------------------------\n');
  console.log(`Plan: ${tier} Gadgets | Expiry: ${expiry} | IDs: ${ids.join(', ')}\n`);
} catch (err) {
  console.error('Error generating key:', err);
}
