const mongoose = require('mongoose');
const AuditLog = require('../../models/appModels/AuditLog');

exports.createLog = async (req, res) => {
  try {
    const { action, details } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const log = new AuditLog({
      userId: req.user._id,
      action,
      details,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    await log.save();
    
    return res.status(201).json({ 
      success: true, 
      result: log,
      message: 'Audit log created' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const logs = await AuditLog.find({ 
      userId: req.user._id 
    }).sort({ timestamp: -1 }).limit(100);
    
    return res.status(200).json({ success: true, result: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
