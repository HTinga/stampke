require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const shortid  = require('shortid');

const OWNER_EMAIL    = process.env.OWNER_EMAIL    || 'hempstonetinga@gmail.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '@Outlier12';

async function setup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  MongoDB connected');

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

  // ── Create / update superadmin account ────────────────────────────────────
  let owner = await User.findOne({ email: OWNER_EMAIL.toLowerCase() });
  if (!owner) {
    owner = await new User({
      name:          'Hempstone Tinga',
      email:         OWNER_EMAIL.toLowerCase(),
      role:          'superadmin',
      enabled:       true,
      emailVerified: true,
      plan:          'enterprise',
      removed:       false,
    }).save();

    const salt   = shortid.generate();
    const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);
    await new UserPassword({ user: owner._id, password: hashed, salt, removed: false }).save();
    console.log(`👍  Superadmin created: ${OWNER_EMAIL}`);
  } else {
    // Ensure role and plan are correct even if account already existed
    let changed = false;
    if (owner.role !== 'superadmin') { owner.role = 'superadmin'; changed = true; }
    if (!owner.enabled)              { owner.enabled = true;        changed = true; }
    if (!owner.emailVerified)        { owner.emailVerified = true;  changed = true; }
    if (owner.plan !== 'enterprise') { owner.plan = 'enterprise';  changed = true; }
    if (changed) await owner.save();

    // Update password to current OWNER_PASSWORD
    const existingPwd = await UserPassword.findOne({ user: owner._id, removed: false });
    if (existingPwd) {
      const salt   = shortid.generate();
      const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);
      await UserPassword.findOneAndUpdate({ user: owner._id }, { password: hashed, salt }, { new: true });
      console.log(`ℹ️   Superadmin updated: ${OWNER_EMAIL} — password reset to env OWNER_PASSWORD`);
    }
  }

  // ── Default settings ──────────────────────────────────────────────────────
  const defaults = [
    { settingKey: 'app_name',       settingValue: 'Tomo',    valueType: 'string' },
    { settingKey: 'app_currency',   settingValue: 'KES',     valueType: 'string' },
    { settingKey: 'app_country',    settingValue: 'Kenya',   valueType: 'string' },
    { settingKey: 'tax_rate',       settingValue: 16,        valueType: 'number' },
    { settingKey: 'invoice_prefix', settingValue: 'INV',     valueType: 'string' },
    { settingKey: 'trial_days',     settingValue: 7,         valueType: 'number' },
    { settingKey: 'plan_pro_kes',   settingValue: 2499,      valueType: 'number' },
    { settingKey: 'plan_ent_kes',   settingValue: 9999,      valueType: 'number' },
  ];
  for (const s of defaults) {
    await Setting.findOneAndUpdate({ settingKey: s.settingKey }, { ...s, removed: false }, { upsert: true });
  }
  console.log('👍  Settings seeded');

  console.log('\n🥳  Setup complete!');
  console.log(`   Superadmin email:    ${OWNER_EMAIL}`);
  console.log(`   Superadmin password: ${OWNER_PASSWORD}`);
  process.exit(0);
}

setup().catch(e => { console.error(e); process.exit(1); });
