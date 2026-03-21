const mongoose   = require('mongoose');
const { Resend } = require('resend');

const OWNER_EMAIL  = process.env.OWNER_EMAIL  || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Lazy getters — models registered after this module loads
const User         = () => mongoose.model('User');
const UserPassword = () => mongoose.model('UserPassword');

// GET /api/user/list  — list all users (owner/admin only)
const list = async (req, res) => {
  const { status, role, page = 1, items = 50 } = req.query;
  const limit  = parseInt(items);
  const skip   = (parseInt(page) - 1) * limit;
  const filter = { removed: false };
  if (status === 'active')   filter.enabled = true;
  if (status === 'pending')  filter.enabled = false;
  if (role)                  filter.role    = role;

  const [result, count] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ created: -1 }),
    User.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    result,
    pagination: { page: parseInt(page), pages: Math.ceil(count / limit), count },
    message: 'Successfully found all users',
  });
};

// PATCH /api/user/activate/:id
const activate = async (req, res) => {
  const user = await User().findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { enabled: true },
    { new: true }
  );
  if (!user)
    return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    'Tomo Platform <noreply@tomo.ke>',
      to:      user.email,
      subject: '[Tomo] Your account is now active!',
      html: `
        <div style="font-family:sans-serif;max-width:480px">
          <h2 style="color:#1f6feb">Welcome to Tomo, ${user.name}!</h2>
          <p>Your <strong>${user.role}</strong> account has been activated.</p>
          <p><a href="${FRONTEND_URL}" style="background:#1f6feb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">Sign In to Tomo</a></p>
        </div>`,
    });
  } catch (e) {
    console.error('[Email] activate error:', e.message);
  }

  return res.status(200).json({ success: true, result: user, message: `${user.name} activated.` });
};

// PATCH /api/user/suspend/:id
const suspend = async (req, res) => {
  const { reason } = req.body;
  if (req.params.id === req.user._id.toString())
    return res.status(403).json({ success: false, result: null, message: 'Cannot suspend yourself.' });

  const user = await User().findOne({ _id: req.params.id, removed: false });
  if (!user)
    return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'Cannot suspend the platform owner.' });

  user.enabled = false;
  await user.save();

  // Invalidate all sessions
  await UserPassword().findOneAndUpdate({ user: user._id }, { loggedSessions: [] });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    'Tomo Platform <noreply@tomo.ke>',
      to:      user.email,
      subject: '[Tomo] Account suspended',
      html: `<p>Hi ${user.name}, your account has been suspended.${reason ? ` Reason: ${reason}` : ''}</p><p>Contact <a href="mailto:${OWNER_EMAIL}">${OWNER_EMAIL}</a> for support.</p>`,
    });
  } catch (e) {
    console.error('[Email] suspend error:', e.message);
  }

  return res.status(200).json({ success: true, result: user, message: `${user.name} suspended.` });
};

// DELETE /api/user/delete/:id
const remove = async (req, res) => {
  const user = await User().findOne({ _id: req.params.id, removed: false });
  if (!user)
    return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'Cannot delete the platform owner.' });

  await User().findByIdAndUpdate(req.params.id, { removed: true });
  await UserPassword().findOneAndUpdate({ user: req.params.id }, { removed: true });

  return res.status(200).json({ success: true, result: {}, message: 'User deleted.' });
};

// GET /api/user/read/:id
const read = async (req, res) => {
  const user = await User().findOne({ _id: req.params.id, removed: false });
  if (!user)
    return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  return res.status(200).json({ success: true, result: user, message: 'User found.' });
};

// PATCH /api/user/profile   — update own profile
const updateProfile = async (req, res) => {
  const { name, phone, company, photo } = req.body;
  const user = await User().findByIdAndUpdate(
    req.user._id,
    { name, phone, company, photo },
    { new: true, runValidators: true }
  );
  return res.status(200).json({ success: true, result: user, message: 'Profile updated.' });
};

// GET /api/user/me
const me = async (req, res) => {
  const user = await User().findOne({ _id: req.user._id, removed: false });
  return res.status(200).json({ success: true, result: user, message: 'Profile found.' });
};

module.exports = { list, activate, suspend, delete: remove, read, updateProfile, me };
