const supabase = require('@/config/supabase');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('Job');

methods.create = async (req, res) => {
  const { title, description, category, type, location, pay, duration, skills, urgent } = req.body;
  if (!title || !category || !type)
    return res.status(400).json({ success: false, result: null, message: 'title, category and type are required.' });

  const { data, error } = await supabase
    .from('jobs')
    .insert([{
      title, description, category, type, location, pay, duration,
      skills: skills || [],
      urgent: !!urgent,
      posted_by: req.user.id,
      removed: false,
      status: 'open'
    }])
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });
  
  return res.status(200).json({ success: true, result: data, message: 'Job posted successfully.' });
};

// Mine — jobs posted by current user
methods.mine = async (req, res) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('posted_by', req.user.id)
    .eq('removed', false)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ success: false, message: error.message });
  return res.status(200).json({ success: true, result: data, message: 'Your jobs.' });
};

// Apply — worker submits application
methods.apply = async (req, res) => {
  const { name, phone, email, skills, note } = req.body;
  if (!name || !phone)
    return res.status(400).json({ success: false, result: null, message: 'Name and phone are required.' });

  // Check if job exists and is open
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', req.params.id)
    .eq('removed', false)
    .eq('status', 'open')
    .single();

  if (jobError || !job)
    return res.status(400).json({ success: false, result: null, message: 'Job is not open or does not exist.' });

  // Check if already applied
  const { data: existing, error: existingError } = await supabase
    .from('job_applications')
    .select('*')
    .eq('job_id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (existing)
    return res.status(409).json({ success: false, result: null, message: 'Already applied to this job.' });

  const { data: application, error: appError } = await supabase
    .from('job_applications')
    .insert([{
      job_id: req.params.id,
      user_id: req.user.id,
      name, phone, email,
      skills: skills || [],
      note,
      status: 'pending'
    }])
    .select()
    .single();

  if (appError) return res.status(400).json({ success: false, message: appError.message });
  
  return res.status(200).json({ success: true, result: application, message: 'Application submitted.' });
};

// Update applicant status
methods.updateApplicant = async (req, res) => {
  const { applicantId, status } = req.body;
  if (!applicantId || !status)
    return res.status(400).json({ success: false, result: null, message: 'applicantId and status are required.' });

  const { data: application, error: appError } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', applicantId)
    .select()
    .single();

  if (appError || !application)
    return res.status(404).json({ success: false, result: null, message: 'Applicant not found.' });

  if (status === 'hired') {
    await supabase.from('jobs').update({ status: 'in-progress' }).eq('id', req.params.id);
  }

  return res.status(200).json({ success: true, result: application, message: `Applicant ${status}.` });
};

// List open jobs (for workers to browse)
methods.listOpen = async (req, res) => {
  const { category, type, q, page = 1, items = 20 } = req.query;
  const limit = parseInt(items);
  const skip = (parseInt(page) - 1) * limit;

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('removed', false)
    .eq('status', 'open');

  if (category) query = query.eq('category', category);
  if (type)     query = query.eq('type', type);
  if (q) {
    query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,skills.cs.{"${q}"}`);
  }

  const { data, count, error } = await query
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.status(200).json({
    success: true,
    result: data,
    pagination: { page: parseInt(page), pages: Math.ceil((count || 0) / limit), count: count || 0 },
    message: 'Open jobs.',
  });
};

// My applications — jobs the worker has applied to
methods.myApplications = async (req, res) => {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*, jobs(*)')
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ success: false, message: error.message });
  
  const result = data.map(app => ({
    job: app.jobs,
    application: app
  }));

  return res.status(200).json({ success: true, result, message: 'Your applications.' });
};

module.exports = methods;

