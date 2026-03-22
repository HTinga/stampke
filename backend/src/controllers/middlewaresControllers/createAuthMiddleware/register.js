const sendEmail = require('@/utils/sendEmail');
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

  // Block superadmin signup
  if (value.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'This account cannot be registered.' });

  const existing = await User.findOne({ email: value.email.toLowerCase(), removed: false });
  if (existing)
    return res.status(409).json({ success: false, result: null, message: 'An account with this email already exists.' });

  // Email verify token
  const emailVerifyToken   = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Trial: 7 days from now (business only)
  const now          = new Date();
  const trialEndsAt  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const user = await new User({
    name:    value.name,
    email:   value.email.toLowerCase(),
    company: value.company,
    phone:   value.phone,
    role:    value.role,
    enabled: false,          // must verify email first
    emailVerified:    false,
    emailVerifyToken,
    emailVerifyExpires,
    plan:          value.role === 'business' ? 'trial' : 'free',
    trialStartedAt: value.role === 'business' ? now : undefined,
    trialEndsAt:    value.role === 'business' ? trialEndsAt : undefined,
    removed: false,
  }).save();

  // Hash password
  const salt           = shortid.generate();
  const hashedPassword = bcrypt.hashSync(salt + value.password);
  await new UserPassword({ user: user._id, password: hashedPassword, salt, removed: false }).save();

  // Send verification email
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${emailVerifyToken}&id=${user._id}`;
  sendEmail({ to: value.email, subject: 'Verify your Tomo email address', html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1f6feb">Welcome to Tomo, ${value.name}!</h2>
          <p>Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#1f6feb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            Verify Email Address
          </a>
          <p style="color:#666;font-size:13px">Link expires in 24 hours. If you didn't create this account, ignore this email.</p>
        </div>`, from: 'Tomo <noreply@tomo.ke>' });

  return res.status(201).json({
    success: true,
    result:  null,
    message: 'Account created! Please check your email to verify your address before signing in.',
  });
};

module.exports = register;
