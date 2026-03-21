const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  category:     { type: String, required: true },
  jobTypes:     [{ type: String, enum: ['quick-gig', 'temporary', 'contract', 'permanent'] }],
  location:     { type: String, required: true },
  bio:          { type: String, required: true },
  skills:       [{ type: String }],
  hourlyRate:   { type: String, required: true },
  availability: { type: String, default: 'Available now' },
  shortNotice:  { type: Boolean, default: true },
  website:      { type: String },
  portfolioUrl: { type: String },
  portfolioFiles: [{ type: String }], // base64 or URL

  // Admin moderation
  status:       { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
  adminNote:    { type: String },
  adminRating:  { type: Number, min: 1, max: 5 },
  verified:     { type: Boolean, default: false },

  // Stats
  rating:       { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

workerProfileSchema.pre('save', function (next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
