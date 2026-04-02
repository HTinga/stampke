// #2 — Token stored in httpOnly cookie (not localStorage) to prevent XSS theft
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('@/config/supabase');

const COOKIE_NAME    = 'token'; // Changed to 'token' to match logout.js and general pattern
const COOKIE_OPTIONS = {
  httpOnly: true,          // JS cannot read — blocks XSS token theft
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'Lax',         // Changed to Lax (more compatible with OAuth redirects)
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  path:     '/',
};

const authUser = async (req, res, { user, databasePassword, password }) => {
  // Use password_hash from Supabase table
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password_hash);
  
  if (!isMatch)
    return res.status(403).json({ success: false, result: null, message: 'Invalid credentials.' });

  const expiresIn = req.body.remember ? '365d' : '7d';
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn });

  // Update logged sessions in Supabase
  const currentSessions = databasePassword.logged_sessions || [];
  const updatedSessions = [...currentSessions, token];

  await supabase
    .from('user_passwords')
    .update({ logged_sessions: updatedSessions, updated_at: new Date() })
    .eq('user_id', user.id);

  // Set httpOnly cookie (#2)
  res.cookie(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: req.body.remember ? 365 * 24 * 60 * 60 * 1000 : COOKIE_OPTIONS.maxAge,
  });

  const now           = new Date();
  const trialEnds     = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const trialActive   = user.plan === 'trial' && trialEnds && now < trialEnds;
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
      adminPermissions: user.admin_permissions || [],
      token,
    },
    message: 'Successfully logged in',
  });
};

module.exports = { authUser, COOKIE_NAME, COOKIE_OPTIONS };
