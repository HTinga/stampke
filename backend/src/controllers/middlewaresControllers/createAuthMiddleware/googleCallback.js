'use strict';
const { OAuth2Client } = require('google-auth-library');
const supabase = require('@/config/supabase');
const jwt = require('jsonwebtoken');
const sendEmail = require('@/utils/sendEmail');

const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com').toLowerCase();
const FRONTEND_URL_ENV = process.env.FRONTEND_URL || '';

const getFrontendUrl = (req) => {
  if (FRONTEND_URL_ENV) return FRONTEND_URL_ENV.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
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
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const googleCallback = async (req, res) => {
  const FRONTEND_URL = getFrontendUrl(req);
  const { code, state, error: oauthError } = req.query;

  if (oauthError) return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google sign-in was cancelled.')}`);
  if (!code) return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('No authorization code received from Google.')}`);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google Sign-In not configured.')}`);
  }

  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker' : (stateData.signUpRole || 'business');
  const redirectUri = FRONTEND_URL + '/api/auth/google/callback';

  try {
    const client = new OAuth2Client({ clientId, clientSecret, redirectUri });

    let tokens;
    try {
      const result = await client.getToken(code);
      tokens = result.tokens;
    } catch (tokenErr) {
      if (tokenErr.message?.includes('invalid_grant')) {
        return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Sign-in link expired. Please try again.')}`);
      }
      throw tokenErr;
    }

    client.setCredentials(tokens);
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL;

    // Supabase User Interaction
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${normalizedEmail},google_id.eq.${googleId}`)
      .eq('removed', false)
      .maybeSingle();

    let user = existingUser;

    if (!user) {
      const now = new Date();
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name,
          email: normalizedEmail,
          google_id: googleId,
          photo: picture,
          role: isOwner ? 'superadmin' : intendedRole,
          enabled: true,
          email_verified: true,
          removed: false,
          plan: isOwner ? 'enterprise' : 'trial',
          trial_started_at: isOwner ? null : now.toISOString(),
          trial_ends_at: isOwner ? null : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      user = newUser;

      await supabase.from('user_passwords').insert([{ user_id: user.id, password_hash: '', salt: '' }]);

      // Send welcome
      try {
        await sendEmail({
          to: normalizedEmail,
          from: 'StampKE <noreply@stampke.co.ke>',
          subject: 'Welcome to StampKE 🎉',
          html: buildWelcomeEmail(name, FRONTEND_URL),
        });
      } catch (err) { console.error('[Email] welcome error:', err.message); }
    } else {
      // Sync Google profile
      if (!user.google_id || (isOwner && user.role !== 'superadmin')) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            google_id: googleId,
            email_verified: true,
            photo: user.photo || picture,
            role: isOwner ? 'superadmin' : user.role,
            enabled: isOwner ? true : user.enabled,
            updated_at: new Date()
          })
          .eq('id', user.id)
          .select()
          .single();
        if (updatedUser) user = updatedUser;
      }
    }

    if (!user || !user.enabled) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Account is disabled.')}`);
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Build URL params for frontend
    const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const now = new Date();
    const trialActive = user.plan === 'trial' && trialEnds && now < trialEnds;
    const trialDaysLeft = trialActive ? Math.ceil((trialEnds - now) / 86400000) : 0;

    const userData = encodeURIComponent(JSON.stringify({
      token, name: user.name, email: user.email, role: user.role,
      plan: user.plan, trialActive, trialDaysLeft,
    }));

    return res.redirect(`${FRONTEND_URL}?google_auth=${userData}`);

  } catch (err) {
    console.error('[Google OAuth callback]', err.message);
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google sign-in failed.')}`);
  }
};

module.exports = googleCallback;
