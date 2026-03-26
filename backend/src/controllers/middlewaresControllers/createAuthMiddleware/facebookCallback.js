'use strict';
// ── Facebook OAuth Callback ────────────────────────────────────────────────────
const mongoose  = require('mongoose');
const jwt       = require('jsonwebtoken');
const sendEmail = require('@/utils/sendEmail');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
};

const buildWelcomeEmail = (name) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:40px">
      <div style="display:inline-block;background:#1f6feb;border-radius:16px;padding:16px 32px">
        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900">StampKE</h1>
        <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Digital Authority Platform</p>
      </div>
    </div>
    <div style="background:#161b22;border:1px solid #30363d;border-radius:24px;padding:40px;margin-bottom:24px">
      <h2 style="color:#ffffff;font-size:26px;font-weight:900;margin:0 0 8px">Welcome, ${name}! 👋</h2>
      <p style="color:#58a6ff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 24px">You're officially part of StampKE</p>
      <p style="color:#e6edf3;font-size:16px;line-height:1.7;margin:0 0 20px">My name is <strong>Hempstone Tinga</strong>, CEO and Founder of StampKE, and I'm personally excited to welcome you aboard.</p>
      <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0 0 32px">StampKE gives Kenyan businesses and professionals <strong style="color:#e6edf3">complete digital document authority</strong> — legally-binding e-signatures, professional stamps, smart invoicing, and more. Fully KICA-compliant.</p>
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://stampke.vercel.app" style="display:inline-block;background:#1f6feb;color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;font-size:16px">🚀 Get Started Now</a>
      </div>
      <p style="color:#8b949e;font-size:14px;line-height:1.7;margin:0">Your account comes with a <strong style="color:#e6edf3">7-day free trial</strong>. Questions? Email me at <a href="mailto:hempstonetinga@gmail.com" style="color:#58a6ff;text-decoration:none">hempstonetinga@gmail.com</a>.</p>
    </div>
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
    <p style="color:#484f58;font-size:12px;text-align:center;margin:0">&copy; ${new Date().getFullYear()} StampKE &middot; Nairobi, Kenya</p>
  </div>
</body>
</html>`;

const facebookCallback = async (req, res) => {
  const FRONTEND_URL = getFrontendUrl(req);
  const { code, state, error: oauthError } = req.query;

  if (oauthError) return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in was cancelled.')}`);
  if (!code)      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('No authorization code received from Facebook.')}`);

  const appId     = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook Sign-In not configured. Contact admin.')}`);
  }

  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker' : (stateData.signUpRole || 'business');

  const redirectUri = FRONTEND_URL + '/api/auth/facebook/callback';

  try {
    const tokenUrl  = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes  = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Facebook OAuth] Token exchange failed:', tokenData);
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in failed. Please try again.')}`);
    }

    const profileUrl  = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`;
    const profileRes  = await fetch(profileUrl);
    const profile     = await profileRes.json();

    if (!profile.id) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Could not retrieve Facebook profile.')}`);
    }

    const { id: facebookId, name, email, picture } = profile;
    const photoUrl = picture?.data?.url || null;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook account has no public email. Please use email/password sign-in.')}`);
    }

    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL.toLowerCase();

    const User         = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { facebookId }] });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const now = new Date();
      // Use upsert to avoid E11000 duplicate key errors
      user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $setOnInsert: {
            name, email: normalizedEmail, facebookId,
            photo:          photoUrl,
            role:           isOwner ? 'superadmin' : intendedRole,
            enabled:        true,
            emailVerified:  true,
            plan:           isOwner ? 'enterprise' : 'trial',
            trialStartedAt: isOwner ? undefined : now,
            trialEndsAt:    isOwner ? undefined : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            removed:        false,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      await UserPassword.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id, password: '', salt: '', loggedSessions: [], removed: false } },
        { upsert: true, new: true }
      );

      sendEmail({
        to:      user.email,
        from:    'Hempstone Tinga, StampKE <noreply@tomo.ke>',
        subject: '🎉 Welcome to StampKE — Your Digital Authority Platform',
        html:    buildWelcomeEmail(user.name),
      });

      if (!isOwner) {
        sendEmail({
          to:      OWNER_EMAIL,
          from:    'StampKE Alerts <noreply@tomo.ke>',
          subject: `[StampKE] New Facebook signup — ${name} (${intendedRole})`,
          html:    `<p><strong>${name}</strong> (${normalizedEmail}) signed up via Facebook as <strong>${intendedRole}</strong>.</p>`,
        });
      }
    } else {
      const updates = {};
      if (!user.facebookId)          updates.facebookId    = facebookId;
      if (!user.photo && photoUrl)   updates.photo         = photoUrl;
      if (!user.emailVerified)       updates.emailVerified = true;
      if (!user.enabled)             updates.enabled       = true;
      if (isOwner && user.role !== 'superadmin') { updates.role = 'superadmin'; updates.enabled = true; }
      if (Object.keys(updates).length) await User.updateOne({ _id: user._id }, { $set: updates });
      user = await User.findById(user._id);
    }

    if (!user.enabled) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Your account is pending activation.')}`);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await UserPassword.findOneAndUpdate({ user: user._id }, { $push: { loggedSessions: token } }, { upsert: true });

    const now         = new Date();
    const trialActive = user.plan === 'trial' && user.trialEndsAt && now < new Date(user.trialEndsAt);
    const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((new Date(user.trialEndsAt) - now) / 86400000)) : 0;

    const userData = encodeURIComponent(JSON.stringify({
      token, name: user.name, email: user.email, role: user.role,
      plan: user.plan, trialActive, trialDaysLeft,
      adminPermissions: user.adminPermissions || [],
    }));

    return res.redirect(`${FRONTEND_URL}?facebook_auth=${userData}`);

  } catch (err) {
    console.error('[Facebook OAuth callback]', err.message);
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in failed. Please try again.')}`);
  }
};

module.exports = facebookCallback;
