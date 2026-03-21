// #2 — Token stored in httpOnly cookie (not localStorage) to prevent XSS theft
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const COOKIE_NAME    = 'tomo_session';
const COOKIE_OPTIONS = {
  httpOnly: true,          // JS cannot read — blocks XSS token theft
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',      // blocks CSRF
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  path:     '/',
};

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);
  if (!isMatch)
    return res.status(403).json({ success: false, result: null, message: 'Invalid credentials.' });

  const expiresIn = req.body.remember ? '365d' : '7d';
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

  await UserPasswordModel.findOneAndUpdate(
    { user: user._id },
    { $push: { loggedSessions: token } },
    { new: true }
  ).exec();

  // Set httpOnly cookie (#2)
  res.cookie(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: req.body.remember ? 365 * 24 * 60 * 60 * 1000 : COOKIE_OPTIONS.maxAge,
  });

  const now           = new Date();
  const trialActive   = user.plan === 'trial' && user.trialEndsAt && now < user.trialEndsAt;
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((user.trialEndsAt - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return res.status(200).json({
    success: true,
    result: {
      _id: user._id, name: user.name, surname: user.surname,
      role: user.role, email: user.email, photo: user.photo,
      plan: user.plan, trialActive, trialDaysLeft,
      adminPermissions: user.adminPermissions || [],
      // token also returned in body for Vercel serverless compatibility
      // (cookies work in browsers; body token used by API clients)
      token,
    },
    message: 'Successfully logged in',
  });
};

module.exports = { authUser, COOKIE_NAME, COOKIE_OPTIONS };
