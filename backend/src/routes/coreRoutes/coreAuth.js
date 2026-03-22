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

  return res.status(200).json({ success: true, result: null, message: 'Email verified! You can now sign in.' });
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

// Google OAuth redirect callback — GET /auth/google/callback?code=...
// Note: this is on /auth not /api because it's a browser redirect
router.get('/google/callback', catchErrors(googleCallback));

module.exports = router;
