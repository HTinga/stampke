const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  removed:  { type: Boolean, default: false },
  enabled:  { type: Boolean, default: false },

  name:     { type: String, required: true, trim: true },
  surname:  { type: String, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  photo:    { type: String, trim: true },
  phone:    { type: String },
  company:  { type: String },
  googleId: { type: String, sparse: true },

  // ── Roles ─────────────────────────────────────────────────────────────────
  // superadmin : hempstonetinga@gmail.com only — full platform access
  // admin      : created by superadmin, scoped permissions
  // business   : business owners — tools platform (eSign + stamps free 7d)
  // worker     : job seekers — job portal only
  role: {
    type: String,
    default: 'business',
    enum: ['superadmin', 'admin', 'business', 'worker'],
  },

  // ── Email verification ────────────────────────────────────────────────────
  emailVerified:    { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  emailVerifyExpires: { type: Date },

  // ── Subscription / Trial (business role) ─────────────────────────────────
  trialStartedAt:  { type: Date },        // set on first login
  trialEndsAt:     { type: Date },        // trialStartedAt + 7 days
  plan:            { type: String, enum: ['trial', 'free', 'pro', 'enterprise'], default: 'trial' },
  planActivatedAt: { type: Date },
  planGrantedBy:   { type: mongoose.Schema.ObjectId, ref: 'User' },  // superadmin who upgraded

  // ── Sub-admin permissions (admin role only) ───────────────────────────────
  // Array of feature keys this admin is allowed to access/manage
  adminPermissions: [{
    type: String,
    enum: ['users', 'workers', 'jobs', 'invoices', 'clients', 'analytics', 'settings'],
  }],
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },

  created:  { type: Date, default: Date.now },
  updated:  { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) { this.updated = Date.now(); next(); });

// Virtual: is trial still active?
userSchema.virtual('trialActive').get(function () {
  if (this.plan !== 'trial' || !this.trialEndsAt) return false;
  return new Date() < this.trialEndsAt;
});

// Virtual: has paid plan
userSchema.virtual('isPro').get(function () {
  return ['pro', 'enterprise'].includes(this.plan);
});

module.exports = mongoose.model('User', userSchema);
