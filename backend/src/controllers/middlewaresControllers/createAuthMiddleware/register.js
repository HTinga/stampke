'use strict';
const sendEmail  = require('@/utils/sendEmail');
const bcrypt     = require('bcryptjs');
const Joi        = require('joi');
const mongoose   = require('mongoose');
const shortid    = require('shortid');
const crypto     = require('crypto');

const OWNER_EMAIL  = process.env.OWNER_EMAIL  || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';

// ── Shared welcome email builder ─────────────────────────────────────────────
const buildWelcomeEmail = (name, verifyUrl) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px">
      <div style="display:inline-block;background:#1f6feb;border-radius:16px;padding:16px 32px">
        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px">StampKE</h1>
        <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Digital Authority Platform</p>
      </div>
    </div>

    <!-- Welcome Card -->
    <div style="background:#161b22;border:1px solid #30363d;border-radius:24px;padding:40px;margin-bottom:24px">
      <h2 style="color:#ffffff;font-size:26px;font-weight:900;margin:0 0 8px">Welcome, ${name}! 👋</h2>
      <p style="color:#58a6ff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 24px">You're officially part of StampKE</p>

      <p style="color:#e6edf3;font-size:16px;line-height:1.7;margin:0 0 20px">
        My name is <strong style="color:#ffffff">Hempstone Tinga</strong>, CEO and Founder of StampKE, and I'm personally excited to welcome you aboard.
      </p>
      <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0 0 20px">
        StampKE was built with one mission: to give Kenyan businesses and professionals <strong style="color:#e6edf3">complete digital document authority</strong> — from legally-binding e-signatures to professional digital stamps, smart invoicing, and beyond.
      </p>
      <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0 0 32px">
        Whether you're a law firm, an SME, a freelancer, or an institution — StampKE gives you the tools to operate with authority, speed, and legal compliance under the Kenya Information and Communications Act (KICA).
      </p>

      <!-- Features Grid -->
      <div style="display:grid;gap:12px;margin-bottom:32px">
        <div style="background:#0d1117;border:1px solid #21262d;border-radius:12px;padding:16px;display:flex;gap:12px">
          <span style="font-size:24px">✍️</span>
          <div><strong style="color:#ffffff;font-size:14px;display:block;margin-bottom:4px">eSign &amp; Stamp</strong><span style="color:#8b949e;font-size:13px">Place legally binding signatures and official stamps on any document in seconds.</span></div>
        </div>
        <div style="background:#0d1117;border:1px solid #21262d;border-radius:12px;padding:16px;display:flex;gap:12px">
          <span style="font-size:24px">🧾</span>
          <div><strong style="color:#ffffff;font-size:14px;display:block;margin-bottom:4px">Smart Invoice</strong><span style="color:#8b949e;font-size:13px">Create, send, and track professional invoices with M-Pesa payment integration.</span></div>
        </div>
        <div style="background:#0d1117;border:1px solid #21262d;border-radius:12px;padding:16px;display:flex;gap:12px">
          <span style="font-size:24px">📄</span>
          <div><strong style="color:#ffffff;font-size:14px;display:block;margin-bottom:4px">Document Hub</strong><span style="color:#8b949e;font-size:13px">Generate contracts, letters, and PDFs from templates — no design skills needed.</span></div>
        </div>
        <div style="background:#0d1117;border:1px solid #21262d;border-radius:12px;padding:16px;display:flex;gap:12px">
          <span style="font-size:24px">👷</span>
          <div><strong style="color:#ffffff;font-size:14px;display:block;margin-bottom:4px">Recruit &amp; Track</strong><span style="color:#8b949e;font-size:13px">Find vetted workers for errands, gigs, and projects across Kenya.</span></div>
        </div>
        <div style="background:#0d1117;border:1px solid #21262d;border-radius:12px;padding:16px;display:flex;gap:12px">
          <span style="font-size:24px">👥</span>
          <div><strong style="color:#ffffff;font-size:14px;display:block;margin-bottom:4px">Client Manager</strong><span style="color:#8b949e;font-size:13px">Manage your clients, leads, and follow-ups from one place.</span></div>
        </div>
      </div>

      ${verifyUrl ? `
      <!-- Verify Email CTA -->
      <div style="background:#0d1117;border:1px solid #1f6feb;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
        <p style="color:#e6edf3;font-size:15px;font-weight:600;margin:0 0 16px">One last step — verify your email to unlock full access:</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#1f6feb;color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:900;font-size:15px">
          ✅ Verify My Email
        </a>
        <p style="color:#484f58;font-size:12px;margin:12px 0 0">Link expires in 48 hours</p>
      </div>` : `
      <!-- CTA for OAuth users -->
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://stampke.vercel.app" style="display:inline-block;background:#1f6feb;color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;font-size:16px">
          🚀 Get Started Now
        </a>
      </div>`}

      <p style="color:#8b949e;font-size:14px;line-height:1.7;margin:0">
        Your account comes with a <strong style="color:#e6edf3">7-day free trial</strong>. Questions? Reply here or email me directly at
        <a href="mailto:hempstonetinga@gmail.com" style="color:#58a6ff;text-decoration:none">hempstonetinga@gmail.com</a>.
      </p>
    </div>

    <!-- Signature -->
    <div style="background:#161b22;border:1px solid #30363d;border-radius:16px;padding:24px;display:flex;gap:16px;align-items:center;margin-bottom:24px">
      <div style="width:56px;height:56px;min-width:56px;background:#1f6feb;border-radius:50%;display:flex;align-items:center;justify-content:center">
        <span style="color:#ffffff;font-weight:900;font-size:20px">HT</span>
      </div>
      <div>
        <strong style="color:#ffffff;font-size:15px;display:block">Hempstone Tinga</strong>
        <span style="color:#58a6ff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Founder &amp; CEO, StampKE</span><br>
        <a href="mailto:hempstonetinga@gmail.com" style="color:#8b949e;font-size:12px;text-decoration:none">hempstonetinga@gmail.com</a>
      </div>
    </div>

    <!-- Footer -->
    <p style="color:#484f58;font-size:12px;text-align:center;margin:0">
      &copy; ${new Date().getFullYear()} StampKE &middot; Nairobi, Kenya &middot; KICA-Compliant eSign Platform<br>
      <a href="https://stampke.vercel.app" style="color:#484f58">stampke.vercel.app</a>
    </p>
  </div>
</body>
</html>`;

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

  if (value.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
    return res.status(403).json({ success: false, result: null, message: 'This account cannot be registered.' });

  const existing = await User.findOne({ email: value.email.toLowerCase(), removed: false });
  if (existing)
    return res.status(409).json({ success: false, result: null, message: 'An account with this email already exists.' });

  const emailVerifyToken   = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const now                = new Date();

  const user = await new User({
    name:    value.name,
    email:   value.email.toLowerCase(),
    company: value.company,
    phone:   value.phone,
    role:    value.role,
    enabled:          true,
    emailVerified:    false,
    emailVerifyToken,
    emailVerifyExpires,
    plan:           value.role === 'business' ? 'trial' : 'free',
    trialStartedAt: value.role === 'business' ? now : undefined,
    trialEndsAt:    value.role === 'business' ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
    removed: false,
  }).save();

  const salt = shortid.generate();
  await new UserPassword({
    user:     user._id,
    password: bcrypt.hashSync(salt + value.password),
    salt,
    removed:  false,
  }).save();

  // ── Send welcome + verification email immediately ────────────────────────
  const verifyUrl = `${FRONTEND_URL}/api/verify-email?token=${emailVerifyToken}&id=${user._id}`;

  sendEmail({
    to:      value.email,
    from:    'Hempstone Tinga, StampKE <noreply@tomo.ke>',
    subject: '🎉 Welcome to StampKE — Verify Your Email',
    html:    buildWelcomeEmail(value.name, verifyUrl),
  });

  // ── Notify owner of new signup ──────────────────────────────────────────
  sendEmail({
    to:      OWNER_EMAIL,
    from:    'StampKE Alerts <noreply@tomo.ke>',
    subject: `[StampKE] New signup — ${value.name} (${value.role})`,
    html:    `<p><strong>${value.name}</strong> (${value.email}) signed up as <strong>${value.role}</strong>.</p>`,
  });

  return res.status(201).json({
    success: true,
    result:  { _id: user._id, email: user.email, role: user.role, name: user.name },
    message: 'Account created! Check your email for a welcome message and verification link.',
  });
};

module.exports = register;
