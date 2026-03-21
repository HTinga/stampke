const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile' },
  name:         { type: String, required: true },
  phone:        { type: String },
  email:        { type: String },
  skills:       [{ type: String }],
  note:         { type: String },
  status:       { type: String, enum: ['pending', 'shortlisted', 'hired', 'rejected'], default: 'pending' },
  appliedAt:    { type: Date, default: Date.now },
}, { _id: true });

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  category:    { type: String, required: true },
  type:        { type: String, enum: ['quick-gig', 'temporary', 'contract', 'permanent'], required: true },
  location:    { type: String },
  pay:         { type: String },
  duration:    { type: String },
  skills:      [{ type: String }],
  urgent:      { type: Boolean, default: false },
  status:      { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants:  [applicantSchema],
  removed:     { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

jobSchema.pre('save', function (next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Job', jobSchema);
