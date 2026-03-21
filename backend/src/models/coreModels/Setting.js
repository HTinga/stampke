const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  removed:    { type: Boolean, default: false },
  enabled:    { type: Boolean, default: true },
  settingKey: { type: String, required: true, unique: true, lowercase: true, trim: true },
  settingValue: mongoose.Schema.Types.Mixed,
  valueType:  { type: String, default: 'string', enum: ['string', 'number', 'boolean', 'object', 'array'] },
  description:{ type: String },
  created:    { type: Date, default: Date.now },
  updated:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Setting', settingSchema);
