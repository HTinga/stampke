'use strict';
const supabase = require('@/config/supabase');
const createCRUD = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUD('WorkerProfile');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stampke.vercel.app';

// ── Upsert own profile ────────────────────────────────────────────────────────
methods.upsertProfile = async (req, res) => {
  const { category, location, bio, hourlyRate, skills } = req.body;
  const required = ['category', 'location', 'bio', 'hourlyRate'];
  for (const f of required) {
    if (!req.body[f])
      return res.status(400).json({ success: false, result: null, message: `${f} is required.` });
  }

  const { data: profile, error } = await supabase
    .from('worker_profiles')
    .upsert({
      user_id: req.user.id,
      category,
      location,
      bio,
      hourly_rate: hourlyRate,
      skills: skills || [],
      updated_at: new Date(),
      removed: false
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.status(200).json({ success: true, result: profile, message: 'Profile saved.' });
};

// ── Get own profile ───────────────────────────────────────────────────────────
methods.myProfile = async (req, res) => {
  const { data: profile, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('removed', false)
    .single();

  return res.status(200).json({ success: true, result: profile || null, message: 'Profile found.' });
};

// ── Upload CV ─────────────────────────────────────────────────────────────────
methods.uploadCV = async (req, res) => {
  const { cvUrl, cvFileName } = req.body;
  if (!cvUrl) return res.status(400).json({ success: false, result: null, message: 'cvUrl is required.' });

  const { data: profile, error } = await supabase
    .from('worker_profiles')
    .update({ cv_url: cvUrl, cv_file_name: cvFileName })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });
  return res.status(200).json({ success: true, result: profile, message: 'CV uploaded.' });
};

// ── Add certificate ───────────────────────────────────────────────────────────
methods.addCertificate = async (req, res) => {
  const { name, issuer, year, fileUrl, fileName } = req.body;
  if (!name) return res.status(400).json({ success: false, result: null, message: 'Certificate name required.' });

  const { data: profile, error: getError } = await supabase
    .from('worker_profiles')
    .select('certificates')
    .eq('user_id', req.user.id)
    .single();

  if (getError) return res.status(400).json({ success: false, message: getError.message });

  const certificates = profile.certificates || [];
  certificates.push({ id: Date.now().toString(), name, issuer, year, fileUrl, fileName, verified: false });

  const { data: updated, error: updateError } = await supabase
    .from('worker_profiles')
    .update({ certificates })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (updateError) return res.status(400).json({ success: false, message: updateError.message });
  return res.status(200).json({ success: true, result: updated, message: 'Certificate added.' });
};

// ── Remove certificate ────────────────────────────────────────────────────────
methods.removeCertificate = async (req, res) => {
  const { data: profile, error: getError } = await supabase
    .from('worker_profiles')
    .select('certificates')
    .eq('user_id', req.user.id)
    .single();

  if (getError) return res.status(400).json({ success: false, message: getError.message });

  const certificates = (profile.certificates || []).filter(c => c.id !== req.params.certId);

  const { data: updated, error: updateError } = await supabase
    .from('worker_profiles')
    .update({ certificates })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (updateError) return res.status(400).json({ success: false, message: updateError.message });
  return res.status(200).json({ success: true, result: updated, message: 'Certificate removed.' });
};

// ── List approved workers (public) ────────────────────────────────────────────
methods.listApproved = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.items) || 20;
  const skip  = (page - 1) * limit;
  const { category, jobType, q } = req.query;

  let query = supabase
    .from('worker_profiles')
    .select('*, users(*)', { count: 'exact' })
    .eq('removed', false)
    .eq('status', 'approved');

  if (category) query = query.eq('category', category);
  if (q) {
    query = query.or(`category.ilike.%${q}%,skills.cs.{"${q}"},bio.ilike.%${q}%,location.ilike.%${q}%`);
  }

  const { data, count, error } = await query
    .order('admin_rating', { ascending: false })
    .order('completed_jobs', { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.status(200).json({
    success: true,
    result: data,
    pagination: { page, pages: Math.ceil((count || 0) / limit), count: count || 0 },
    message: 'Workers found.'
  });
};

// ── Get worker with credentials ───────────────────────────────────────────────
methods.getWithCredentials = async (req, res) => {
  const { data: profile, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('id', req.params.id)
    .eq('removed', false)
    .single();

  if (error || !profile) return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });

  const isSuperAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
  const hasAccess    = isSuperAdmin || (profile.credential_access_granted_to || []).includes(req.user.id);

  if (!hasAccess) {
    const safe = { ...profile };
    delete safe.cv_url;
    delete safe.certificates;
    return res.status(200).json({ success: true, result: { ...safe, credentialsHidden: true }, message: 'Limited profile.' });
  }
  return res.status(200).json({ success: true, result: profile, message: 'Full profile.' });
};

// ── Grant credential access to employer ───────────────────────────────────────
methods.grantCredentialAccess = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin')
    return res.status(403).json({ success: false, result: null, message: 'Superadmin only.' });

  const { workerId, employerId } = req.body;
  const { data: profile, error: getError } = await supabase
    .from('worker_profiles')
    .select('credential_access_granted_to')
    .eq('id', workerId)
    .single();

  if (getError) return res.status(400).json({ success: false, message: getError.message });

  const access = profile.credential_access_granted_to || [];
  if (!access.includes(employerId)) access.push(employerId);

  const { data: updated, error: updateError } = await supabase
    .from('worker_profiles')
    .update({ credential_access_granted_to: access })
    .eq('id', workerId)
    .select()
    .single();

  if (updateError) return res.status(400).json({ success: false, message: updateError.message });
  return res.status(200).json({ success: true, result: updated, message: 'Access granted.' });
};

// ── Admin: list all ───────────────────────────────────────────────────────────
methods.adminList = async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('worker_profiles').select('*, users(*)').eq('removed', false);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.status(200).json({ success: true, result: data, message: 'All profiles.' });
};

// ── Admin: approve ────────────────────────────────────────────────────────────
methods.approve = async (req, res) => {
  const { data: profile, error: updateError } = await supabase
    .from('worker_profiles')
    .update({ status: 'approved', verified: true })
    .eq('id', req.params.id)
    .eq('removed', false)
    .select()
    .single();

  if (updateError || !profile) return res.status(404).json({ success: false, result: null, message: 'Profile not found.' });
  
  return res.status(200).json({ success: true, result: profile, message: 'Profile approved.' });
};

// ── Employer: rate worker ─────────────────────────────────────────────────────
methods.rate = async (req, res) => {
  const { stars, comment, errandRef } = req.body;
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ success: false, result: null, message: 'Stars must be 1-5.' });

  const { data: profile, error: getError } = await supabase
    .from('worker_profiles')
    .select('ratings')
    .eq('id', req.params.id)
    .eq('removed', false)
    .single();

  if (getError || !profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

  let ratings = profile.ratings || [];
  ratings = ratings.filter(r => r.employer !== req.user.id);
  ratings.push({ employer: req.user.id, stars, comment, errandRef, created_at: new Date() });

  const { data: updated, error: updateError } = await supabase
    .from('worker_profiles')
    .update({ 
      ratings,
      completed_jobs: Math.max(profile.completed_jobs || 0, ratings.length)
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) return res.status(400).json({ success: false, message: updateError.message });
  return res.status(200).json({ success: true, result: updated, message: `Rated ${stars} stars.` });
};

module.exports = methods;

