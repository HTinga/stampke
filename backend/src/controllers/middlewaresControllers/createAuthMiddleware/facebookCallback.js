'use strict';
const supabase = require('@/config/supabase');
const jwt = require('jsonwebtoken');
const sendEmail = require('@/utils/sendEmail');

const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com').toLowerCase();

const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
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
    </div>
  </div>
</body></html>`;

const facebookCallback = async (req, res) => {
  const FRONTEND_URL = getFrontendUrl(req);
  const { code, state, error: oauthError } = req.query;

  if (oauthError) return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in was cancelled.')}`);
  if (!code) return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('No authorization code received from Facebook.')}`);

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook Sign-In not configured.')}`);
  }

  let stateData = {};
  try { stateData = JSON.parse(decodeURIComponent(state || '{}')); } catch {}
  const intendedRole = stateData.landingType === 'jobs' ? 'worker' : (stateData.signUpRole || 'business');
  const redirectUri = FRONTEND_URL + '/api/auth/facebook/callback';

  try {
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Facebook OAuth] Token exchange failed:', tokenData);
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in failed.')}`);
    }

    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`;
    const profileRes = await fetch(profileUrl);
    const profile = await profileRes.json();

    if (!profile.id || !profile.email) {
      return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Could not retrieve Facebook profile or email.')}`);
    }

    const { id: facebookId, name, email, picture } = profile;
    const photoUrl = picture?.data?.url || null;
    const normalizedEmail = email.toLowerCase();
    const isOwner = normalizedEmail === OWNER_EMAIL;

    // Supabase User Interaction
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq."${normalizedEmail}",facebook_id.eq."${facebookId}"`)
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
          facebook_id: facebookId,
          photo: photoUrl,
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

      try {
        await sendEmail({
          to: normalizedEmail,
          from: 'StampKE <noreply@stampke.co.ke>',
          subject: 'Welcome to StampKE 🎉',
          html: buildWelcomeEmail(name),
        });
      } catch (err) { console.error('[Email] welcome error:', err.message); }
    } else {
      if (!user.facebook_id || (isOwner && user.role !== 'superadmin')) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            facebook_id: facebookId,
            email_verified: true,
            photo: user.photo || photoUrl,
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

    const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const now = new Date();
    const trialActive = user.plan === 'trial' && trialEnds && now < trialEnds;
    const trialDaysLeft = trialActive ? Math.ceil((trialEnds - now) / 86400000) : 0;

    const userData = encodeURIComponent(JSON.stringify({
      token, name: user.name, email: user.email, role: user.role,
      plan: user.plan, trialActive, trialDaysLeft,
    }));

    return res.redirect(`${FRONTEND_URL}?facebook_auth=${userData}`);

  } catch (err) {
    console.error('[Facebook OAuth callback]', err.message);
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent('Facebook sign-in failed.')}`);
  }
};

module.exports = facebookCallback;
