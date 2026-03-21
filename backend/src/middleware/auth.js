const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Sign a JWT for a user
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Send JWT in response
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublic ? user.toPublic() : user,
  });
};

// Protect routes — verifies Bearer token
const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (user.status === 'suspended') return res.status(403).json({ success: false, message: 'Account suspended.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Require specific roles
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
  }
  next();
};

// Require active status
const requireActive = (req, res, next) => {
  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending activation. Please wait for admin approval.',
    });
  }
  next();
};

module.exports = { signToken, sendToken, protect, requireRole, requireActive };
