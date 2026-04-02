require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const path     = require('path');

// Require Node 18+
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error('❌  Please upgrade Node.js to v18 or higher.');
  process.exit(1);
}

// Validate required env vars
// Note: MONGODB_URI is no longer required as we have migrated to Supabase
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
const missing  = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(', ')}`);
  console.error('    Please configure your .env with Supabase credentials.');
  process.exit(1);
}

// Start Express
const app    = require('./app');
const PORT   = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`🚀  StampKE API running on port ${PORT} (Supabase Backend)`);
  console.log(`    Health: http://localhost:${PORT}/api/health`);
});

module.exports = server;
