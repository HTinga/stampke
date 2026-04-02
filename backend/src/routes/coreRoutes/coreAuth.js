const express = require('express');
const router = express.Router();
const supabase = require('@/config/supabase');
const { catchErrors } = require('@/handlers/errorHandlers');
const userAuth = require('@/controllers/middlewaresControllers/createAuthMiddleware')('User');
const googleCallback = require('@/controllers/middlewaresControllers/createAuthMiddleware/googleCallback');
const facebookCallback = require('@/controllers/middlewaresControllers/createAuthMiddleware/facebookCallback');

// Public auth routes
router.post('/login',          catchErrors(userAuth.login));
router.post('/register',       catchErrors(userAuth.register));
router.post('/google',         catchErrors(userAuth.googleSignIn));
router.post('/forgetpassword', catchErrors(userAuth.forgetPassword));
router.post('/resetpassword',  catchErrors(userAuth.resetPassword));

// Email verification — GET /api/verify-email?token=...&id=...
router.get('/verify-email', catchErrors(async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id)
    return res.status(400).json({ success: false, result: null, message: 'Invalid verification link.' });

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('email_verify_token', token)
    .eq('removed', false)
    .single();

  if (error || !user)
    return res.status(400).json({ success: false, result: null, message: 'Verification link is invalid or has expired.' });

  if (user.email_verify_expires && new Date() > new Date(user.email_verify_expires))
    return res.status(400).json({ success: false, result: null, message: 'Verification link has expired. Please register again.' });

  await supabase
    .from('users')
    .update({
      email_verified: true,
      enabled: true,
      email_verify_token: null,
      email_verify_expires: null,
      updated_at: new Date()
    })
    .eq('id', id);

  const FRONTEND = process.env.FRONTEND_URL || 'https://stampke.vercel.app';
  return res.redirect(`${FRONTEND}?verified=1`);
}));

// Resend verification email
router.post('/resend-verification', catchErrors(async (req, res) => {
  const crypto = require('crypto');
  const { Resend } = require('resend');
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, result: null, message: 'Email required.' });

  const emailLower = email.toLowerCase();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', emailLower)
    .eq('removed', false)
    .maybeSingle();

  if (!user || user.email_verified)
    return res.status(200).json({ success: true, result: null, message: 'If that email exists and is unverified, a new link has been sent.' });

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await supabase
    .from('users')
    .update({
      email_verify_token: emailVerifyToken,
      email_verify_expires: emailVerifyExpires.toISOString(),
      updated_at: new Date()
    })
    .eq('id', user.id);

  const verifyUrl = `${process.env.FRONTEND_URL || 'https://stampke.vercel.app'}/api/verify-email?token=${emailVerifyToken}&id=${user.id}`;
  
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'StampKE <noreply@stampke.co.ke>', 
      to: emailLower,
      subject: 'Verify your StampKE email address',
      html: `<p>Hi ${user.name},</p><p><a href="${verifyUrl}">Click here to verify your email</a>. Expires in 24 hours.</p>`,
    });
  } catch (e) { 
    console.error('[Email] resend verify error:', e.message); 
  }

  return res.status(200).json({ success: true, result: null, message: 'Verification email resent.' });
}));

// Google OAuth redirect callback
router.get('/auth/google/callback', catchErrors(googleCallback));
// Facebook OAuth redirect callback
router.get('/auth/facebook/callback', catchErrors(facebookCallback));

// POST /api/setup — seeds superadmin account on Supabase
router.get('/setup', catchErrors(async (req, res) => {
  const secret = req.query.secret;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid setup secret.' });

  const bcrypt = require('bcryptjs');
  const shortid = require('shortid');
  const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com').toLowerCase();
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '@Outlier12';

  const { data: owner, error: searchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', OWNER_EMAIL)
    .maybeSingle();

  const salt = shortid.generate();
  const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);

  if (!owner) {
    const { data: newOwner, error: createError } = await supabase
      .from('users')
      .insert([{
        name: 'Hempstone Tinga',
        email: OWNER_EMAIL,
        role: 'superadmin',
        enabled: true,
        email_verified: true,
        plan: 'business',
        removed: false
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    await supabase.from('user_passwords').insert([{ user_id: newOwner.id, password_hash: hashed, salt }]);
  } else {
    await supabase
      .from('users')
      .update({ role: 'superadmin', enabled: true, email_verified: true, plan: 'business', updated_at: new Date() })
      .eq('id', owner.id);
    
    await supabase
      .from('user_passwords')
      .update({ password_hash: hashed, salt })
      .eq('user_id', owner.id);
  }
  
  return res.status(200).json({ success: true, result: { email: OWNER_EMAIL, role: 'superadmin' }, message: 'Superadmin ready. Login: ' + OWNER_EMAIL + ' / ' + OWNER_PASSWORD });
}));

router.post('/setup', catchErrors(async (req, res) => {
  const { secret } = req.body;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid setup secret.' });

  const bcrypt = require('bcryptjs');
  const shortid = require('shortid');
  const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com').toLowerCase();
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '@Outlier12';

  const { data: owner } = await supabase.from('users').select('*').eq('email', OWNER_EMAIL).maybeSingle();
  const salt = shortid.generate();
  const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);

  if (!owner) {
    const { data: newOwner } = await supabase
      .from('users')
      .insert([{
        name: 'Hempstone Tinga', email: OWNER_EMAIL,
        role: 'superadmin', enabled: true, email_verified: true,
        plan: 'business', removed: false,
      }])
      .select()
      .single();
    await supabase.from('user_passwords').insert([{ user_id: newOwner.id, password_hash: hashed, salt, removed: false }]);
  } else {
    await supabase.from('users').update({ role: 'superadmin', enabled: true, email_verified: true, plan: 'business', updated_at: new Date() }).eq('id', owner.id);
    await supabase.from('user_passwords').update({ password_hash: hashed, salt }).eq('user_id', owner.id);
  }

  return res.status(200).json({ success: true, result: { email: OWNER_EMAIL, role: 'superadmin' }, message: 'Superadmin account ready.' });
}));


// GET /api/seed-jobs
router.get('/seed-jobs', catchErrors(async (req, res) => {
  const { secret } = req.query;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid secret.' });

  const ownerEmail = (process.env.OWNER_EMAIL || 'hempstonetinga@gmail.com').toLowerCase();
  const { data: admin } = await supabase.from('users').select('id').eq('email', ownerEmail).single();
  if (!admin) return res.status(400).json({ success: false, message: 'Run /api/setup first.' });
  
  const JOBS = [
    { title: 'Plumber — Emergency Repairs', category: 'Plumbing', type: 'quick-gig', location: 'Westlands, Nairobi', pay: 'KES 2,500/day', description: 'Urgent plumbing repairs needed.', skills: ['Plumbing'], urgent: true },
    { title: 'Executive Driver', category: 'Driving', type: 'temporary', location: 'Kilimani, Nairobi', pay: 'KES 35,000/month', description: 'Professional executive driver needed.', skills: ['Driving'], urgent: true },
  ];

  const { data: created, error } = await supabase
    .from('jobs')
    .insert(JOBS.map(j => ({ ...j, posted_by: admin.id, status: 'open', removed: false })))
    .select();

  if (error) return res.status(400).json({ success: false, message: error.message });
  return res.status(200).json({ success: true, result: created, message: `${created.length} real jobs seeded.` });
}));

// Cron: cleanup unverified accounts
router.get('/cron/cleanup-unverified', catchErrors(async (req, res) => {
  const secret = req.headers['authorization']?.replace('Bearer ', '');
  if (secret !== (process.env.CRON_SECRET || 'stampke-cron-2024')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const cutoff = new Date();
  const { data: expired, error } = await supabase
    .from('users')
    .select('id')
    .eq('email_verified', false)
    .lt('email_verify_expires', cutoff.toISOString())
    .eq('removed', false);

  if (error) return res.status(500).json({ success: false, message: error.message });

  let removed = 0;
  for (const user of expired) {
    await supabase.from('users').update({ removed: true, enabled: false, updated_at: new Date() }).eq('id', user.id);
    await supabase.from('user_passwords').delete().eq('user_id', user.id);
    removed++;
  }

  return res.status(200).json({ success: true, removed, message: `Removed ${removed} unverified accounts.` });
}));

module.exports = router;
