const mongoose             = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { Resend }           = require('resend');

const WorkerProfile = mongoose.model('WorkerProfile');
const User          = mongoose.model('User');
const methods       = createCRUDController('WorkerProfile');

// Upsert own worker profile
methods.upsertProfile = async (req, res) => {
  const required = ['category', 'location', 'bio', 'hourlyRate'];
  for (const f of required) {
    if (!req.body[f])
      return res.status(400).json({ success: false, result: null, message: `${f} is required.` });
  }

  let profile = await WorkerProfile.findOne({ user: req.user._id, removed: false });
  if (profile) {
    Object.assign(profile, { ...req.body, removed: false });
    await profile.save();
  } else {
    profile = await new WorkerProfile({
      ...req.body, user: req.user._id, status: 'pending', removed: false,
    }).save();
    await User.findByIdAndUpdate(req.user._id, { workerProfile: profile._id });
  }
  return res.status(200).json({ success: true, result: profile, message: 'Profile saved.' });
};

// Get own profile
methods.myProfile = async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id, removed: false });
  return res.status(200).json({ success: true, result: profile || null, message: 'Profile found.' });
};

// List approved workers (public)
methods.listApproved = async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.items) || 20;
  const skip   = (page - 1) * limit;
  const { category, jobType, shortNotice, q } = req.query;

  const filter = { removed: false, status: 'approved' };
  if (category)               filter.category   = category;
  if (jobType)                filter.jobTypes    = jobType;
  if (shortNotice === 'true') filter.shortNotice = true;
  if (q) filter.$or = [
    { category:   { $regex: q, $options: 'i' } },
    { skills:     { $regex: q, $options: 'i' } },
    { location:   { $regex: q, $options: 'i' } },
    { bio:        { $regex: q, $options: 'i' } },
  ];

  const [result, count] = await Promise.all([
    WorkerProfile.find(filter).skip(skip).limit(limit).sort({ adminRating: -1, completedJobs: -1 }),
    WorkerProfile.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true, result,
    pagination: { page, pages: Math.ceil(count / limit), count },
    message: 'Workers found.',
  });
};

// Admin: list all profiles with any status
methods.adminList = async (req, res) => {
  const { status } = req.query;
  const filter = { removed: false, ...(status ? { status } : {}) };
  const result = await WorkerProfile.find(filter).sort({ created: -1 });
  return res.status(200).json({ success: true, result, message: 'All worker profiles.' });
};

// Admin: approve worker
methods.approve = async (req, res) => {
  const profile = await WorkerProfile.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { status: 'approved', verified: true },
    { new: true }
  );
  if (!profile)
    return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });

  try {
    const workerUser = await User.findById(profile.user);
    if (workerUser) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    'Tomo Platform <noreply@tomo.ke>',
        to:      workerUser.email,
        subject: '[Tomo] Your worker profile is now live!',
        html:    `<p>Hi ${workerUser.name}, your worker profile has been approved. Recruiters can now find and hire you on Tomo.</p>`,
      });
    }
  } catch (e) {
    console.error('[Email] worker approve error:', e.message);
  }

  return res.status(200).json({ success: true, result: profile, message: 'Worker approved.' });
};

// Admin: suspend worker profile
methods.suspend = async (req, res) => {
  const { note } = req.body;
  const profile = await WorkerProfile.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { status: 'suspended', ...(note ? { adminNote: note } : {}) },
    { new: true }
  );
  if (!profile)
    return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });
  return res.status(200).json({ success: true, result: profile, message: 'Worker suspended.' });
};

// Admin: rate worker (internal, not shown to worker)
methods.rate = async (req, res) => {
  const { rating, note } = req.body;
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ success: false, result: null, message: 'Rating must be 1–5.' });
  const profile = await WorkerProfile.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { adminRating: rating, ...(note ? { adminNote: note } : {}) },
    { new: true }
  );
  if (!profile)
    return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });
  return res.status(200).json({ success: true, result: profile, message: 'Worker rated.' });
};

module.exports = methods;
