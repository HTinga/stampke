'use strict';
const { OAuth2Client } = require('google-auth-library');
const supabase = require('@/config/supabase');
const jwt = require('jsonwebtoken');
const sendEmail = require('@/utils/sendEmail');
const logger = require('@/utils/logger');

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
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:20px;padding:48px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
            <h1 style="font-size:28px;font-weight:900;color:#18181b;margin:0 0 12px">Welcome to StampKE, ${name}!</h1>
            <p style="font-size:16px;color:#52525b;line-height:1.7;margin:0 0 28px">
              Your account is ready. Start using StampKE to digitally sign and stamp your documents with authority.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px">
              <tr>
                <td>
                  <a href="${frontendUrl}" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:15px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
                    🚀 Get Started &rarr;
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
    logger.error('[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Google Sign-In not configured.')}`);
  }

  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker' : (stateData.signUpRole || 'business');
  
  // Use protocol-aware redirect URI
  const redirectUri = FRONTEND_URL + '/api/auth/google/callback';

  try {
    // FIX: Use positional arguments for OAuth2Client constructor
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    let tokens;
    try {
      const result = await client.getToken(code);
      tokens = result.tokens;
    } catch (tokenErr) {
      logger.warn(`[Google OAuth] getToken failed: ${tokenErr.message}`);
      if (tokenErr.message?.includes('invalid_grant')) {
        return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Sign-in link expired or already used. Please try again.')}`);
      }
      throw tokenErr;
    }

    if (!tokens.id_token) throw new Error('No id_token received from Google');

    client.setCredentials(tokens);
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    if (!email) throw new Error('No email found in Google profile');
    
    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL;

    // FIX: Braced OR syntax and error handling
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq."${normalizedEmail}",google_id.eq."${googleId}"`)
      .eq('removed', false)
      .maybeSingle();

    if (userError) {
      logger.error(`[Google OAuth] DB Search Error: ${userError.message}`);
      throw userError;
    }

    let finalUser = user;

    if (!finalUser) {
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
      
      if (createError) {
        logger.error(`[Google OAuth] User Create Error: ${createError.message}`);
        throw createError;
      }
      finalUser = newUser;

      // Initialize password entry
      await supabase.from('user_passwords').insert([{ user_id: finalUser.id, password_hash: '', salt: '' }]);

      // Send welcome
      try {
        await sendEmail({
          to: normalizedEmail,
          from: 'StampKE <noreply@stampke.co.ke>',
          subject: 'Welcome to StampKE 🎉',
          html: buildWelcomeEmail(name, FRONTEND_URL),
        });
      } catch (err) { logger.warn(`[Email] welcome error: ${err.message}`); }
    } else {
      // Sync Google profile
      const updates = {};
      if (!finalUser.google_id) updates.google_id = googleId;
      if (!finalUser.email_verified) updates.email_verified = true;
      if (picture && !finalUser.photo) updates.photo = picture;
      if (isOwner && finalUser.role !== 'superadmin') {
        updates.role = 'superadmin';
        updates.enabled = true;
      }

      if (Object.keys(updates).length > 0) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ ...updates, updated_at: new Date() })
          .eq('id', finalUser.id)
          .select()
          .single();
        if (updatedUser) finalUser = updatedUser;
      }
    }

    if (!finalUser || !finalUser.enabled) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('This account has been disabled.')}`);
    }

    const token = jwt.sign({ id: finalUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Update session
    const { data: passData } = await supabase.from('user_passwords').select('logged_sessions').eq('user_id', finalUser.id).single();
    const sessions = passData?.logged_sessions || [];
    await supabase.from('user_passwords').update({ logged_sessions: [...sessions, token] }).eq('user_id', finalUser.id);

    const trialEnds = finalUser.trial_ends_at ? new Date(finalUser.trial_ends_at) : null;
    const now = new Date();
    const trialActive = finalUser.plan === 'trial' && trialEnds && now < trialEnds;
    const trialDaysLeft = trialActive ? Math.ceil((trialEnds - now) / 86400000) : 0;

    const userData = encodeURIComponent(JSON.stringify({
      token, name: finalUser.name, email: finalUser.email, role: finalUser.role,
      plan: finalUser.plan, trialActive, trialDaysLeft,
    }));

    return res.redirect(`${FRONTEND_URL}?google_auth=${userData}`);

  } catch (err) {
    logger.error(`[Google OAuth callback] Exception: ${err.message}`);
    const debugMsg = encodeURIComponent(`Google sign-in failed: ${err.message}`);
    return res.redirect(`${FRONTEND_URL}?auth_error=${debugMsg}`);
  }
};

module.exports = googleCallback;
