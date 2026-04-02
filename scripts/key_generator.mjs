import CryptoJS from 'crypto-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SECRET = 'STAMPKE-SECRET-KEY-2026-AUTHORITY';

console.log(`
╔═══════════════════════════════════════════════╗
║   STAMPKE STANDALONE KEY GENERATOR v1.0       ║
║   (Internal Admin Use Only)                   ║
╚═══════════════════════════════════════════════╝
`);

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generate() {
  const machineId = await ask('Enter Customer Machine ID: ');
  const days = await ask('Validity in Days (default 365): ') || '365';
  const plan = await ask('Plan (3-gadgets/5-gadgets): ') || '3-gadgets';

  if (!machineId.startsWith('STAMPKE-')) {
    console.error('Error: Invalid Machine ID format.');
    process.exit(1);
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));

  const licenseData = {
    ids: [machineId],
    expiry: expiryDate.toISOString(),
    plan: plan,
    version: '1.0'
  };

  const json = JSON.stringify(licenseData);
  const encrypted = CryptoJS.AES.encrypt(json, SECRET).toString();

  console.log('\n' + '─'.repeat(50));
  console.log('✅ SUCCESS: LICENSE GENERATED');
  console.log('─'.repeat(50));
  console.log(`\nCustomer ID: ${machineId}`);
  console.log(`Expires On:  ${expiryDate.toLocaleDateString()}`);
  console.log(`Plan:        ${plan}`);
  console.log('\n--- SHARE THE KEY BELOW WITH THE CUSTOMER ---');
  console.log('\n' + encrypted + '\n');
  console.log('─'.repeat(50));

  rl.close();
}

generate();
