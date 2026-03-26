'use strict';
// ── Facebook OAuth Callback ────────────────────────────────────────────────────
// Handles the redirect from Facebook after user approves sign-in
// Flow: Frontend → Facebook → GET /auth/facebook/callback?code=... → this handler
//       → exchanges code for access token → gets user profile → creates/finds user → JWT → redirect

const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const sendEmail = require('@/utils/sendEmail');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
};

const facebookCallback = async (req, res) => {
  const FRONTEND_URL = getFrontendUrl(req);
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in was cancelled.')}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('No authorization code received from Facebook.')}`);
  }

  const appId     = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('[Facebook OAuth] FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set');
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook Sign-In not configured. Contact admin.')}`);
  }

  // Parse state
  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker'
    : (stateData.signUpRole || 'business');

  const redirectUri = FRONTEND_URL + '/api/auth/facebook/callback';

  try {
    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}&code=${code}`;

    const tokenRes  = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Facebook OAuth] Token exchange failed:', tokenData);
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in failed. Please try again.')}`);
    }

    // Get user profile from Facebook Graph API
    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`;
    const profileRes  = await fetch(profileUrl);
    const profile     = await profileRes.json();

    if (!profile.id) {
      console.error('[Facebook OAuth] Profile fetch failed:', profile);
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Could not retrieve Facebook profile.')}`);
    }

    const { id: facebookId, name, email, picture } = profile;
    const photoUrl = picture?.data?.url || null;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook account does not have a public email. Please use email/password sign-in or ensure your Facebook email is public.')}`);
    }

    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL.toLowerCase();

    const User         = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { facebookId }],
      removed: false,
    });

    if (!user) {
      user = await new User({
        name,
        email:         normalizedEmail,
        facebookId,
        photo:         photoUrl,
        role:          isOwner ? 'superadmin' : intendedRole,
        enabled:       true,
        emailVerified: true,
        plan:          isOwner ? 'enterprise' : 'trial',
        trialStartedAt: isOwner ? undefined : new Date(),
        trialEndsAt:    isOwner ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        removed: false,
      }).save();

      await new UserPassword({ user: user._id, password: '', salt: '', loggedSessions: [], removed: false }).save();

      if (!isOwner) {
        sendEmail({
          to:      OWNER_EMAIL,
          subject: `[StampKE] New Facebook signup — ${name} (${user.role})`,
          html:    `<p><strong>${name}</strong> (${normalizedEmail}) signed up via Facebook as <strong>${user.role}</strong>. Activate in SuperAdmin → Users.</p>`,
        });
      }
    } else {
      if (!user.facebookId) { user.facebookId = facebookId; user.emailVerified = true; }
      if (!user.photo && photoUrl) user.photo = photoUrl;
      if (isOwner && user.role !== 'superadmin') { user.role = 'superadmin'; user.enabled = true; }
      await user.save();
    }

    if (!user.enabled) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Your account is pending activation. You will receive an email when approved.')}`);
    }

    // Issue JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await UserPassword.findOneAndUpdate({ user: user._id }, { $push: { loggedSessions: token } }, { upsert: true });

    const now           = new Date();
    const trialActive   = user.plan === 'trial' && user.trialEndsAt && now < user.trialEndsAt;
    const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((user.trialEndsAt - now) / 86400000)) : 0;

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
