'use strict';
const { OAuth2Client } = require('google-auth-library');
const mongoose         = require('mongoose');
const jwt              = require('jsonwebtoken');
const sendEmail        = require('@/utils/sendEmail');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';
const FRONTEND_URL_ENV = process.env.FRONTEND_URL || '';

const getFrontendUrl = (req) => {
  if (FRONTEND_URL_ENV) return FRONTEND_URL_ENV.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
};

const buildWelcomeEmail = (name, frontendUrl) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr>
          <td align="center" style="padding:0 0 32px">
            <div style="display:inline-block;background:#18181b;border-radius:14px;padding:14px 28px">
              <span style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px">StampKE</span>
              <span style="color:#71717a;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;display:block;margin-top:2px">Digital Authority Platform</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:20px;padding:48px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
            <h1 style="font-size:28px;font-weight:900;color:#18181b;margin:0 0 12px">Welcome to StampKE.</h1>
            <p style="font-size:16px;color:#52525b;line-height:1.7;margin:0 0 28px">
              Only a fraction of Kenyan businesses have digital document authority — and most brilliant ideas get slowed down by paperwork, manual stamps, and chasing signatures. So we built StampKE to change that. <strong style="color:#18181b">Now you're part of that future.</strong>
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px">
              <tr>
                <td>
                  <a href="${frontendUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:15px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
                    🚀 Start using StampKE &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #f4f4f5;margin:0 0 36px"/>
            <h2 style="font-size:18px;font-weight:800;color:#18181b;margin:0 0 8px">Meet StampKE: Your Digital Authority Platform</h2>
            <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0 0 24px">StampKE is your all-in-one partner for turning paper-heavy workflows into fast, legally-binding digital operations — built for Kenyan law firms, enterprises, and institutions.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              <tr><td style="padding:0 0 12px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px 20px"><tr><td width="36" style="font-size:22px;vertical-align:top;padding-right:14px">✍️</td><td><strong style="font-size:14px;color:#18181b;display:block;margin-bottom:4px">eSign &amp; Stamp</strong><span style="font-size:13px;color:#71717a">Place legally-binding signatures and official stamps on any document. KICA-compliant.</span></td></tr></table></td></tr>
              <tr><td style="padding:0 0 12px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px 20px"><tr><td width="36" style="font-size:22px;vertical-align:top;padding-right:14px">🧾</td><td><strong style="font-size:14px;color:#18181b;display:block;margin-bottom:4px">Smart Invoice</strong><span style="font-size:13px;color:#71717a">Create, send, and track professional invoices with M-Pesa integration.</span></td></tr></table></td></tr>
              <tr><td style="padding:0 0 12px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px 20px"><tr><td width="36" style="font-size:22px;vertical-align:top;padding-right:14px">📄</td><td><strong style="font-size:14px;color:#18181b;display:block;margin-bottom:4px">Document Hub</strong><span style="font-size:13px;color:#71717a">Generate contracts, letters, and PDFs from templates instantly.</span></td></tr></table></td></tr>
              <tr><td style="padding:0 0 12px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px 20px"><tr><td width="36" style="font-size:22px;vertical-align:top;padding-right:14px">👷</td><td><strong style="font-size:14px;color:#18181b;display:block;margin-bottom:4px">Recruit &amp; Track</strong><span style="font-size:13px;color:#71717a">Find vetted workers for errands, gigs, and projects across Kenya.</span></td></tr></table></td></tr>
              <tr><td style="padding:0 0 12px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px 20px"><tr><td width="36" style="font-size:22px;vertical-align:top;padding-right:14px">👥</td><td><strong style="font-size:14px;color:#18181b;display:block;margin-bottom:4px">Client Manager</strong><span style="font-size:13px;color:#71717a">Manage clients, leads, and follow-ups — built for Kenyan businesses.</span></td></tr></table></td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px 24px;margin-bottom:32px">
              <tr><td>
                <strong style="font-size:14px;color:#0369a1;display:block;margin-bottom:6px">🎁 Your 7-day free trial is active</strong>
                <span style="font-size:13px;color:#0c4a6e;line-height:1.6">Explore everything free. After your trial, choose your plan:</span>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px">
                  <tr><td style="padding:3px 0"><span style="font-size:13px;color:#18181b;font-weight:700">Free</span><span style="font-size:12px;color:#71717a;margin-left:8px">KES 0/mo · 3 envelopes · Basic stamps</span></td></tr>
                  <tr><td style="padding:3px 0"><span style="font-size:13px;color:#18181b;font-weight:700">Pro</span><span style="font-size:12px;color:#71717a;margin-left:8px">KES 2,500/mo · Unlimited · AI features · Priority support</span></td></tr>
                  <tr><td style="padding:3px 0"><span style="font-size:13px;color:#18181b;font-weight:700">Enterprise</span><span style="font-size:12px;color:#71717a;margin-left:8px">Custom · Team accounts · API access · Custom branding</span></td></tr>
                </table>
                <a href="${frontendUrl}?section=pricing" style="display:inline-block;margin-top:14px;background:#0369a1;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">View Plans &rarr;</a>
              </td></tr>
            </table>
            <h3 style="font-size:16px;font-weight:800;color:#18181b;margin:0 0 12px">Getting started with StampKE:</h3>
            <ul style="margin:0 0 24px;padding-left:20px;color:#52525b;font-size:14px;line-height:2.1">
              <li>Sign in and upload your first document to sign or stamp</li>
              <li>Invite co-signers and send your first envelope</li>
              <li>Design your official digital stamp in the Stamp Designer</li>
              <li>Create your first invoice and send it to a client</li>
            </ul>
            <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0 0 8px">We're excited to see what you build. Reply to this email any time — I read every one personally.</p>
            <p style="font-size:14px;color:#18181b;font-weight:700;margin:24px 0 0">Let's prove it's possible!</p>
            <hr style="border:none;border-top:1px solid #f4f4f5;margin:32px 0"/>
            <table cellpadding="0" cellspacing="0"><tr>
              <td width="52" style="vertical-align:top;padding-right:14px">
                <div style="width:48px;height:48px;background:#18181b;border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-weight:900;font-size:16px">HT</div>
              </td>
              <td>
                <strong style="font-size:14px;color:#18181b;display:block">Hempstone Tinga</strong>
                <span style="font-size:13px;color:#71717a">CEO &amp; Founder, StampKE</span><br/>
                <a href="mailto:hempstonetinga@gmail.com" style="font-size:12px;color:#71717a;text-decoration:none">hempstonetinga@gmail.com</a>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 0 0;text-align:center">
            <p style="font-size:12px;color:#a1a1aa;margin:0 0 8px">You signed up for StampKE with your Google account.</p>
            <p style="font-size:12px;color:#a1a1aa;margin:0 0 16px">
              <a href="${frontendUrl}/terms" style="color:#a1a1aa;text-decoration:underline">Terms</a>&nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${frontendUrl}/privacy" style="color:#a1a1aa;text-decoration:underline">Privacy</a>&nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${frontendUrl}/unsubscribe" style="color:#a1a1aa;text-decoration:underline">Unsubscribe</a>
            </p>
            <p style="font-size:11px;color:#d4d4d8;margin:0">&copy; ${new Date().getFullYear()} StampKE &middot; Nairobi, Kenya</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const googleCallback = async (req, res) => {
  const FRONTEND_URL = getFrontendUrl(req);
  const { code, state, error: oauthError } = req.query;

  if (oauthError) return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google sign-in was cancelled.')}`);
  if (!code)      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('No authorization code received from Google.')}`);

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google Sign-In not configured. Contact admin.')}`);
  }

  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker' : (stateData.signUpRole || 'business');
  const redirectUri  = FRONTEND_URL + '/api/auth/google/callback';

  try {
    const client = new OAuth2Client({ clientId, clientSecret, redirectUri });

    let tokens;
    try {
      const result = await client.getToken(code);
      tokens = result.tokens;
    } catch (tokenErr) {
      // invalid_grant = expired or already-used auth code (e.g. user hit back button)
      if (tokenErr.message?.includes('invalid_grant') || tokenErr.response?.data?.error === 'invalid_grant') {
        console.warn('[Google OAuth] invalid_grant — code expired or already used');
        return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Sign-in link expired. Please try again.')}`);
      }
      throw tokenErr; // re-throw unexpected errors
    }

    client.setCredentials(tokens);

    const ticket  = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL.toLowerCase();

    const User         = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    // Find by email OR googleId (no removed filter — handle all cases)
    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { googleId }] });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const now = new Date();

      // Build new user doc — omit undefined fields to avoid Mongoose warnings
      const newUserDoc = {
        name,
        email:         normalizedEmail,
        googleId,
        enabled:       true,
        emailVerified: true,
        removed:       false,
        role:          isOwner ? 'superadmin' : intendedRole,
        plan:          isOwner ? 'enterprise' : 'trial',
      };
      if (picture) newUserDoc.photo = picture;
      if (!isOwner) {
        newUserDoc.trialStartedAt = now;
        newUserDoc.trialEndsAt    = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      // Upsert — prevents E11000 on concurrent/retry requests
      user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $setOnInsert: newUserDoc },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      await UserPassword.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id, password: '', salt: '', loggedSessions: [], removed: false } },
        { upsert: true, new: true }
      );

      // AWAIT welcome email — must complete before serverless function exits
      await sendEmail({
        to:      normalizedEmail,
        from:    'Hempstone Tinga @ StampKE <noreply@tomo.ke>',
        subject: 'Welcome to StampKE — Your Digital Authority Platform 🎉',
        html:    buildWelcomeEmail(name, FRONTEND_URL),
      });

      if (!isOwner) {
        await sendEmail({
          to:      OWNER_EMAIL,
          from:    'StampKE Alerts <noreply@tomo.ke>',
          subject: `[StampKE] New Google signup — ${name} (${intendedRole})`,
          html:    `<p><b>${name}</b> (${normalizedEmail}) signed up via Google as <b>${intendedRole}</b>.</p>`,
        });
      }
    } else {
      // Update existing user fields as needed
      const updates = {};
      if (!user.googleId)              updates.googleId      = googleId;
      if (picture && !user.photo)      updates.photo         = picture;
      if (!user.emailVerified)         updates.emailVerified = true;
      if (!user.enabled)               updates.enabled       = true;
      if (isOwner && user.role !== 'superadmin') { updates.role = 'superadmin'; updates.enabled = true; }
      if (Object.keys(updates).length) await User.updateOne({ _id: user._id }, { $set: updates });
      user = await User.findById(user._id);
    }

    if (!user || !user.enabled) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Your account is pending activation. You will receive an email when approved.')}`);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await UserPassword.findOneAndUpdate(
      { user: user._id },
      { $push: { loggedSessions: token } },
      { upsert: true }
    );

    const now           = new Date();
    const trialActive   = user.plan === 'trial' && user.trialEndsAt && now < new Date(user.trialEndsAt);
    const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((new Date(user.trialEndsAt) - now) / 86400000)) : 0;

    const userData = encodeURIComponent(JSON.stringify({
      token, name: user.name, email: user.email, role: user.role,
      plan: user.plan, trialActive, trialDaysLeft,
      adminPermissions: user.adminPermissions || [],
    }));

    return res.redirect(`${FRONTEND_URL}?google_auth=${userData}`);

  } catch (err) {
    console.error('[Google OAuth callback]', err.message, err.stack);
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google sign-in failed. Please try again.')}`);
  }
};

module.exports = googleCallback;
