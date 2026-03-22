'use strict';
// ── Google OAuth Callback ─────────────────────────────────────────────────────
// Handles the redirect from Google after user approves sign-in
// Flow: Frontend → Google → GET /auth/google/callback?code=... → this handler
//       → exchanges code for tokens → verifies → creates/finds user → JWT → redirect

const { OAuth2Client } = require('google-auth-library');
const mongoose         = require('mongoose');
const jwt              = require('jsonwebtoken');
const sendEmail        = require('@/utils/sendEmail');

const OWNER_EMAIL  = process.env.OWNER_EMAIL  || 'hempstonetinga@gmail.com';
// Detect frontend URL from request or env — works even if FRONTEND_URL not set
const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  // Derive from request host (Vercel sets x-forwarded-host)
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
};

const googleCallback = async (req, res) => {
  const FRONTEND_URL = getFrontendUrl(req);
  const { code, state, error: oauthError } = req.query;

  // User denied permission
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

  // Parse state (contains landingType and signUpRole from frontend)
  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker'
    : (stateData.signUpRole || 'business');

  // Determine callback URL — must exactly match what's registered in Google Console
  // Must exactly match what's registered in Google Console AND what the frontend sends
  // We use /api/auth/google/callback so it routes through the Vercel /api/* function
  // redirectUri must exactly match Google Console AND what frontend sent
  const redirectUri = FRONTEND_URL + '/api/auth/google/callback';

  try {
    const client = new OAuth2Client({ clientId, clientSecret, redirectUri });

    // Exchange auth code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info from ID token
    const ticket  = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL.toLowerCase();

    const User         = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { googleId }],
      removed: false,
    });

    if (!user) {
      user = await new User({
        name,
        email:         normalizedEmail,
        googleId,
        photo:         picture,
        role:          isOwner ? 'superadmin' : intendedRole,
        enabled:       isOwner,
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
          subject: `[Tomo] New Google signup — ${name} (${user.role})`,
          html:    `<p><strong>${name}</strong> (${normalizedEmail}) signed up via Google as <strong>${user.role}</strong>. Activate in SuperAdmin → Users.</p>`,
        });
      }
    } else {
      // Link Google to existing account
      if (!user.googleId) { user.googleId = googleId; user.emailVerified = true; }
      if (!user.photo) user.photo = picture;
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

    // Redirect back to frontend with token in URL fragment (never in query string)
    const userData = encodeURIComponent(JSON.stringify({
      token, name: user.name, email: user.email, role: user.role,
      plan: user.plan, trialActive, trialDaysLeft,
      adminPermissions: user.adminPermissions || [],
    }));
    return res.redirect(`${FRONTEND_URL}?google_auth=${userData}`);

  } catch (err) {
    console.error('[Google OAuth callback]', err.message);
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google sign-in failed. Please try again.')}`);
  }
};

module.exports = googleCallback;
