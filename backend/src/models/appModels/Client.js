'use strict';
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  removed:  { type: Boolean, default: false },
  enabled:  { type: Boolean, default: true },
  name:     { type: String, required: true, trim: true },
  email:    { type: String, trim: true, lowercase: true },
  phone:    { type: String, trim: true },
  company:  { type: String, trim: true },
  address:  { type: String },
  country:  { type: String, default: 'Kenya' },
  city:     { type: String },
  notes:    { type: String },
  source:   { type: String, enum: ['direct','referral','whatsapp','facebook','instagram','website','other'], default: 'direct' },
  status:   { type: String, enum: ['lead','active','inactive'], default: 'active' },
  tags:     [{ type: String }],
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', autopopulate: { select: 'name email' } },
  assigned:  { type: mongoose.Schema.ObjectId, ref: 'User', autopopulate: { select: 'name email' } },
  created:  { type: Date, default: Date.now },
  updated:  { type: Date, default: Date.now },
});

// ── Indexes (issue #6) ────────────────────────────────────────────────────────
clientSchema.index({ createdBy: 1, removed: 1 });
clientSchema.index({ status: 1, removed: 1 });
clientSchema.index({ name: 'text', email: 'text', company: 'text' });

clientSchema.plugin(require('mongoose-autopopulate'));
clientSchema.pre('save', function (next) { this.updated = Date.now(); next(); });
clientSchema.pre('findOneAndUpdate', function () { this.set({ updated: Date.now() }); });

module.exports = mongoose.model('Client', clientSchema);
