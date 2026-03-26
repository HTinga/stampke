'use strict';
// ── Google OAuth Callback ─────────────────────────────────────────────────────
const { OAuth2Client } = require('google-auth-library');
const mongoose         = require('mongoose');
const jwt              = require('jsonwebtoken');
const sendEmail        = require('@/utils/sendEmail');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
};

// ── Welcome email sent once on first signup ──────────────────────────────────
const sendWelcomeEmail = (user) => {
  sendEmail({
    to:      user.email,
    from:    'Hempstone Tinga, StampKE <noreply@tomo.ke>',
    subject: '🎉 Welcome to StampKE — Your Digital Authority Platform',
    html: `<!DOCTYPE html>
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
      <h2 style="color:#ffffff;font-size:26px;font-weight:900;margin:0 0 8px">Welcome, ${user.name}! 👋</h2>
      <p style="color:#58a6ff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 24px">You're officially part of StampKE</p>
      
      <p style="color:#e6edf3;font-size:16px;line-height:1.7;margin:0 0 20px">
        My name is <strong style="color:#ffffff">Hempstone Tinga</strong>, CEO and Founder of StampKE, and I'm personally excited to welcome you to our platform.
      </p>
      <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0 0 20px">
        StampKE was built with one mission: to give Kenyan businesses and professionals <strong style="color:#e6edf3">complete digital document authority</strong> — from legally-binding e-signatures to professional digital stamps, smart invoicing, and beyond.
      </p>
      <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0 0 32px">
        Whether you're a law firm, an SME, a freelancer, or an institution — StampKE gives you the tools to operate with authority, speed, and legal compliance under the Kenya Information and Communications Act (KICA).
      </p>

      <!-- Features Grid -->
      <div style="display:grid;gap:12px;margin-bottom:32px">
        ${[
          ['✍️', 'eSign & Stamp', 'Place legally binding signatures and official stamps on any document in seconds.'],
          ['🧾', 'Smart Invoice', 'Create, send, and track professional invoices with M-Pesa payment integration.'],
          ['📄', 'Document Hub', 'Generate contracts, letters, and PDFs from templates — no design skills needed.'],
          ['👷', 'Recruit & Track', 'Find vetted workers for errands, gigs, and projects across Kenya.'],
          ['👥', 'Client Manager', 'Manage your clients, leads, and follow-ups from one place.'],
        ].map(([icon, title, desc]) => `
        <div style="background:#0d1117;border:1px solid #21262d;border-radius:12px;padding:16px;display:flex;gap:12px;align-items:flex-start">
          <span style="font-size:24px;flex-shrink:0">${icon}</span>
          <div>
            <strong style="color:#ffffff;font-size:14px;display:block;margin-bottom:4px">${title}</strong>
            <span style="color:#8b949e;font-size:13px;line-height:1.5">${desc}</span>
          </div>
        </div>`).join('')}
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://stampke.vercel.app" style="display:inline-block;background:#1f6feb;color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;font-size:16px;letter-spacing:0.5px">
          🚀 Get Started Now
        </a>
      </div>

      <p style="color:#8b949e;font-size:14px;line-height:1.7;margin:0">
        Your account is on a <strong style="color:#e6edf3">7-day free trial</strong> — explore everything. If you have any questions, reply directly to this email or reach out at <a href="mailto:hempstonetinga@gmail.com" style="color:#58a6ff;text-decoration:none">hempstonetinga@gmail.com</a>.
      </p>
    </div>

    <!-- Signature -->
    <div style="background:#161b22;border:1px solid #30363d;border-radius:16px;padding:24px;display:flex;gap:16px;align-items:center;margin-bottom:24px">
      <div style="width:56px;height:56px;background:#1f6feb;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span style="color:#ffffff;font-weight:900;font-size:20px">HT</span>
      </div>
      <div>
        <strong style="color:#ffffff;font-size:15px;display:block">Hempstone Tinga</strong>
        <span style="color:#58a6ff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Founder & CEO, StampKE</span><br>
        <a href="mailto:hempstonetinga@gmail.com" style="color:#8b949e;font-size:12px;text-decoration:none">hempstonetinga@gmail.com</a>
      </div>
    </div>

    <!-- Footer -->
    <p style="color:#484f58;font-size:12px;text-align:center;margin:0">
      © ${new Date().getFullYear()} StampKE · Nairobi, Kenya · KICA-Compliant eSign Platform<br>
      <a href="https://stampke.vercel.app" style="color:#484f58">stampke.vercel.app</a>
    </p>
  </div>
</body>
</html>`,
  });
};

const googleCallback = async (req, res) => {
  const FRONTEND_URL = getFrontendUrl(req);
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google sign-in was cancelled.')}`);
  }
  if (!code) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('No authorization code received from Google.')}`);
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google Sign-In not configured. Contact admin.')}`);
  }

  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker' : (stateData.signUpRole || 'business');

  const redirectUri = FRONTEND_URL + '/api/auth/google/callback';

  try {
    const client = new OAuth2Client({ clientId, clientSecret, redirectUri });
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket  = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL.toLowerCase();

    const User         = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    // ── Find existing user (by email OR googleId) ────────────────────────────
    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { googleId }],
    });

    let isNewUser = false;

    if (!user) {
      // ── Create new user — use findOneAndUpdate with upsert to avoid E11000 ──
      isNewUser = true;
      const now = new Date();
      user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $setOnInsert: {
            name,
            email:          normalizedEmail,
            googleId,
            photo:          picture,
            role:           isOwner ? 'superadmin' : intendedRole,
            enabled:        true,            // Google-verified users enabled immediately
            emailVerified:  true,
            plan:           isOwner ? 'enterprise' : 'trial',
            trialStartedAt: isOwner ? undefined : now,
            trialEndsAt:    isOwner ? undefined : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            removed:        false,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Create password record (empty — Google-only user)
      await UserPassword.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id, password: '', salt: '', loggedSessions: [], removed: false } },
        { upsert: true, new: true }
      );

      // Send welcome email to new Google signup
      sendWelcomeEmail(user);

      if (!isOwner) {
        sendEmail({
          to:      OWNER_EMAIL,
          from:    'StampKE Alerts <noreply@tomo.ke>',
          subject: `[StampKE] New Google signup — ${name} (${intendedRole})`,
          html:    `<p><strong>${name}</strong> (${normalizedEmail}) signed up via Google as <strong>${intendedRole}</strong>.</p>`,
        });
      }
    } else {
      // ── Update existing user ─────────────────────────────────────────────
      const updates = {};
      if (!user.googleId)       updates.googleId      = googleId;
      if (!user.photo && picture) updates.photo        = picture;
      if (!user.emailVerified)  updates.emailVerified  = true;
      if (!user.enabled)        updates.enabled        = true;   // re-enable if previously disabled
      if (isOwner && user.role !== 'superadmin') { updates.role = 'superadmin'; updates.enabled = true; }
      if (Object.keys(updates).length) await User.updateOne({ _id: user._id }, { $set: updates });
      // Re-fetch with updates applied
      user = await User.findById(user._id);
    }

    if (!user.enabled) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Your account is pending activation. You will receive an email when approved.')}`);
    }

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await UserPassword.findOneAndUpdate(
      { user: user._id },
      { $push: { loggedSessions: token } },
      { upsert: true }
    );

    const now         = new Date();
    const trialActive = user.plan === 'trial' && user.trialEndsAt && now < new Date(user.trialEndsAt);
    const trialDaysLeft = trialActive
      ? Math.max(0, Math.ceil((new Date(user.trialEndsAt) - now) / 86400000))
      : 0;

    const userData = encodeURIComponent(JSON.stringify({
      token,
      name:             user.name,
      email:            user.email,
      role:             user.role,
      plan:             user.plan,
      trialActive,
      trialDaysLeft,
      adminPermissions: user.adminPermissions || [],
    }));

    return res.redirect(`${FRONTEND_URL}?google_auth=${userData}`);

  } catch (err) {
    console.error('[Google OAuth callback]', err.message, err.stack);
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google sign-in failed. Please try again.')}`);
  }
};

module.exports = googleCallback;
