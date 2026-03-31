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

  // Check if admin approval is still valid
  const adminApprovalActive = user.adminApproved && user.approvalExpiresAt && now < new Date(user.approvalExpiresAt);
  const approvalDaysLeft = adminApprovalActive
    ? Math.max(0, Math.ceil((new Date(user.approvalExpiresAt) - now) / (1000*60*60*24)))
    : 0;

  return res.status(200).json({
    success: true,
    result: {
      ...user.toObject(),
      trialActive,
      trialDaysLeft,
      adminApproved: user.adminApproved || false,
      adminApprovalActive,
      approvalDaysLeft,
      approvalExpiresAt: user.approvalExpiresAt,
    },
    message: 'Profile found.',
  });
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
    plan:             'business',
    removed:          false,
  }).save();

  const salt    = shortid.generate();
  const hashed  = bcrypt.hashSync(salt + password);
  await new (UserPassword())({ user: newAdmin._id, password: hashed, salt, removed: false }).save();

  return res.status(200).json({ success: true, result: newAdmin, message: `Admin ${name} created successfully.` });
};

// PATCH /api/user/grant-plan/:id — superadmin approves access for 1-12 months
const grantPlan = async (req, res) => {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ success: false, result: null, message: 'Only superadmin can grant access.' });

  const { plan, approvalMonths, approvalExpiresAt, adminApproved } = req.body;

  if (!['starter', 'pro', 'business', 'trial', 'free'].includes(plan))
    return res.status(400).json({ success: false, result: null, message: 'Invalid plan.' });

  // Calculate expiry: use provided date or compute from approvalMonths
  let expiresAt = approvalExpiresAt ? new Date(approvalExpiresAt) : null;
  if (!expiresAt && approvalMonths) {
    expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(approvalMonths, 10));
  }

  const updateData = {
    plan,
    planActivatedAt: new Date(),
    planGrantedBy: req.user._id,
    adminApproved: adminApproved !== false, // default true
    approvalExpiresAt: expiresAt,
    approvalMonths: approvalMonths || 1,
  };

  const user = await User().findOneAndUpdate(
    { _id: req.params.id, removed: false },
    updateData,
    { new: true }
  );
  if (!user) return res.status(404).json({ success: false, result: null, message: 'User not found.' });

  // Format expiry for email
  const expiryStr = expiresAt
    ? expiresAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'indefinitely';
  const months = approvalMonths || 1;

  // Send branded approval email via Resend (falls back to legacy sendEmail)
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'StampKE <noreply@stampke.co.ke>',
        to: [user.email],
        subject: `✅ Your StampKE ${plan.charAt(0).toUpperCase() + plan.slice(1)} access has been approved`,
        html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8faff;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1a73e8,#1557b0);padding:32px 40px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Access Approved 🎉</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">StampKE Digital Stamp & eSign Platform</p>
  </div>
  <div style="padding:40px;">
    <p style="color:#374151;font-size:16px;font-weight:600;">Hi ${user.name},</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">Your <strong>StampKE ${plan.toUpperCase()} plan</strong> has been approved by your organization administrator for <strong>${months} month${months > 1 ? 's' : ''}</strong>.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:24px 0;">
      <p style="margin:0;color:#166534;font-size:13px;"><strong>Access expires:</strong> ${expiryStr}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${FRONTEND_URL}" style="display:inline-block;background:#1a73e8;color:white;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:600;">Sign in to StampKE →</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;">© 2025 JijiTechy Innovations · Nairobi, Kenya · LSK Compliant</p>
  </div>
</div>
</body></html>`,
      }),
    }).catch(err => console.warn('[grant-plan] Resend error (non-fatal):', err.message));
  } else {
    sendEmail({
      to: user.email,
      subject: `[StampKE] Your ${plan} access has been approved for ${months} month(s)`,
      html: `<p>Hi ${user.name}, your StampKE ${plan} plan has been approved until ${expiryStr}. <a href="${FRONTEND_URL}">Sign in to get started</a></p>`,
      from: 'StampKE <noreply@stampke.co.ke>',
    });
  }

  return res.status(200).json({ success: true, result: user, message: `Access approved: ${plan} plan for ${months} month(s) until ${expiryStr}.` });
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


// POST /api/user/usage — increment a free usage counter
const trackUsage = async (req, res) => {
  const { feature } = req.body;
  const LIMITS = { esign: 1, stamp: 1, invoice: 1, pdf: 1, summarizer: 1, assistant: 1, scrape: 1 };
  const FIELD_MAP = { esign: 'freeUsage.eSignCount', stamp: 'freeUsage.stampCount', invoice: 'freeUsage.invoiceCount', pdf: 'freeUsage.pdfCount', summarizer: 'freeUsage.summarizerCount', assistant: 'freeUsage.assistantCount', scrape: 'freeUsage.scrapeCount' };
  if (!FIELD_MAP[feature]) return res.status(400).json({ success: false, message: 'Unknown feature.' });

  const UserM = mongoose.model('User');
  const user = await UserM.findOne({ _id: req.user._id, removed: false });
  const isPaid = ['starter','pro','business'].includes(user.plan) || (user.plan === 'trial' && user.trialEndsAt && new Date() < user.trialEndsAt);
  if (isPaid) return res.status(200).json({ success: true, result: { allowed: true, remaining: 999 }, message: 'Premium user.' });

  const countKey = feature === 'esign' ? 'eSignCount' : feature === 'stamp' ? 'stampCount' : feature === 'invoice' ? 'invoiceCount' : feature === 'pdf' ? 'pdfCount' : feature === 'summarizer' ? 'summarizerCount' : feature === 'assistant' ? 'assistantCount' : 'scrapeCount';
  const current = (user.freeUsage || {})[countKey] || 0;
  const limit = LIMITS[feature];

  if (current >= limit) return res.status(200).json({ success: true, result: { allowed: false, remaining: 0, limit }, message: `Free ${feature} limit reached. Please upgrade.` });

  await UserM.findByIdAndUpdate(req.user._id, { $inc: { [`freeUsage.${countKey}`]: 1 } });
  return res.status(200).json({ success: true, result: { allowed: true, remaining: limit - current - 1, limit, used: current + 1 }, message: 'Usage recorded.' });
};

// GET /api/user/usage — get current usage counts
const getUsage = async (req, res) => {
  const UserM = mongoose.model('User');
  const user = await UserM.findOne({ _id: req.user._id, removed: false });
  const isPaid = ['starter','pro','business'].includes(user.plan) || (user.plan === 'trial' && user.trialEndsAt && new Date() < user.trialEndsAt);
  const usage = user.freeUsage || {};
  return res.status(200).json({ success: true, result: {
    isPaid,
    esign:      { used: usage.eSignCount     || 0, limit: 1, remaining: Math.max(0, 1 - (usage.eSignCount     || 0)) },
    stamp:      { used: usage.stampCount     || 0, limit: 1, remaining: Math.max(0, 1 - (usage.stampCount     || 0)) },
    invoice:    { used: usage.invoiceCount   || 0, limit: 1, remaining: Math.max(0, 1 - (usage.invoiceCount   || 0)) },
    pdf:        { used: usage.pdfCount       || 0, limit: 1, remaining: Math.max(0, 1 - (usage.pdfCount       || 0)) },
    summarizer: { used: usage.summarizerCount|| 0, limit: 1, remaining: Math.max(0, 1 - (usage.summarizerCount|| 0)) },
    assistant:  { used: usage.assistantCount || 0, limit: 1, remaining: Math.max(0, 1 - (usage.assistantCount || 0)) },
    scrape:     { used: usage.scrapeCount    || 0, limit: 1, remaining: Math.max(0, 1 - (usage.scrapeCount    || 0)) },
  }, message: 'Usage fetched.' });
};

// POST /api/user/usage/bulk — increment a free usage counter by multiple
// body: { feature: 'esign' | 'stamp' | 'invoice' | 'pdf' | 'summarizer' | 'assistant' | 'scrape', count: number }
const trackBulkUsage = async (req, res) => {
  const { feature, count = 1 } = req.body;
  const LIMITS = { esign: 1, stamp: 1, invoice: 1, pdf: 1, summarizer: 1, assistant: 1, scrape: 1 };
  const FIELD_MAP = { esign: 'freeUsage.eSignCount', stamp: 'freeUsage.stampCount', invoice: 'freeUsage.invoiceCount', pdf: 'freeUsage.pdfCount', summarizer: 'freeUsage.summarizerCount', assistant: 'freeUsage.assistantCount', scrape: 'freeUsage.scrapeCount' };
  
  if (!FIELD_MAP[feature]) return res.status(400).json({ success: false, message: 'Unknown feature.' });

  const UserM = mongoose.model('User');
  const user = await UserM.findOne({ _id: req.user._id, removed: false });
  const isPaid = ['starter','pro','business'].includes(user.plan) || (user.plan === 'trial' && user.trialEndsAt && new Date() < user.trialEndsAt);
  
  if (isPaid) {
    const key = feature === 'esign' ? 'eSignCount' : feature === 'stamp' ? 'stampCount' : feature === 'invoice' ? 'invoiceCount' : feature === 'pdf' ? 'pdfCount' : feature === 'summarizer' ? 'summarizerCount' : feature === 'assistant' ? 'assistantCount' : 'scrapeCount';
    await UserM.findByIdAndUpdate(req.user._id, { $inc: { [`freeUsage.${key}`]: count } });
    return res.status(200).json({ success: true, result: { allowed: true, remaining: 999 }, message: 'Premium usage recorded.' });
  }

  const countKey = feature === 'esign' ? 'eSignCount' : feature === 'stamp' ? 'stampCount' : feature === 'invoice' ? 'invoiceCount' : feature === 'pdf' ? 'pdfCount' : feature === 'summarizer' ? 'summarizerCount' : feature === 'assistant' ? 'assistantCount' : 'scrapeCount';
  const current = (user.freeUsage || {})[countKey] || 0;
  const limit = LIMITS[feature];

  if (current >= limit) {
    return res.status(200).json({ success: true, result: { allowed: false, remaining: 0, limit }, message: `Free ${feature} limit reached. Please upgrade.` });
  }

  // Increment bulk
  await UserM.findByIdAndUpdate(req.user._id, { $inc: { [`freeUsage.${countKey}`]: count } });
  return res.status(200).json({ success: true, result: { allowed: true, remaining: Math.max(0, limit - current - count), limit, used: current + count }, message: 'Bulk usage recorded.' });
};

module.exports = { list, activate, suspend, delete: remove, read, updateProfile, me, createAdmin, grantPlan, updateAdminPermissions, trackUsage, getUsage, trackBulkUsage };
