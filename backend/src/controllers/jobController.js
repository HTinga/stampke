const Job = require('../models/Job');

exports.create = async (req, res) => {
  const { title, description, category, type, location, pay, duration, skills, urgent } = req.body;
  if (!title || !category || !type) return res.status(400).json({ success: false, message: 'title, category and type are required.' });
  const job = await Job.create({ title, description, category, type, location, pay, duration, skills: skills || [], urgent: !!urgent, postedBy: req.user._id });
  res.status(201).json({ success: true, job });
};

exports.list = async (req, res) => {
  const { page = 1, limit = 30, search, category, type, status } = req.query;
  const filter = { removed: false, status: status || 'open' };
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { location: { $regex: search, $options: 'i' } },
  ];
  const jobs = await Job.find(filter)
    .populate('postedBy', 'name company')
    .sort({ urgent: -1, createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await Job.countDocuments(filter);
  res.json({ success: true, jobs, total });
};

exports.myJobs = async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id, removed: false }).sort({ createdAt: -1 });
  res.json({ success: true, jobs });
};

exports.read = async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name company email');
  if (!job || job.removed) return res.status(404).json({ success: false, message: 'Job not found.' });
  res.json({ success: true, job });
};

exports.update = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found or not yours.' });
  Object.assign(job, req.body);
  await job.save();
  res.json({ success: true, job });
};

exports.remove = async (req, res) => {
  await Job.findOneAndUpdate({ _id: req.params.id, postedBy: req.user._id }, { removed: true });
  res.json({ success: true });
};

exports.apply = async (req, res) => {
  const { name, phone, email, skills, note } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone are required.' });
  const job = await Job.findById(req.params.id);
  if (!job || job.status !== 'open') return res.status(400).json({ success: false, message: 'Job is not open.' });
  const already = job.applicants.find(a => a.email === email || a.userId?.toString() === req.user?._id?.toString());
  if (already) return res.status(409).json({ success: false, message: 'Already applied.' });
  job.applicants.push({ name, phone, email, skills: skills || [], note, userId: req.user?._id, workerProfile: req.user?.workerProfile });
  await job.save();
  res.json({ success: true, message: 'Application submitted.' });
};

exports.updateApplicant = async (req, res) => {
  const { applicantId, status } = req.body;
  const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
  const applicant = job.applicants.id(applicantId);
  if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found.' });
  applicant.status = status;
  if (status === 'hired') job.status = 'in-progress';
  await job.save();
  res.json({ success: true, job });
};
