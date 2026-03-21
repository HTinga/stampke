const mongoose = require('mongoose');

const userPasswordSchema = new mongoose.Schema({
  removed:      { type: Boolean, default: false },
  user:         { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  password:     { type: String, required: true },
  salt:         { type: String, required: true },
  loggedSessions: [{ type: String }],
  resetToken:   { type: String },
  resetExpires: { type: Date },
  created:      { type: Date, default: Date.now },
  updated:      { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserPassword', userPasswordSchema);
