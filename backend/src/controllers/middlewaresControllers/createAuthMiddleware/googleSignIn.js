const sendEmail = require('@/utils/sendEmail');
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';

const googleSignIn = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User         = mongoose.model(userModel);
  const { idToken }  = req.body;

  if (!idToken)
    return res.status(400).json({ success: false, result: null, message: 'Google ID token required.' });

  const client  = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket  = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, name, picture, sub: googleId } = payload;

  let user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { googleId }], removed: false });

  const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();

  if (!user) {
    // Brand-new Google user
    user = await new User({
      name,
      email:    email.toLowerCase(),
      googleId,
      photo:    picture,
      role:     isOwner ? 'owner' : 'recruiter',
      enabled:  isOwner,
      removed:  false,
    }).save();

    // Create an empty UserPassword record (no password — Google only)
    await new UserPassword({
      user: user._id, password: '', salt: '', loggedSessions: [], removed: false,
    }).save();

    // Notify owner
    if (!isOwner) {
      sendEmail({ to: OWNER_EMAIL, subject: `[Tomo] New Google signup — ${name}`, html: `<p><strong>${name}</strong> (${email}) signed up via Google. Activate in Admin Panel.</p>`, from: 'Tomo Platform <noreply@tomo.ke>' });
    }
  } else {
    // Existing user — link Google if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.photo    = user.photo || picture;
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

  return res.status(200).json({
    success: true,
    result: {
      _id: user._id, name: user.name, role: user.role, email: user.email, photo: user.photo, token,
    },
    message: 'Successfully signed in with Google',
  });
};

module.exports = googleSignIn;
