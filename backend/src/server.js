require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const path     = require('path');
const { globSync } = require('glob');

// Require Node 18+
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error('❌  Please upgrade Node.js to v18 or higher.');
  process.exit(1);
}

// Validate required env vars
const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing  = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(', ')}`);
  console.error('    Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize:     10,   // issue #15 — connection pooling
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
mongoose.connection.on('connected', () => console.log('✅  MongoDB connected'));
mongoose.connection.on('error',     (e) => {
  console.error('❌  MongoDB error:', e.message);
  console.error('    Check your MONGODB_URI in .env');
});

// Auto-register all models (glob like idurar)
const modelFiles = globSync('./models/**/*.js', { cwd: __dirname });
for (const filePath of modelFiles) {
  require(path.resolve(__dirname, filePath));
}

// Start Express
const app    = require('./app');
const PORT   = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`🚀  Tomo API running on port ${PORT}`);
  console.log(`    Health: http://localhost:${PORT}/api/health`);
});

module.exports = server;
