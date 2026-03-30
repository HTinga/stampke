const mongoose = require('mongoose');
const Notification = require('@/models/appModels/Notification');

exports.create = async (req, res) => {
  try {
    const { userId, title, message, type, link } = req.body;
    const notification = new Notification({
      userId: userId || req.user._id,
      title,
      message,
      type,
      link,
    });
    await notification.save();
    return res.status(200).json({ success: true, result: notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, result: notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true }
    );
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
