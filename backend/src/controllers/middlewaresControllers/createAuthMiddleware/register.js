const sendEmail  = require('@/utils/sendEmail');
const bcrypt     = require('bcryptjs');
const Joi        = require('joi');
const mongoose   = require('mongoose');
const shortid    = require('shortid');
const crypto     = require('crypto');

const OWNER_EMAIL  = process.env.OWNER_EMAIL  || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';

const register = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User         = mongoose.model(userModel);

  const { error, value } = Joi.object({
    name:     Joi.string().min(2).max(80).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role:     Joi.string().valid('business', 'worker').default('business'),
    company:  Joi.string().max(120).allow('').optional(),
    phone:    Joi.string().allow('').optional(),
  }).validate(req.body);

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.details[0].message });

  if (value.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'This account cannot be registered.' });

  const existing = await User.findOne({ email: value.email.toLowerCase(), removed: false });
  if (existing)
    return res.status(409).json({ success: false, result: null, message: 'An account with this email already exists.' });

  const emailVerifyToken   = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  const now = new Date();

  const user = await new User({
    name:    value.name,
    email:   value.email.toLowerCase(),
    company: value.company,
    phone:   value.phone,
    role:    value.role,
    // Enabled immediately — no admin approval needed
    // Free tier limits enforce the paywall, not account blocking
    enabled:          true,
    emailVerified:    false,
    emailVerifyToken,
    emailVerifyExpires,
    plan:           value.role === 'business' ? 'trial' : 'free',
    trialStartedAt: value.role === 'business' ? now : undefined,
    trialEndsAt:    value.role === 'business' ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
    removed: false,
  }).save();

  const salt = shortid.generate();
  await new UserPassword({
    user:     user._id,
    password: bcrypt.hashSync(salt + value.password),
    salt,
    removed:  false,
  }).save();

  // Send verification email — fire and forget, don't block signup
  const verifyUrl = `${FRONTEND_URL}/api/verify-email?token=${emailVerifyToken}&id=${user._id}`;
  sendEmail({
    to:      value.email,
    from:    'StampKE <noreply@stampke.co.ke>',
    subject: 'Verify your StampKE email address',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0d1117;color:#e6edf3;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#1f6feb;font-size:28px;margin:0">StampKE</h1>
          <p style="color:#8b949e;margin-top:4px">Digital Stamps & eSign Platform</p>
        </div>
        <h2 style="color:white">Welcome, ${value.name}! 🎉</h2>
        <p style="color:#8b949e">You're almost in. Click the button below to verify your email address.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${verifyUrl}" style="display:inline-block;background:#1f6feb;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px">
            Verify Email Address
          </a>
        </div>
        <p style="color:#8b949e;font-size:13px">This link expires in 48 hours. If you didn't create a StampKE account, ignore this email.</p>
        <hr style="border-color:#30363d;margin:24px 0"/>
        <p style="color:#8b949e;font-size:12px;text-align:center">© StampKE · Nairobi, Kenya</p>
      </div>`,
  });

  return res.status(201).json({
    success: true,
    result:  {
      _id:   user._id,
      email: user.email,
      role:  user.role,
      name:  user.name,
    },
    message: 'Account created! A verification email has been sent — you can sign in now and verify later.',
  });
};

module.exports = register;
