const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({
  removed:  { type: Boolean, default: false },
  user:     { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true, autopopulate: { select: 'name email phone photo' } },
  category: { type: String, required: true },
  jobTypes: [{ type: String, enum: ['quick-gig', 'temporary', 'contract', 'permanent'] }],
  location: { type: String, required: true },
  bio:      { type: String, required: true },
  skills:   [{ type: String }],
  hourlyRate:   { type: String, required: true },
  availability: { type: String, default: 'Available now' },
  shortNotice:  { type: Boolean, default: true },
  website:      { type: String },
  portfolioUrl: { type: String },
  portfolioFiles: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending',
  },
  adminNote:    { type: String },
  adminRating:  { type: Number, min: 1, max: 5 },
  verified:     { type: Boolean, default: false },
  rating:       { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

workerProfileSchema.plugin(require('mongoose-autopopulate'));
workerProfileSchema.pre('save', function (next) { this.updated = Date.now(); next(); });

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
