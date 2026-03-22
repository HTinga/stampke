const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const { catchErrors } = require('@/handlers/errorHandlers');
const userAuth        = require('@/controllers/middlewaresControllers/createAuthMiddleware')('User');
const googleCallback  = require('@/controllers/middlewaresControllers/createAuthMiddleware/googleCallback');

// Public auth routes
router.post('/login',          catchErrors(userAuth.login));
router.post('/register',       catchErrors(userAuth.register));
router.post('/google',         catchErrors(userAuth.googleSignIn));
router.post('/forgetpassword', catchErrors(userAuth.forgetPassword));
router.post('/resetpassword',  catchErrors(userAuth.resetPassword));

// Email verification — GET /api/verify-email?token=...&id=...
router.get('/verify-email', catchErrors(async (req, res) => {
  const User = mongoose.model('User');
  const { token, id } = req.query;
  if (!token || !id)
    return res.status(400).json({ success: false, result: null, message: 'Invalid verification link.' });

  const user = await User.findOne({ _id: id, emailVerifyToken: token, removed: false });
  if (!user)
    return res.status(400).json({ success: false, result: null, message: 'Verification link is invalid or has expired.' });

  if (new Date() > user.emailVerifyExpires)
    return res.status(400).json({ success: false, result: null, message: 'Verification link has expired. Please register again.' });

  user.emailVerified    = true;
  user.enabled          = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  const FRONTEND = process.env.FRONTEND_URL || 'https://stampke.vercel.app';
  return res.redirect(`${FRONTEND}?verified=1`);
}));

// Resend verification email
router.post('/resend-verification', catchErrors(async (req, res) => {
  const User   = mongoose.model('User');
  const crypto = require('crypto');
  const { Resend } = require('resend');
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, result: null, message: 'Email required.' });

  const user = await User.findOne({ email: email.toLowerCase(), removed: false });
  if (!user || user.emailVerified)
    return res.status(200).json({ success: true, result: null, message: 'If that email exists and is unverified, a new link has been sent.' });

  const emailVerifyToken   = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerifyToken    = emailVerifyToken;
  user.emailVerifyExpires  = emailVerifyExpires;
  await user.save();

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${emailVerifyToken}&id=${user._id}`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Tomo <noreply@tomo.ke>', to: email,
      subject: 'Verify your Tomo email address',
      html: `<p>Hi ${user.name},</p><p><a href="${verifyUrl}">Click here to verify your email</a>. Expires in 24 hours.</p>`,
    });
  } catch (e) { console.error('[Email] resend verify error:', e.message); }

  return res.status(200).json({ success: true, result: null, message: 'Verification email resent.' });
}));

// Google OAuth redirect callback — GET /api/auth/google/callback?code=...
// Note: this is on /auth not /api because it's a browser redirect
router.get('/auth/google/callback', catchErrors(googleCallback));


// POST /api/setup — seeds superadmin account on live DB
// Call once: POST https://your-app.vercel.app/api/setup
// Body: { "secret": "stampke-setup-2024" }
// GET version — trigger from browser: /api/setup?secret=stampke-setup-2024
router.get('/setup', catchErrors(async (req, res) => {
  const secret = req.query.secret;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid setup secret.' });

  const User         = mongoose.model('User');
  const UserPassword = mongoose.model('UserPassword');
  const bcrypt       = require('bcryptjs');
  const shortid      = require('shortid');
  const OWNER_EMAIL    = process.env.OWNER_EMAIL    || 'hempstonetinga@gmail.com';
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '@Outlier12';

  let owner = await User.findOne({ email: OWNER_EMAIL.toLowerCase() });
  const salt = shortid.generate();
  const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);
  if (!owner) {
    owner = await new User({ name: 'Hempstone Tinga', email: OWNER_EMAIL.toLowerCase(), role: 'superadmin', enabled: true, emailVerified: true, plan: 'enterprise', removed: false }).save();
    await new UserPassword({ user: owner._id, password: hashed, salt, removed: false }).save();
  } else {
    owner.role = 'superadmin'; owner.enabled = true; owner.emailVerified = true; owner.plan = 'enterprise';
    await owner.save();
    await UserPassword.findOneAndUpdate({ user: owner._id }, { password: hashed, salt }, { upsert: true });
  }
  return res.status(200).json({ success: true, result: { email: OWNER_EMAIL, role: 'superadmin' }, message: 'Superadmin ready. Login: ' + OWNER_EMAIL + ' / ' + OWNER_PASSWORD });
}));

router.post('/setup', catchErrors(async (req, res) => {
  const { secret } = req.body;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid setup secret.' });

  const User         = mongoose.model('User');
  const UserPassword = mongoose.model('UserPassword');
  const bcrypt       = require('bcryptjs');
  const shortid      = require('shortid');

  const OWNER_EMAIL    = process.env.OWNER_EMAIL    || 'hempstonetinga@gmail.com';
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '@Outlier12';

  let owner = await User.findOne({ email: OWNER_EMAIL.toLowerCase() });
  const salt   = shortid.generate();
  const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);

  if (!owner) {
    owner = await new User({
      name: 'Hempstone Tinga', email: OWNER_EMAIL.toLowerCase(),
      role: 'superadmin', enabled: true, emailVerified: true,
      plan: 'enterprise', removed: false,
    }).save();
    await new UserPassword({ user: owner._id, password: hashed, salt, removed: false }).save();
  } else {
    owner.role = 'superadmin'; owner.enabled = true;
    owner.emailVerified = true; owner.plan = 'enterprise';
    await owner.save();
    await UserPassword.findOneAndUpdate({ user: owner._id }, { password: hashed, salt }, { upsert: true });
  }

  return res.status(200).json({
    success: true,
    result:  { email: OWNER_EMAIL, role: 'superadmin' },
    message: 'Superadmin account ready. Login with OWNER_EMAIL / OWNER_PASSWORD.',
  });
}));

module.exports = router;
