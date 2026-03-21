const sendEmail = require('@/utils/sendEmail');
const mongoose  = require('mongoose');
const jwt       = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const googleSignIn = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User         = mongoose.model(userModel);
  const { idToken }  = req.body;

  if (!idToken)
    return res.status(400).json({ success: false, result: null, message: 'Google ID token required.' });

  if (!process.env.GOOGLE_CLIENT_ID)
    return res.status(400).json({ success: false, result: null, message: 'Google Sign-In not configured on server. Contact admin.' });

  let payload;
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (e) {
    return res.status(401).json({ success: false, result: null, message: 'Invalid Google token. Please try again.' });
  }

  const { email, name, picture, sub: googleId } = payload;
  const normalizedEmail = email.toLowerCase();
  const isOwner = normalizedEmail === OWNER_EMAIL.toLowerCase();

  let user = await User.findOne({
    $or: [{ email: normalizedEmail }, { googleId }],
    removed: false,
  });

  if (!user) {
    // New Google user — create account
    // Superadmin cannot be created this way (only via email/password + setup.js)
    // Workers signing up via Google go to jobs landing → worker role
    // Everyone else is business by default
    user = await new User({
      name,
      email:    normalizedEmail,
      googleId,
      photo:    picture,
      role:     isOwner ? 'superadmin' : 'business',
      enabled:  isOwner,      // owner active immediately; others need email verify
      emailVerified: true,    // Google verifies email for us
      plan:     isOwner ? 'enterprise' : 'trial',
      trialStartedAt: isOwner ? undefined : new Date(),
      trialEndsAt:    isOwner ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      removed:  false,
    }).save();

    await new UserPassword({
      user: user._id, password: '', salt: '', loggedSessions: [], removed: false,
    }).save();

    if (!isOwner) {
      sendEmail({
        to:      OWNER_EMAIL,
        subject: `[Tomo] New Google signup — ${name} (${user.role})`,
        html:    `<p><strong>${name}</strong> (${normalizedEmail}) signed up via Google as <strong>${user.role}</strong>. Activate in SuperAdmin Panel → Users.</p>`,
      });
    }
  } else {
    // Existing user — link Google ID if not already
    if (!user.googleId) {
      user.googleId = googleId;
      if (!user.photo) user.photo = picture;
      user.emailVerified = true;
      await user.save();
    }
    // Auto-upgrade owner role
    if (isOwner && user.role !== 'superadmin') {
      user.role    = 'superadmin';
      user.enabled = true;
      await user.save();
    }
  }

  if (!user.enabled)
    return res.status(403).json({
      success: false, result: null,
      message: 'Your account is pending activation by the admin.',
      code: 'PENDING',
    });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  await UserPassword.findOneAndUpdate(
    { user: user._id },
    { $push: { loggedSessions: token } },
    { new: true, upsert: true }
  ).exec();

  // Build trial info
  const now         = new Date();
  const trialActive = user.plan === 'trial' && user.trialEndsAt && now < user.trialEndsAt;
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((user.trialEndsAt - now) / 86400000))
    : 0;

  return res.status(200).json({
    success: true,
    result: {
      _id:  user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      photo: user.photo,
      plan: user.plan,
      trialActive,
      trialDaysLeft,
      adminPermissions: user.adminPermissions || [],
      token,
    },
    message: 'Successfully signed in with Google',
  });
};

module.exports = googleSignIn;
