'use strict';
const sendEmail = require('@/utils/sendEmail');
const supabase = require('@/config/supabase');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';

const googleSignIn = async (req, res, { userModel }) => {
  const { idToken } = req.body;

  if (!idToken)
    return res.status(400).json({ success: false, result: null, message: 'Google ID token required.' });

  if (!process.env.GOOGLE_CLIENT_ID)
    return res.status(400).json({ success: false, result: null, message: 'Google Sign-In not configured on server. Contact admin.' });

  let payload;
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (e) {
    return res.status(401).json({ success: false, result: null, message: 'Invalid Google token. Please try again.' });
  }

  const { email, name, picture, sub: googleId } = payload;
  const normalizedEmail = email.toLowerCase();
  const isOwner = normalizedEmail === OWNER_EMAIL.toLowerCase();

  // Search for user by email or google_id
  const { data: existingUser, error: searchError } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${normalizedEmail},google_id.eq.${googleId}`)
    .eq('removed', false)
    .maybeSingle();

  let user = existingUser;

  if (!user) {
    // Create new Google user
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        name,
        email: normalizedEmail,
        google_id: googleId,
        photo: picture,
        role: isOwner ? 'superadmin' : 'business',
        enabled: true, // Auto-enable Google signups
        email_verified: true,
        plan: isOwner ? 'enterprise' : 'trial',
        trial_started_at: isOwner ? null : now.toISOString(),
        trial_ends_at: isOwner ? null : trialEndsAt.toISOString(),
        removed: false,
      }])
      .select()
      .single();

    if (createError) return res.status(500).json({ success: false, message: createError.message });
    user = newUser;

    // Create entry in user_passwords (even if empty)
    await supabase.from('user_passwords').insert([{ user_id: user.id, password_hash: '', salt: '' }]);

    if (!isOwner) {
      try {
        await sendEmail({
          to: OWNER_EMAIL,
          subject: `[StampKE] New Google signup — ${name} (${user.role})`,
          html: `<p><strong>${name}</strong> (${normalizedEmail}) signed up via Google as <strong>${user.role}</strong>.</p>`,
        });
      } catch (err) {
        console.error('[Email] Google signup alert error:', err.message);
      }
    }
  } else {
    // Update existing user with Google ID if missing
    if (!user.google_id || (isOwner && user.role !== 'superadmin')) {
      const updates = {
        google_id: googleId,
        email_verified: true,
        photo: user.photo || picture,
      };
      if (isOwner) {
        updates.role = 'superadmin';
        updates.enabled = true;
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (!updateError) user = updatedUser;
    }
  }

  if (!user.enabled)
    return res.status(403).json({
      success: false, result: null,
      message: 'Your account is disabled. Contact support.',
      code: 'DISABLED',
    });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // Build trial info
  const now = new Date();
  const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const trialActive = user.plan === 'trial' && trialEnds && now < trialEnds;
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((trialEnds - now) / 86400000))
    : 0;

  return res.status(200).json({
    success: true,
    result: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      photo: user.photo,
      plan: user.plan,
      trialActive,
      trialDaysLeft,
      token,
    },
    message: 'Successfully signed in with Google',
  });
};

module.exports = googleSignIn;
