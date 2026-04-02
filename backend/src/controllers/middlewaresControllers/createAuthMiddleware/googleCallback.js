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
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05)">
        <tr>
          <td align="center" style="padding:40px 0 32px;background:#18181b">
            <span style="color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px">StampKE</span>
          </td>
        </tr>
        <tr>
          <td style="padding:48px">
            <h1 style="font-size:24px;font-weight:900;color:#18181b;margin:0 0 16px">Welcome to StampKE, ${name}!</h1>
            <p style="font-size:16px;color:#52525b;line-height:1.7;margin:0 0 32px">
              Your account is successfully verified. You've been granted a <strong>7-day Starter Trial</strong> to explore the full power of our platform.
            </p>

            <div style="background:#f8fafc;border-radius:16px;padding:24px;margin-bottom:32px">
              <h3 style="font-size:14px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 20px">What's included in your trial:</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32" style="vertical-align:top;padding-bottom:16px"><span style="font-size:20px">🤖</span></td>
                  <td style="padding-bottom:16px;padding-left:12px">
                    <strong style="display:block;font-size:15px;color:#1e293b">AI Virtual Assistant (VA)</strong>
                    <span style="font-size:13px;color:#64748b">Unlimited access to our document-aware AI for questions and processing.</span>
                  </td>
                </tr>
                <tr>
                  <td width="32" style="vertical-align:top;padding-bottom:16px"><span style="font-size:20px">🖋️</span></td>
                  <td style="padding-bottom:16px;padding-left:12px">
                    <strong style="display:block;font-size:15px;color:#1e293b">Sign Center</strong>
                    <span style="font-size:13px;color:#64748b">1 free legally-binding signature to get you started.</span>
                  </td>
                </tr>
                <tr>
                  <td width="32" style="vertical-align:top;padding-bottom:16px"><span style="font-size:20px">⭕</span></td>
                  <td style="padding-bottom:16px;padding-left:12px">
                    <strong style="display:block;font-size:15px;color:#1e293b">Stamp Studio</strong>
                    <span style="font-size:13px;color:#64748b">Design and apply 1 custom digital rubber stamp with auth.</span>
                  </td>
                </tr>
                <tr>
                  <td width="32" style="vertical-align:top"><span style="font-size:20px">🧾</span></td>
                  <td style="padding-left:12px">
                    <strong style="display:block;font-size:15px;color:#1e293b">Smart Invoicing</strong>
                    <span style="font-size:13px;color:#64748b">AI-powered invoice extraction and tracking (requires Pro).</span>
                  </td>
                </tr>
              </table>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px">
              <tr>
                <td align="center">
                  <a href="${frontendUrl}" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(26,115,232,0.3)">
                    Verify & Launch Dashboard &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0">
              Need help? Reply to this email or visit our support center.
            </p>
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

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${normalizedEmail},google_id.eq.${googleId}`)
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
          role: isOwner ? 'superadmin' : intendedRole,
          enabled: true,
          email_verified: true,
          removed: false,
          plan: isOwner ? 'business' : 'starter',
          trial_started_at: isOwner ? null : now.toISOString(),
          trial_ends_at: isOwner ? null : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single();
      
      if (createError) {
        logger.error(`[Google OAuth] User Create Error: ${createError.message} (Email: ${normalizedEmail})`);
        throw createError;
      }
      finalUser = newUser;
      finalUser.is_new = true;

      await supabase.from('user_passwords').insert([{ user_id: finalUser.id, password_hash: '', salt: '' }]);

      try {
        await sendEmail({
          to: normalizedEmail,
          from: 'StampKE <noreply@stampke.co.ke>',
          subject: 'Welcome to StampKE 🎉',
          html: buildWelcomeEmail(name, FRONTEND_URL),
        });
      } catch (err) { logger.warn(`[Email] welcome error: ${err.message}`); }
    } else {
      const updates = {};
      if (isOwner) {
        if (finalUser.role !== 'superadmin') updates.role = 'superadmin';
        if (!finalUser.enabled) updates.enabled = true;
        if (finalUser.removed) updates.removed = false;
        if (finalUser.plan !== 'business') updates.plan = 'business';
        if (!finalUser.email_verified) updates.email_verified = true;
      } else {
        if (!finalUser.google_id) updates.google_id = googleId;
        if (!finalUser.email_verified) updates.email_verified = true;
        if (finalUser.removed) {
          updates.removed = false;
          updates.enabled = true;
        }
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

    const { data: passData } = await supabase.from('user_passwords').select('logged_sessions').eq('user_id', finalUser.id).single();
    const sessions = passData?.logged_sessions || [];
    await supabase.from('user_passwords').update({ logged_sessions: [...sessions, token] }).eq('user_id', finalUser.id);

    const trialEnds = finalUser.trial_ends_at ? new Date(finalUser.trial_ends_at) : null;
    const now = new Date();
    const trialActive = finalUser.plan === 'trial' && trialEnds && now < trialEnds;
    const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24))) : 0;

    const userData = encodeURIComponent(JSON.stringify({
      token,
      name: finalUser.name,
      email: finalUser.email,
      role: finalUser.role,
      plan: finalUser.plan,
      trialActive,
      trialDaysLeft,
      isNew: !!finalUser.is_new,
    }));

    return res.redirect(`${FRONTEND_URL}?google_auth=${userData}`);

  } catch (err) {
    logger.error(`[Google OAuth callback] Exception: ${err.message}`);
    const errorMsg = encodeURIComponent(`Google sign-in failed: ${err.message}. Please try again or use email login.`);
    return res.redirect(`${FRONTEND_URL}?auth_error=${errorMsg}`);
  }
};

module.exports = googleCallback;
