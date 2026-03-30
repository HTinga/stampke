const Meeting = require('../../models/appModels/Meeting');

exports.createMeeting = async (req, res) => {
  try {
    const { title, duration, transcript, summary, keyPoints, actionItems } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const meeting = new Meeting({
      title: title || 'Untitled Meeting',
      duration,
      transcript,
      summary,
      keyPoints,
      actionItems,
      user: req.user._id,
    });

    await meeting.save();
    
    return res.status(201).json({ 
      success: true, 
      result: meeting,
      message: 'Meeting summary saved successfully' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const meetings = await Meeting.find({ 
      user: req.user._id, 
      removed: false 
    }).sort({ date: -1 });

    return res.status(200).json({ success: true, result: meetings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const meeting = await Meeting.findOne({ 
      _id: req.params.id, 
      user: req.user._id, 
      removed: false 
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({ success: true, result: meeting });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { title, notes } = req.body;

    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, notes },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({ success: true, result: meeting, message: 'Meeting updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { removed: true },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.status(200).json({ success: true, message: 'Meeting deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
