const sendEmail = require('@/utils/sendEmail');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const shortid    = require('shortid');

const OWNER_EMAIL  = process.env.OWNER_EMAIL  || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const User         = () => mongoose.model('User');
const UserPassword = () => mongoose.model('UserPassword');

// GET /api/user/me
const me = async (req, res) => {
  const user = await User().findOne({ _id: req.user._id, removed: false });
  const now  = new Date();
  const trialActive   = user.plan === 'trial' && user.trialEndsAt && now < user.trialEndsAt;
  const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((user.trialEndsAt - now) / (1000*60*60*24))) : 0;
  return res.status(200).json({ success: true, result: { ...user.toObject(), trialActive, trialDaysLeft }, message: 'Profile found.' });
};

// PATCH /api/user/profile
const updateProfile = async (req, res) => {
  const { name, phone, company, photo } = req.body;
  const user = await User().findByIdAndUpdate(req.user._id, { name, phone, company, photo }, { new: true, runValidators: true });
  return res.status(200).json({ success: true, result: user, message: 'Profile updated.' });
};

// GET /api/user/list — list all users (superadmin sees all, admin sees only business+worker)
const list = async (req, res) => {
  const { status, role, page = 1, items = 50 } = req.query;
  const limit  = parseInt(items);
  const skip   = (parseInt(page) - 1) * limit;
  const filter = { removed: false };

  // Admins can only see business and worker accounts
  if (req.user.role === 'admin') {
    filter.role = { $in: ['business', 'worker'] };
  } else if (role) {
    filter.role = role;
  }

  if (status === 'active')   filter.enabled = true;
  if (status === 'pending')  filter.enabled = false;

  const [result, count] = await Promise.all([
    User().find(filter).skip(skip).limit(limit).sort({ created: -1 }).select('-emailVerifyToken'),
    User().countDocuments(filter),
  ]);
  return res.status(200).json({ success: true, result, pagination: { page: parseInt(page), pages: Math.ceil(count / limit), count }, message: 'Users found.' });
};

// GET /api/user/read/:id
const read = async (req, res) => {
  const user = await User().findOne({ _id: req.params.id, removed: false }).select('-emailVerifyToken');
  if (!user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  return res.status(200).json({ success: true, result: user, message: 'User found.' });
};

// PATCH /api/user/activate/:id
const activate = async (req, res) => {
  const user = await User().findOneAndUpdate({ _id: req.params.id, removed: false }, { enabled: true }, { new: true });
  if (!user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  sendEmail({ to: user.email, subject: '[Tomo] Your account is now active!', html: `<p>Hi ${user.name}, your account has been activated. <a href="${FRONTEND_URL}">Sign in to Tomo</a></p>`, from: 'Tomo <noreply@tomo.ke>' });
  return res.status(200).json({ success: true, result: user, message: `${user.name} activated.` });
};

// PATCH /api/user/suspend/:id
const suspend = async (req, res) => {
  const { reason } = req.body;
  if (req.params.id === req.user._id.toString())
    return res.status(403).json({ success: false, result: null, message: 'Cannot suspend yourself.' });
  const user = await User().findOne({ _id: req.params.id, removed: false });
  if (!user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'Cannot suspend the platform owner.' });
  // Admin cannot suspend other admins or superadmin
  if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(user.role))
    return res.status(403).json({ success: false, result: null, message: 'Insufficient permissions.' });

  user.enabled = false;
  await user.save();
  await UserPassword().findOneAndUpdate({ user: user._id }, { loggedSessions: [] });
  return res.status(200).json({ success: true, result: user, message: `${user.name} suspended.` });
};

// DELETE /api/user/delete/:id (soft)
const remove = async (req, res) => {
  const user = await User().findOne({ _id: req.params.id, removed: false });
  if (!user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  if (user.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'Cannot delete the platform owner.' });
  if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(user.role))
    return res.status(403).json({ success: false, result: null, message: 'Insufficient permissions.' });
  await User().findByIdAndUpdate(req.params.id, { removed: true });
  await UserPassword().findOneAndUpdate({ user: req.params.id }, { removed: true });
  return res.status(200).json({ success: true, result: {}, message: 'User deleted.' });
};

// POST /api/user/create-admin — superadmin creates a sub-admin with specific permissions
const createAdmin = async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ success: false, result: null, message: 'Only superadmin can create admins.' });

  const { name, email, password, adminPermissions = [] } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, result: null, message: 'name, email and password are required.' });

  const existing = await User().findOne({ email: email.toLowerCase(), removed: false });
  if (existing) return res.status(409).json({ success: false, result: null, message: 'Email already registered.' });

  const newAdmin = await new (User())({
    name, email: email.toLowerCase(),
    role:             'admin',
    enabled:          true,
    emailVerified:    true,
    adminPermissions: adminPermissions,
    createdBy:        req.user._id,
    plan:             'enterprise',
    removed:          false,
  }).save();

  const salt    = shortid.generate();
  const hashed  = bcrypt.hashSync(salt + password);
  await new (UserPassword())({ user: newAdmin._id, password: hashed, salt, removed: false }).save();

  return res.status(200).json({ success: true, result: newAdmin, message: `Admin ${name} created successfully.` });
};

// PATCH /api/user/grant-plan/:id — superadmin grants a plan to a business user
const grantPlan = async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ success: false, result: null, message: 'Only superadmin can grant plans.' });
  const { plan } = req.body;
  if (!['free', 'pro', 'enterprise', 'trial'].includes(plan))
    return res.status(400).json({ success: false, result: null, message: 'Invalid plan.' });

  const user = await User().findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { plan, planActivatedAt: new Date(), planGrantedBy: req.user._id },
    { new: true }
  );
  if (!user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  sendEmail({ to: user.email, subject: `[Tomo] Your plan has been upgraded to ${plan.toUpperCase()}!`, html: `<p>Hi ${user.name}, you now have access to all ${plan} features on Tomo. <a href="${FRONTEND_URL}">Sign in to get started</a></p>`, from: 'Tomo <noreply@tomo.ke>' });

  return res.status(200).json({ success: true, result: user, message: `Plan upgraded to ${plan}.` });
};

// PATCH /api/user/admin-permissions/:id — update sub-admin permissions
const updateAdminPermissions = async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ success: false, result: null, message: 'Only superadmin can update admin permissions.' });
  const { adminPermissions } = req.body;
  const user = await User().findOneAndUpdate(
    { _id: req.params.id, role: 'admin', removed: false },
    { adminPermissions },
    { new: true }
  );
  if (!user) return res.status(404).json({ success: false, result: null, message: 'Admin not found.' });
  return res.status(200).json({ success: true, result: user, message: 'Permissions updated.' });
};

module.exports = { list, activate, suspend, delete: remove, read, updateProfile, me, createAdmin, grantPlan, updateAdminPermissions };
