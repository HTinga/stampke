// #16 — Role-based access control middleware
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, result: null, message: 'Authentication required.' });
  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({ success: false, result: null, message: `Access denied. Required: ${allowedRoles.join(' or ')}.` });
  next();
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, result: null, message: 'Authentication required.' });
  if (req.user.role === 'superadmin') return next();
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, result: null, message: 'Access denied.' });
  const perms = req.user.adminPermissions || [];
  if (!perms.includes(permission))
    return res.status(403).json({ success: false, result: null, message: `Missing permission: ${permission}` });
  next();
};

module.exports = { requireRole, requirePermission };
