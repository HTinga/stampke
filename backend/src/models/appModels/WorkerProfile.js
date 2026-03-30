'use strict';
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  provider:    { type: String, default: 'StampKE Academy' },
  duration:    { type: String },           // e.g. "2 hours"
  level:       { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  category:    { type: String },
  thumbnail:   { type: String },
  content:     { type: String },           // markdown content
  createdBy:   { type: mongoose.Schema.ObjectId, ref: 'User' },  // superadmin
  isPublished: { type: Boolean, default: false },
  created:     { type: Date, default: Date.now },
});

const workerProfileSchema = new mongoose.Schema({
  removed:  { type: Boolean, default: false },
  user:     { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true,
    autopopulate: { select: 'name email phone photo' } },

  // ── Basic Info ─────────────────────────────────────────────────────────────
  category:     { type: String, required: true },
  jobTypes:     [{ type: String, enum: ['quick-gig','temporary','contract','permanent'] }],
  location:     { type: String, required: true },
  bio:          { type: String, required: true },
  skills:       [{ type: String }],
  hourlyRate:   { type: String, required: true },
  availability: { type: String, default: 'Available now' },
  shortNotice:  { type: Boolean, default: true },
  website:      { type: String },

  // ── Documents (private — only superadmin + shortlisted employers see) ──────
  cvUrl:           { type: String },    // uploaded CV file URL/base64
  cvFileName:      { type: String },
  certificates:    [{
    name:        { type: String, required: true },
    issuer:      { type: String },
    year:        { type: String },
    fileUrl:     { type: String },
    fileName:    { type: String },
    verified:    { type: Boolean, default: false },  // verified by superadmin
  }],

  // ── Portfolio (public after approval) ─────────────────────────────────────
  portfolioUrl:   { type: String },
  portfolioFiles: [{ type: String }],

  // ── Courses completed (awarded by superadmin) ──────────────────────────────
  completedCourses: [{
    course:      { type: mongoose.Schema.ObjectId, ref: 'Course' },
    completedAt: { type: Date, default: Date.now },
    score:       { type: Number },           // percentage 0-100
    badgeUrl:    { type: String },
    awardedBy:   { type: mongoose.Schema.ObjectId, ref: 'User' },
  }],

  // ── Employer access (shortlisted — can see credentials) ───────────────────
  credentialAccessGrantedTo: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

  // ── Vetting & Status ───────────────────────────────────────────────────────
  status:       { type: String, enum: ['pending','under-review','approved','suspended'], default: 'pending' },
  adminNote:    { type: String },
  adminRating:  { type: Number, min: 1, max: 5 },
  verified:     { type: Boolean, default: false },
  idVerified:   { type: Boolean, default: false },

  // ── Star ratings from employers ────────────────────────────────────────────
  ratings: [{
    employer:  { type: mongoose.Schema.ObjectId, ref: 'User' },
    stars:     { type: Number, min: 1, max: 5, required: true },
    comment:   { type: String },
    errandRef: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  rating:        { type: Number, default: 0 },   // computed average
  completedJobs: { type: Number, default: 0 },

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

workerProfileSchema.plugin(require('mongoose-autopopulate'));
workerProfileSchema.pre('save', function (next) {
  this.updated = Date.now();
  if (this.ratings && this.ratings.length > 0) {
    this.rating = +(this.ratings.reduce((s, r) => s + r.stars, 0) / this.ratings.length).toFixed(1);
  }
  next();
});

// user index is already defined as unique: true in the schema definition above
workerProfileSchema.index({ status: 1, category: 1 });
workerProfileSchema.index({ adminRating: -1 });

// Course model (managed by superadmin)
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
module.exports.Course = Course;
