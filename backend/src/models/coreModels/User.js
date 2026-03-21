'use strict';
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  removed:  { type: Boolean, default: false },
  enabled:  { type: Boolean, default: false },
  name:     { type: String, required: true, trim: true },
  surname:  { type: String, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  photo:    { type: String, trim: true },
  phone:    { type: String },
  company:  { type: String },
  googleId: { type: String, sparse: true },
  role: {
    type: String, default: 'business',
    enum: ['superadmin', 'admin', 'business', 'worker'],
  },
  emailVerified:      { type: Boolean, default: false },
  emailVerifyToken:   { type: String, select: false },
  emailVerifyExpires: { type: Date, select: false },
  trialStartedAt:  { type: Date },
  trialEndsAt:     { type: Date },
  plan:            { type: String, enum: ['trial', 'free', 'pro', 'enterprise'], default: 'trial' },
  planActivatedAt: { type: Date },
  planGrantedBy:   { type: mongoose.Schema.ObjectId, ref: 'User' },
  adminPermissions: [{ type: String, enum: ['users','workers','jobs','invoices','clients','analytics','settings'] }],
  stripeCustomerId:     { type: String, sparse: true },
  stripeSubscriptionId: { type: String, sparse: true },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  created:  { type: Date, default: Date.now },
  updated:  { type: Date, default: Date.now },
});

// ── Indexes (issue #6) ────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, enabled: 1 });
userSchema.index({ emailVerifyToken: 1 }, { sparse: true });
userSchema.index({ removed: 1, created: -1 });
userSchema.index({ stripeCustomerId: 1 }, { sparse: true });

userSchema.pre('save', function (next) { this.updated = Date.now(); next(); });

module.exports = mongoose.model('User', userSchema);
