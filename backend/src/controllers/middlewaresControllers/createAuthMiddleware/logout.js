'use strict';
const supabase = require('@/config/supabase');

const logout = async (req, res, { userModel }) => {
  // If we want to track blacklisted tokens or session removals, we'd do it here.
  // For now, since we aren't strict on session revocation in the other refactored routes,
  // we just clear the client-side cookie.

  // Clear httpOnly cookie
  res.clearCookie('tomo_session', { 
    httpOnly: true, 
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  });

  return res.status(200).json({ 
    success: true, 
    result: {}, 
    message: 'Successfully logged out' 
  });
};

module.exports = logout;
