const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { notifyUserActivated } = require('../services/email');

// ── Create / update own worker profile ──────────────────────────────────────
exports.upsertProfile = async (req, res) => {
  const data = req.body;
  const required = ['category', 'location', 'bio', 'hourlyRate'];
  for (const f of required) {
    if (!data[f]) return res.status(400).json({ success: false, message: `${f} is required.` });
  }

  let profile = await WorkerProfile.findOne({ user: req.user._id });
  if (profile) {
    Object.assign(profile, data);
    await profile.save();
  } else {
    profile = await WorkerProfile.create({ ...data, user: req.user._id, status: 'pending' });
    await User.findByIdAndUpdate(req.user._id, { workerProfile: profile._id });
  }
  res.json({ success: true, profile });
};

// ── Get own profile ──────────────────────────────────────────────────────────
exports.myProfile = async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id }).populate('user', 'name email avatar');
  res.json({ success: true, profile });
};

// ── List approved workers (public / recruiter view) ──────────────────────────
exports.list = async (req, res) => {
  const { search, category, jobType, shortNotice, page = 1, limit = 30 } = req.query;
  const filter = { status: 'approved' };
  if (category) filter.category = category;
  if (jobType) filter.jobTypes = jobType;
  if (shortNotice === 'true') filter.shortNotice = true;
  if (search) filter.$or = [
    { category: { $regex: search, $options: 'i' } },
    { skills:   { $regex: search, $options: 'i' } },
    { location: { $regex: search, $options: 'i' } },
    { bio:      { $regex: search, $options: 'i' } },
  ];

  const profiles = await WorkerProfile.find(filter)
    .populate('user', 'name email avatar phone')
    .sort({ adminRating: -1, completedJobs: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await WorkerProfile.countDocuments(filter);

  res.json({ success: true, profiles, total });
};

// ── Admin: list all profiles ──────────────────────────────────────────────────
exports.adminList = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const profiles = await WorkerProfile.find(filter)
    .populate('user', 'name email avatar phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, profiles });
};

// ── Admin: approve ────────────────────────────────────────────────────────────
exports.approve = async (req, res) => {
  const profile = await WorkerProfile.findByIdAndUpdate(
    req.params.id, { status: 'approved', verified: true }, { new: true }
  ).populate('user', 'name email');
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

  await notifyUserActivated({ name: profile.user.name, email: profile.user.email, role: 'worker' });
  res.json({ success: true, profile });
};

// ── Admin: suspend ────────────────────────────────────────────────────────────
exports.suspend = async (req, res) => {
  const { note } = req.body;
  const profile = await WorkerProfile.findByIdAndUpdate(
    req.params.id, { status: 'suspended', adminNote: note }, { new: true }
  );
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
  res.json({ success: true, profile });
};

// ── Admin: rate a worker ──────────────────────────────────────────────────────
exports.rate = async (req, res) => {
  const { rating, note } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1–5.' });
  const profile = await WorkerProfile.findByIdAndUpdate(
    req.params.id, { adminRating: rating, ...(note && { adminNote: note }) }, { new: true }
  );
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
  res.json({ success: true, profile });
};

// ── Admin: delete ──────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  await WorkerProfile.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Worker profile deleted.' });
};
