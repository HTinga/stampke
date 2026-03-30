const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: String,
    default: '00:00',
  },
  transcript: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  },
  keyPoints: [{
    type: String,
  }],
  actionItems: [{
    type: String,
  }],
  notes: {
    type: String,
    default: '',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  removed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Meeting', meetingSchema);
