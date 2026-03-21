require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const shortid  = require('shortid');

const OWNER_EMAIL    = process.env.OWNER_EMAIL    || 'hempstonetinga@gmail.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'admin123';

async function setup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  MongoDB connected');

  // Load models
  require('../models/coreModels/User');
  require('../models/coreModels/UserPassword');
  require('../models/coreModels/Setting');
  require('../models/appModels/Client');
  require('../models/appModels/Invoice');
  require('../models/appModels/Payment');
  require('../models/appModels/Job');
  require('../models/appModels/WorkerProfile');

  const User         = mongoose.model('User');
  const UserPassword = mongoose.model('UserPassword');
  const Setting      = mongoose.model('Setting');

  // ── Create owner account ──────────────────────────────────────────────────
  let owner = await User.findOne({ email: OWNER_EMAIL });
  if (!owner) {
    owner = await new User({
      name:    'Admin Owner',
      email:   OWNER_EMAIL,
      role:    'superadmin',
      enabled: true,
    emailVerified: true,
      removed: false,
    }).save();

    const salt    = shortid.generate();
    const hashed  = bcrypt.hashSync(salt + OWNER_PASSWORD);
    await new UserPassword({ user: owner._id, password: hashed, salt, removed: false }).save();

    console.log(`👍  Owner account created: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  } else {
    console.log(`ℹ️   Owner account already exists: ${OWNER_EMAIL}`);
  }

  // ── Default settings ──────────────────────────────────────────────────────
  const defaults = [
    { settingKey: 'app_name',      settingValue: 'Tomo',       valueType: 'string' },
    { settingKey: 'app_currency',  settingValue: 'KES',        valueType: 'string' },
    { settingKey: 'app_country',   settingValue: 'Kenya',      valueType: 'string' },
    { settingKey: 'tax_rate',      settingValue: 16,           valueType: 'number' },
    { settingKey: 'invoice_prefix',settingValue: 'INV',        valueType: 'string' },
    { settingKey: 'frontend_url',  settingValue: process.env.FRONTEND_URL || '', valueType: 'string' },
  ];

  for (const s of defaults) {
    await Setting.findOneAndUpdate(
      { settingKey: s.settingKey },
      { ...s, removed: false },
      { upsert: true, new: true }
    );
  }
  console.log('👍  Default settings seeded');

  console.log('\n🥳  Setup complete!\n');
  console.log(`   Owner email:    ${OWNER_EMAIL}`);
  console.log(`   Owner password: ${OWNER_PASSWORD}`);
  console.log('\n   Change OWNER_PASSWORD in .env before deploying to production.\n');
  process.exit(0);
}

setup().catch((e) => { console.error(e); process.exit(1); });
