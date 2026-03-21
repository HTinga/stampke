const Joi      = require('joi');
const mongoose = require('mongoose');
const { authUser } = require('./authUser');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';

const login = async (req, res, { userModel }) => {
  const UserPasswordModel = mongoose.model(userModel + 'Password');
  const UserModel         = mongoose.model(userModel);
  const { email, password } = req.body;

  const { error } = Joi.object({
    email:    Joi.string().email({ tlds: { allow: true } }).required(),
    password: Joi.string().required(),
  }).validate({ email, password });

  if (error)
    return res.status(409).json({ success: false, result: null, message: 'Invalid/Missing credentials.' });

  const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const user    = await UserModel.findOne({ email: email.toLowerCase(), removed: false });

  if (!user)
    return res.status(404).json({ success: false, result: null, message: 'No account with this email has been registered.' });

  // Email must be verified (except owner)
  if (!isOwner && !user.emailVerified)
    return res.status(403).json({
      success: false, result: null,
      message: 'Please verify your email address before signing in. Check your inbox.',
      code: 'EMAIL_NOT_VERIFIED',
    });

  if (!user.enabled)
    return res.status(409).json({
      success: false, result: null,
      message: 'Your account has been disabled. Contact support.',
      code: 'DISABLED',
    });

  const databasePassword = await UserPasswordModel.findOne({ user: user._id, removed: false });
  if (!databasePassword)
    return res.status(404).json({ success: false, result: null, message: 'No password set — please use Google Sign-In.' });

  // Start trial on first business login
  if (user.role === 'business' && !user.trialStartedAt) {
    const now = new Date();
    user.trialStartedAt = now;
    user.trialEndsAt    = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await user.save();
  }

  return authUser(req, res, { user, databasePassword, password, UserPasswordModel });
};

module.exports = login;
