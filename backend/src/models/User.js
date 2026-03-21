const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },   // null for Google-only users
  googleId: { type: String, sparse: true },
  avatar:   { type: String },
  phone:    { type: String },
  company:  { type: String },

  role: {
    type: String,
    enum: ['admin', 'recruiter', 'worker'],
    default: 'recruiter',
  },

  // Activation flow: new signups are pending until admin approves
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending',
  },

  // Worker-specific profile link
  workerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerProfile',
    default: null,
  },

  createdAt:    { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
