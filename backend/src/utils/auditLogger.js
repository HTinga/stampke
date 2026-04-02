const supabase = require('@/config/supabase');

/**
 * Utility to log user actions to the audit_logs table
 * @param {Object} req - The request object (to get user and IP)
 * @param {string} action - The action name (e.g., "Created Client")
 * @param {Object|string} details - Additional details
 */
const logAudit = async (req, action, details) => {
  try {
    if (!req.user || !req.user.id) return;

    await supabase
      .from('audit_logs')
      .insert([{
        user_id: req.user.id,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      }]);
  } catch (err) {
    console.error('[AuditLog] Failed to log action:', err.message);
  }
};

module.exports = logAudit;
