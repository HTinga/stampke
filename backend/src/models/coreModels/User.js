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
  googleId:   { type: String, sparse: true },
  facebookId: { type: String, sparse: true },

  // ── Roles ─────────────────────────────────────────────────────────────────
  // superadmin : hempstonetinga@gmail.com — full platform, cannot signup
  // admin      : created by superadmin with scoped permissions
  // business   : business owners — eSign+Stamps free, rest needs paid plan
  // worker     : job seekers — job portal only
  role: {
    type:    String,
    default: 'business',
    enum:    ['superadmin', 'admin', 'business', 'worker'],
  },

  // ── Email verification ────────────────────────────────────────────────────
  emailVerified:      { type: Boolean, default: false },
  emailVerifyToken:   { type: String },
  emailVerifyExpires: { type: Date },

  // ── Subscription ──────────────────────────────────────────────────────────
  plan:            { type: String, enum: ['trial', 'free', 'pro', 'enterprise'], default: 'trial' },
  trialStartedAt:  { type: Date },
  trialEndsAt:     { type: Date },
  planActivatedAt: { type: Date },
  planGrantedBy:   { type: mongoose.Schema.ObjectId, ref: 'User' },

  // ── Free tier usage tracking ──────────────────────────────────────────────
  freeUsage: {
    eSignCount:     { type: Number, default: 0 },  // max 3 free
    stampCount:     { type: Number, default: 0 },  // max 3 free
    shortlistCount: { type: Number, default: 0 },  // max 5 free
    hireCount:      { type: Number, default: 0 },  // max 3 free
  },

  // ── Pending IntaSend payment tracking
  pendingPayment: {
    planId:            { type: String },
    phone:             { type: String },
    checkoutRequestId: { type: String },
    startedAt:         { type: Date },
  },

  // ── Sub-admin permissions (admin role only) ───────────────────────────────
  adminPermissions: [{
    type: String,
    enum: ['users', 'workers', 'jobs', 'invoices', 'clients', 'analytics', 'settings'],
  }],
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) { this.updated = Date.now(); next(); });

module.exports = mongoose.model('User', userSchema);
