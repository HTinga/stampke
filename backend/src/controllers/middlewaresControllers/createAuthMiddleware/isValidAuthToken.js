const jwt      = require('jsonwebtoken');
const supabase = require('@/config/supabase');

const isValidAuthToken = async (req, res, next, { userModel }) => {
  try {
    // Helper to map model name to table name
    const table = userModel === 'User' ? 'users' : userModel.toLowerCase() + 's';

    // Issue #2: prefer httpOnly cookie, fall back to Authorization header
    const cookieToken = req.cookies && req.cookies['tomo_session'];
    const authHeader  = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const token       = cookieToken || headerToken;

    if (!token)
      return res.status(401).json({
        success: false, result: null, message: 'No authentication token, authorization denied.', jwtExpired: true,
      });

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified)
      return res.status(401).json({
        success: false, result: null, message: 'Token verification failed, authorization denied.', jwtExpired: true,
      });

    // Verify user exists in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', verified.id)
      .eq('removed', false)
      .single();

    if (userError || !user)
      return res.status(401).json({
        success: false, result: null, message: "User doesn't exist, authorization denied.", jwtExpired: true,
      });

    // Check sessions in user_passwords table
    const { data: passwordData, error: passwordError } = await supabase
      .from('user_passwords')
      .select('logged_sessions')
      .eq('user_id', verified.id)
      .single();

    const sessions = passwordData?.logged_sessions || [];
    if (passwordError || !sessions.includes(token)) {
      console.warn(`[isValidAuthToken] Session token not found in logged_sessions for user ${verified.id}`);
      return res.status(401).json({
        success: false, result: null, message: 'Session expired, please login again.', jwtExpired: true,
      });
    }

    if (!user.enabled)
      return res.status(403).json({
        success: false, result: null, message: 'Your account is pending activation by the admin.',
      });

    // Attach user to request
    req.user      = user;
    req.authToken = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false, result: null, message: error.message, jwtExpired: true,
    });
  }
};

module.exports = isValidAuthToken;

