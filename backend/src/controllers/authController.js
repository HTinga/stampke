const Joi = require('joi');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendToken } = require('../middleware/auth');
const { notifyAdminNewSignup, notifyUserActivated, notifyUserSuspended } = require('../services/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hempstonetinga@gmail.com';

// ── Register (email + password) ──────────────────────────────────────────────
exports.register = async (req, res) => {
  const schema = Joi.object({
    name:     Joi.string().min(2).max(80).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role:     Joi.string().valid('recruiter', 'worker').default('recruiter'),
    company:  Joi.string().max(120).optional().allow(''),
    phone:    Joi.string().optional().allow(''),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const existing = await User.findOne({ email: value.email });
  if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

  // Admin email auto-activates as admin
  const isAdmin = value.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const user = await User.create({
    ...value,
    role:   isAdmin ? 'admin' : value.role,
    status: isAdmin ? 'active' : 'pending',
  });

  if (!isAdmin) {
    await notifyAdminNewSignup({ name: user.name, email: user.email, role: user.role });
  }

  return res.status(201).json({
    success: true,
    message: isAdmin
      ? 'Admin account created. You can sign in immediately.'
      : 'Registration successful! Your account is pending activation. You will receive an email when approved.',
    user: user.toPublic(),
  });
};

// ── Login (email + password) ─────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  if (!user.password) return res.status(401).json({ success: false, message: 'This account uses Google sign-in. Please use "Sign in with Google".' });

  const valid = await user.correctPassword(password);
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  if (user.status === 'suspended') return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
  if (user.status === 'pending') return res.status(403).json({ success: false, message: 'Your account is pending activation by the admin.', code: 'PENDING' });

  user.lastActiveAt = Date.now();
  await user.save({ validateBeforeSave: false });

  return sendToken(user, 200, res);
};

// ── Google Sign-In (verify ID token from frontend) ───────────────────────────
exports.googleSignIn = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, message: 'Google ID token required.' });

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, name, picture, sub: googleId } = payload;

  let user = await User.findOne({ $or: [{ email }, { googleId }] });

  if (!user) {
    // New user via Google
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    user = await User.create({
      name,
      email: email.toLowerCase(),
      googleId,
      avatar: picture,
      role:   isAdmin ? 'admin' : 'recruiter',
      status: isAdmin ? 'active' : 'pending',
    });
    if (!isAdmin) {
      await notifyAdminNewSignup({ name: user.name, email: user.email, role: user.role });
    }
  } else if (!user.googleId) {
    // Existing email user — link Google
    user.googleId = googleId;
    user.avatar = user.avatar || picture;
    await user.save({ validateBeforeSave: false });
  }

  if (user.status === 'suspended') return res.status(403).json({ success: false, message: 'Account suspended.' });
  if (user.status === 'pending') return res.status(403).json({
    success: false,
    message: 'Your account is pending activation by the admin.',
    code: 'PENDING',
    user: user.toPublic(),
  });

  user.lastActiveAt = Date.now();
  await user.save({ validateBeforeSave: false });
  return sendToken(user, 200, res);
};

// ── Get current user (me) ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('workerProfile');
  res.json({ success: true, user });
};

// ── Admin: list all users ────────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  const { status, role, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (role) filter.role = role;

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(filter);

  res.json({ success: true, users, total, page: Number(page) });
};

// ── Admin: activate a user ───────────────────────────────────────────────────
exports.activateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.status = 'active';
  await user.save({ validateBeforeSave: false });
  await notifyUserActivated({ name: user.name, email: user.email, role: user.role });

  res.json({ success: true, message: `${user.name} activated.`, user: user.toPublic() });
};

// ── Admin: suspend a user ────────────────────────────────────────────────────
exports.suspendUser = async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.email === ADMIN_EMAIL) return res.status(403).json({ success: false, message: 'Cannot suspend the platform owner.' });

  user.status = 'suspended';
  await user.save({ validateBeforeSave: false });
  await notifyUserSuspended({ name: user.name, email: user.email, reason });

  res.json({ success: true, message: `${user.name} suspended.` });
};

// ── Admin: delete a user ─────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.email === ADMIN_EMAIL) return res.status(403).json({ success: false, message: 'Cannot delete the platform owner.' });

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted.' });
};

// ── Update own profile ───────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  const { name, phone, company, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, company, avatar },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
};
