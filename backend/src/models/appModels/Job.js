const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.ObjectId, ref: 'User', autopopulate: { select: 'name email phone' } },
  workerProfile: { type: mongoose.Schema.ObjectId, ref: 'WorkerProfile' },
  name:          { type: String, required: true },
  phone:         { type: String },
  email:         { type: String },
  skills:        [{ type: String }],
  note:          { type: String },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'hired', 'rejected'],
    default: 'pending',
  },
  appliedAt: { type: Date, default: Date.now },
});

const jobSchema = new mongoose.Schema({
  removed:     { type: Boolean, default: false },
  title:       { type: String, required: true },
  description: { type: String },
  category:    { type: String, required: true },
  type: {
    type: String,
    enum: ['quick-gig', 'temporary', 'contract', 'permanent'],
    required: true,
  },
  location:   { type: String },
  pay:        { type: String },
  duration:   { type: String },
  skills:     [{ type: String }],
  urgent:     { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open',
  },
  postedBy:   { type: mongoose.Schema.ObjectId, ref: 'User', required: true, autopopulate: { select: 'name email company' } },
  applicants: [applicantSchema],
  created:    { type: Date, default: Date.now },
  updated:    { type: Date, default: Date.now },
});

jobSchema.plugin(require('mongoose-autopopulate'));
jobSchema.pre('save', function (next) { this.updated = Date.now(); next(); });

jobSchema.index({ status: 1, removed: 1 });
jobSchema.index({ category: 1, type: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ created: -1 });

module.exports = mongoose.model('Job', jobSchema);
