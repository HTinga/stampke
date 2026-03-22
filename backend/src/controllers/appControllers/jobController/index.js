const mongoose             = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const Job     = mongoose.model('Job');
const methods = createCRUDController('Job');

methods.create = async (req, res) => {
  const { title, description, category, type, location, pay, duration, skills, urgent } = req.body;
  if (!title || !category || !type)
    return res.status(400).json({ success: false, result: null, message: 'title, category and type are required.' });

  const result = await new Job({
    title, description, category, type, location, pay, duration,
    skills: skills || [], urgent: !!urgent,
    postedBy: req.user._id, removed: false, status: 'open',
  }).save();
  return res.status(200).json({ success: true, result, message: 'Job posted successfully.' });
};

// Mine — jobs posted by current user
methods.mine = async (req, res) => {
  const result = await Job.find({ postedBy: req.user._id, removed: false }).sort({ created: -1 });
  return res.status(200).json({ success: true, result, message: 'Your jobs.' });
};

// Apply — worker submits application
methods.apply = async (req, res) => {
  const { name, phone, email, skills, note } = req.body;
  if (!name || !phone)
    return res.status(400).json({ success: false, result: null, message: 'Name and phone are required.' });

  const job = await Job.findOne({ _id: req.params.id, removed: false, status: 'open' });
  if (!job)
    return res.status(400).json({ success: false, result: null, message: 'Job is not open or does not exist.' });

  const alreadyApplied = job.applicants.some(
    (a) => a.email === email || a.user?.toString() === req.user?._id?.toString()
  );
  if (alreadyApplied)
    return res.status(409).json({ success: false, result: null, message: 'Already applied to this job.' });

  job.applicants.push({
    name, phone, email, skills: skills || [], note,
    user: req.user?._id,
    status: 'pending',
  });
  await job.save();
  return res.status(200).json({ success: true, result: job, message: 'Application submitted.' });
};

// Update applicant status — recruiter shortlists/hires/rejects
methods.updateApplicant = async (req, res) => {
  const { applicantId, status } = req.body;
  if (!applicantId || !status)
    return res.status(400).json({ success: false, result: null, message: 'applicantId and status are required.' });

  const job = await Job.findOne({ _id: req.params.id, removed: false });
  if (!job)
    return res.status(404).json({ success: false, result: null, message: 'Job not found.' });

  const applicant = job.applicants.id(applicantId);
  if (!applicant)
    return res.status(404).json({ success: false, result: null, message: 'Applicant not found.' });

  applicant.status = status;
  if (status === 'hired') job.status = 'in-progress';
  await job.save();

  return res.status(200).json({ success: true, result: job, message: `Applicant ${status}.` });
};


// List open jobs (for workers to browse)
methods.listOpen = async (req, res) => {
  const { category, type, q, page = 1, items = 20 } = req.query;
  const limit  = parseInt(items);
  const skip   = (parseInt(page) - 1) * limit;
  const filter = { removed: false, status: 'open' };
  if (category) filter.category = category;
  if (type)     filter.type = type;
  if (q) filter.$or = [
    { title:    { $regex: q, $options: 'i' } },
    { location: { $regex: q, $options: 'i' } },
    { skills:   { $regex: q, $options: 'i' } },
  ];
  const [result, count] = await Promise.all([
    mongoose.model('Job').find(filter).skip(skip).limit(limit).sort({ urgent: -1, created: -1 }),
    mongoose.model('Job').countDocuments(filter),
  ]);
  return res.status(200).json({ success: true, result, pagination: { page: parseInt(page), pages: Math.ceil(count/limit), count }, message: 'Open jobs.' });
};

// My applications — jobs the worker has applied to
methods.myApplications = async (req, res) => {
  const jobs = await mongoose.model('Job').find({ 'applicants.user': req.user._id, removed: false });
  const result = jobs.map(j => {
    const app = j.applicants.find(a => a.user?.toString() === req.user._id.toString());
    return { job: j, application: app };
  });
  return res.status(200).json({ success: true, result, message: 'Your applications.' });
};

module.exports = methods;
