'use strict';
const sendEmail  = require('@/utils/sendEmail');
const mongoose   = require('mongoose');
const createCRUD = require('@/controllers/middlewaresControllers/createCRUDController');

const WorkerProfile = () => mongoose.model('WorkerProfile');
const User          = () => mongoose.model('User');
const methods       = createCRUD('WorkerProfile');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';
const OWNER_EMAIL  = process.env.OWNER_EMAIL  || 'hempstonetinga@gmail.com';

// ── Upsert own profile ────────────────────────────────────────────────────────
methods.upsertProfile = async (req, res) => {
  const required = ['category','location','bio','hourlyRate'];
  for (const f of required) {
    if (!req.body[f])
      return res.status(400).json({ success: false, result: null, message: `${f} is required.` });
  }
  let profile = await WorkerProfile().findOne({ user: req.user._id, removed: false });
  if (profile) {
    Object.assign(profile, { ...req.body, removed: false });
    await profile.save();
  } else {
    profile = await new (WorkerProfile())({ ...req.body, user: req.user._id, status: 'pending', removed: false }).save();
    // Notify superadmin of new applicant
    sendEmail({
      to: OWNER_EMAIL, from: 'StampKE <noreply@stampke.co.ke>',
      subject: `[StampKE] New errand applicant — ${req.user.name}`,
      html: `<p>New worker profile submitted by <strong>${req.user.name}</strong> (${req.user.email}). <a href="${FRONTEND_URL}">Review in Admin Panel</a></p>`,
    });
  }
  return res.status(200).json({ success: true, result: profile, message: 'Profile saved.' });
};

// ── Get own profile ───────────────────────────────────────────────────────────
methods.myProfile = async (req, res) => {
  const profile = await WorkerProfile().findOne({ user: req.user._id, removed: false });
  return res.status(200).json({ success: true, result: profile || null, message: 'Profile found.' });
};

// ── Upload CV ─────────────────────────────────────────────────────────────────
methods.uploadCV = async (req, res) => {
  const { cvUrl, cvFileName } = req.body;
  if (!cvUrl) return res.status(400).json({ success: false, result: null, message: 'cvUrl is required.' });
  const profile = await WorkerProfile().findOneAndUpdate(
    { user: req.user._id, removed: false },
    { cvUrl, cvFileName },
    { new: true, upsert: true }
  );
  return res.status(200).json({ success: true, result: profile, message: 'CV uploaded.' });
};

// ── Add certificate ───────────────────────────────────────────────────────────
methods.addCertificate = async (req, res) => {
  const { name, issuer, year, fileUrl, fileName } = req.body;
  if (!name) return res.status(400).json({ success: false, result: null, message: 'Certificate name required.' });
  const profile = await WorkerProfile().findOneAndUpdate(
    { user: req.user._id, removed: false },
    { $push: { certificates: { name, issuer, year, fileUrl, fileName, verified: false } } },
    { new: true }
  );
  return res.status(200).json({ success: true, result: profile, message: 'Certificate added.' });
};

// ── Remove certificate ────────────────────────────────────────────────────────
methods.removeCertificate = async (req, res) => {
  const profile = await WorkerProfile().findOneAndUpdate(
    { user: req.user._id, removed: false },
    { $pull: { certificates: { _id: req.params.certId } } },
    { new: true }
  );
  return res.status(200).json({ success: true, result: profile, message: 'Certificate removed.' });
};

// ── List approved workers (public) ────────────────────────────────────────────
methods.listApproved = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.items) || 20;
  const skip  = (page - 1) * limit;
  const { category, jobType, q } = req.query;
  const filter = { removed: false, status: 'approved' };
  if (category) filter.category = category;
  if (jobType)  filter.jobTypes = jobType;
  if (q) filter.$or = [
    { category: { $regex: q, $options: 'i' } },
    { skills:   { $regex: q, $options: 'i' } },
    { location: { $regex: q, $options: 'i' } },
    { bio:      { $regex: q, $options: 'i' } },
  ];
  const [result, count] = await Promise.all([
    WorkerProfile().find(filter).skip(skip).limit(limit).sort({ adminRating: -1, completedJobs: -1 }),
    WorkerProfile().countDocuments(filter),
  ]);
  return res.status(200).json({ success: true, result, pagination: { page, pages: Math.ceil(count / limit), count }, message: 'Workers found.' });
};

// ── Get worker with credentials (employer who shortlisted or superadmin) ──────
methods.getWithCredentials = async (req, res) => {
  const profile = await WorkerProfile().findOne({ _id: req.params.id, removed: false });
  if (!profile) return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });
  const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
  const hasAccess    = isSuperAdmin || profile.credentialAccessGrantedTo.some(id => id.toString() === req.user._id.toString());
  if (!hasAccess) {
    // Return profile without sensitive fields
    const safe = profile.toObject();
    delete safe.cvUrl; delete safe.certificates;
    return res.status(200).json({ success: true, result: { ...safe, credentialsHidden: true }, message: 'Limited profile.' });
  }
  return res.status(200).json({ success: true, result: profile, message: 'Full profile.' });
};

// ── Grant credential access to employer ───────────────────────────────────────
methods.grantCredentialAccess = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin')
    return res.status(403).json({ success: false, result: null, message: 'Superadmin only.' });
  const { workerId, employerId } = req.body;
  const profile = await WorkerProfile().findOneAndUpdate(
    { _id: workerId, removed: false },
    { $addToSet: { credentialAccessGrantedTo: employerId } },
    { new: true }
  );
  return res.status(200).json({ success: true, result: profile, message: 'Access granted.' });
};

// ── Admin: list all ───────────────────────────────────────────────────────────
methods.adminList = async (req, res) => {
  const { status } = req.query;
  const filter = { removed: false, ...(status ? { status } : {}) };
  const result = await WorkerProfile().find(filter).sort({ created: -1 });
  return res.status(200).json({ success: true, result, message: 'All profiles.' });
};

// ── Admin: approve ────────────────────────────────────────────────────────────
methods.approve = async (req, res) => {
  const profile = await WorkerProfile().findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { status: 'approved', verified: true },
    { new: true }
  );
  if (!profile) return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });
  // Notify worker
  const user = await User().findById(profile.user);
  if (user) {
    sendEmail({
      to: user.email, from: 'StampKE <noreply@stampke.co.ke>',
      subject: '🎉 Your StampKE profile is approved!',
      html: `<div style="font-family:sans-serif;max-width:520px"><h2>Congratulations, ${user.name}!</h2><p>Your errand profile has been approved by StampKE. You're now visible to employers.</p><a href="${FRONTEND_URL}" style="display:inline-block;background:#1f6feb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View My Profile</a></div>`,
    });
  }
  return res.status(200).json({ success: true, result: profile, message: 'Profile approved.' });
};

// ── Admin: suspend ────────────────────────────────────────────────────────────
methods.suspend = async (req, res) => {
  const profile = await WorkerProfile().findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { status: 'suspended' },
    { new: true }
  );
  return res.status(200).json({ success: true, result: profile, message: 'Profile suspended.' });
};

// ── Employer: rate worker ─────────────────────────────────────────────────────
methods.rate = async (req, res) => {
  const { stars, comment, errandRef } = req.body;
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ success: false, result: null, message: 'Stars must be 1-5.' });
  const profile = await WorkerProfile().findOne({ _id: req.params.id, removed: false });
  if (!profile) return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });
  // Remove existing rating from this employer, add new
  profile.ratings = profile.ratings.filter(r => r.employer?.toString() !== req.user._id.toString());
  profile.ratings.push({ employer: req.user._id, stars, comment, errandRef });
  profile.completedJobs = Math.max(profile.completedJobs, profile.ratings.length);
  await profile.save();
  return res.status(200).json({ success: true, result: profile, message: `Rated ${stars} stars.` });
};

// ── Superadmin: award course completion ───────────────────────────────────────
methods.awardCourse = async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, result: null, message: 'Superadmin only.' });
  const { courseId, score, badgeUrl } = req.body;
  const profile = await WorkerProfile().findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $push: { completedCourses: { course: courseId, score, badgeUrl, awardedBy: req.user._id } } },
    { new: true }
  );
  return res.status(200).json({ success: true, result: profile, message: 'Course awarded.' });
};

module.exports = methods;
