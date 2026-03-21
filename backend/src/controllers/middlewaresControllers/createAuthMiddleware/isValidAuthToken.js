const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

const isValidAuthToken = async (req, res, next, { userModel }) => {
  try {
    const UserPassword = mongoose.model(userModel + 'Password');
    const User         = mongoose.model(userModel);

    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];

    if (!token)
      return res.status(401).json({
        success: false, result: null, message: 'No authentication token, authorization denied.', jwtExpired: true,
      });

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified)
      return res.status(401).json({
        success: false, result: null, message: 'Token verification failed, authorization denied.', jwtExpired: true,
      });

    const [user, userPassword] = await Promise.all([
      User.findOne({ _id: verified.id, removed: false }),
      UserPassword.findOne({ user: verified.id, removed: false }),
    ]);

    if (!user)
      return res.status(401).json({
        success: false, result: null, message: "User doesn't exist, authorization denied.", jwtExpired: true,
      });

    if (!userPassword || !userPassword.loggedSessions.includes(token))
      return res.status(401).json({
        success: false, result: null, message: 'Session expired, please login again.', jwtExpired: true,
      });

    if (!user.enabled)
      return res.status(403).json({
        success: false, result: null, message: 'Your account is pending activation by the admin.',
      });

    // Auto-assign superadmin role to owner email if not already set
    const OWNER = process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com';
    if (user.email.toLowerCase() === OWNER.toLowerCase() && user.role !== 'superadmin') {
      user.role = 'superadmin';
      await user.save();
    }

    // Attach user to request (model-name-aware like idurar)
    const key     = userModel.toLowerCase();
    req[key]      = user;
    req.user      = user;          // always available as req.user
    req.authToken = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false, result: null, message: error.message, jwtExpired: true,
    });
  }
};

module.exports = isValidAuthToken;
