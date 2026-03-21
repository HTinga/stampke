const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, trim: true, lowercase: true },
  phone:    { type: String, trim: true },
  company:  { type: String, trim: true },
  address:  { type: String },
  country:  { type: String, default: 'Kenya' },
  city:     { type: String },
  notes:    { type: String },
  source:   { type: String, enum: ['direct', 'referral', 'whatsapp', 'facebook', 'instagram', 'website', 'other'], default: 'direct' },
  status:   { type: String, enum: ['lead', 'active', 'inactive'], default: 'active' },
  tags:     [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  removed:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

clientSchema.pre('save', function (next) { this.updatedAt = Date.now(); next(); });
clientSchema.pre('findOneAndUpdate', function () { this.set({ updatedAt: Date.now() }); });

module.exports = mongoose.model('Client', clientSchema);
