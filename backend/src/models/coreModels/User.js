const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  removed:  { type: Boolean, default: false },
  enabled:  { type: Boolean, default: false }, // false = pending activation

  name:     { type: String, required: true, trim: true },
  surname:  { type: String, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  photo:    { type: String, trim: true },
  phone:    { type: String },
  company:  { type: String },
  googleId: { type: String, sparse: true },

  role: {
    type: String,
    default: 'recruiter',
    enum: ['owner', 'admin', 'recruiter', 'worker'],
  },

  // owner = hempstonetinga@gmail.com — always enabled, cannot be removed
  created:  { type: Date, default: Date.now },
  updated:  { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) { this.updated = Date.now(); next(); });

module.exports = mongoose.model('User', userSchema);
