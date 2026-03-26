const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const { catchErrors } = require('@/handlers/errorHandlers');
const userAuth        = require('@/controllers/middlewaresControllers/createAuthMiddleware')('User');
const googleCallback   = require('@/controllers/middlewaresControllers/createAuthMiddleware/googleCallback');
const facebookCallback = require('@/controllers/middlewaresControllers/createAuthMiddleware/facebookCallback');

// Public auth routes
router.post('/login',          catchErrors(userAuth.login));
router.post('/register',       catchErrors(userAuth.register));
router.post('/google',         catchErrors(userAuth.googleSignIn));
router.post('/forgetpassword', catchErrors(userAuth.forgetPassword));
router.post('/resetpassword',  catchErrors(userAuth.resetPassword));

// Email verification — GET /api/verify-email?token=...&id=...
router.get('/verify-email', catchErrors(async (req, res) => {
  const User = mongoose.model('User');
  const { token, id } = req.query;
  if (!token || !id)
    return res.status(400).json({ success: false, result: null, message: 'Invalid verification link.' });

  const user = await User.findOne({ _id: id, emailVerifyToken: token, removed: false });
  if (!user)
    return res.status(400).json({ success: false, result: null, message: 'Verification link is invalid or has expired.' });

  if (new Date() > user.emailVerifyExpires)
    return res.status(400).json({ success: false, result: null, message: 'Verification link has expired. Please register again.' });

  user.emailVerified    = true;
  user.enabled          = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  const FRONTEND = process.env.FRONTEND_URL || 'https://stampke.vercel.app';
  return res.redirect(`${FRONTEND}?verified=1`);
}));

// Resend verification email
router.post('/resend-verification', catchErrors(async (req, res) => {
  const User   = mongoose.model('User');
  const crypto = require('crypto');
  const { Resend } = require('resend');
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, result: null, message: 'Email required.' });

  const user = await User.findOne({ email: email.toLowerCase(), removed: false });
  if (!user || user.emailVerified)
    return res.status(200).json({ success: true, result: null, message: 'If that email exists and is unverified, a new link has been sent.' });

  const emailVerifyToken   = crypto.randomBytes(32).toString('hex');
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerifyToken    = emailVerifyToken;
  user.emailVerifyExpires  = emailVerifyExpires;
  await user.save();

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${emailVerifyToken}&id=${user._id}`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Tomo <noreply@tomo.ke>', to: email,
      subject: 'Verify your Tomo email address',
      html: `<p>Hi ${user.name},</p><p><a href="${verifyUrl}">Click here to verify your email</a>. Expires in 24 hours.</p>`,
    });
  } catch (e) { console.error('[Email] resend verify error:', e.message); }

  return res.status(200).json({ success: true, result: null, message: 'Verification email resent.' });
}));

// Google OAuth redirect callback — GET /api/auth/google/callback?code=...
// Note: this is on /auth not /api because it's a browser redirect
router.get('/auth/google/callback',   catchErrors(googleCallback));
// Facebook OAuth redirect callback — GET /api/auth/facebook/callback?code=...
router.get('/auth/facebook/callback', catchErrors(facebookCallback));


// POST /api/setup — seeds superadmin account on live DB
// Call once: POST https://your-app.vercel.app/api/setup
// Body: { "secret": "stampke-setup-2024" }
// GET version — trigger from browser: /api/setup?secret=stampke-setup-2024
router.get('/setup', catchErrors(async (req, res) => {
  const secret = req.query.secret;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid setup secret.' });

  const User         = mongoose.model('User');
  const UserPassword = mongoose.model('UserPassword');
  const bcrypt       = require('bcryptjs');
  const shortid      = require('shortid');
  const OWNER_EMAIL    = process.env.OWNER_EMAIL    || 'hempstonetinga@gmail.com';
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '@Outlier12';

  let owner = await User.findOne({ email: OWNER_EMAIL.toLowerCase() });
  const salt = shortid.generate();
  const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);
  if (!owner) {
    owner = await new User({ name: 'Hempstone Tinga', email: OWNER_EMAIL.toLowerCase(), role: 'superadmin', enabled: true, emailVerified: true, plan: 'enterprise', removed: false }).save();
    await new UserPassword({ user: owner._id, password: hashed, salt, removed: false }).save();
  } else {
    owner.role = 'superadmin'; owner.enabled = true; owner.emailVerified = true; owner.plan = 'enterprise';
    await owner.save();
    await UserPassword.findOneAndUpdate({ user: owner._id }, { password: hashed, salt }, { upsert: true });
  }
  return res.status(200).json({ success: true, result: { email: OWNER_EMAIL, role: 'superadmin' }, message: 'Superadmin ready. Login: ' + OWNER_EMAIL + ' / ' + OWNER_PASSWORD });
}));

router.post('/setup', catchErrors(async (req, res) => {
  const { secret } = req.body;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid setup secret.' });

  const User         = mongoose.model('User');
  const UserPassword = mongoose.model('UserPassword');
  const bcrypt       = require('bcryptjs');
  const shortid      = require('shortid');

  const OWNER_EMAIL    = process.env.OWNER_EMAIL    || 'hempstonetinga@gmail.com';
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '@Outlier12';

  let owner = await User.findOne({ email: OWNER_EMAIL.toLowerCase() });
  const salt   = shortid.generate();
  const hashed = bcrypt.hashSync(salt + OWNER_PASSWORD);

  if (!owner) {
    owner = await new User({
      name: 'Hempstone Tinga', email: OWNER_EMAIL.toLowerCase(),
      role: 'superadmin', enabled: true, emailVerified: true,
      plan: 'enterprise', removed: false,
    }).save();
    await new UserPassword({ user: owner._id, password: hashed, salt, removed: false }).save();
  } else {
    owner.role = 'superadmin'; owner.enabled = true;
    owner.emailVerified = true; owner.plan = 'enterprise';
    await owner.save();
    await UserPassword.findOneAndUpdate({ user: owner._id }, { password: hashed, salt }, { upsert: true });
  }

  return res.status(200).json({
    success: true,
    result:  { email: OWNER_EMAIL, role: 'superadmin' },
    message: 'Superadmin account ready. Login with OWNER_EMAIL / OWNER_PASSWORD.',
  });
}));


// GET /api/seed-jobs — creates real demo jobs in the database  
// Call once: /api/seed-jobs?secret=stampke-setup-2024
router.get('/seed-jobs', catchErrors(async (req, res) => {
  const { secret } = req.query;
  if (secret !== (process.env.SETUP_SECRET || 'stampke-setup-2024'))
    return res.status(403).json({ success: false, result: null, message: 'Invalid secret.' });

  const Job  = mongoose.model('Job');
  const User = mongoose.model('User');
  
  // Use superadmin as poster
  const admin = await User.findOne({ email: (process.env.OWNER_EMAIL||'hempstonetinga@gmail.com').toLowerCase() });
  if (!admin) return res.status(400).json({ success: false, result: null, message: 'Run /api/setup first.' });
  
  const existing = await Job.countDocuments({ removed: false });
  if (existing >= 6) return res.status(200).json({ success: true, result: null, message: `${existing} jobs already exist.` });

  const JOBS = [
    { title: 'Plumber — Emergency Repairs', category: 'Plumbing', type: 'quick-gig', location: 'Westlands, Nairobi', pay: 'KES 2,500/day', description: 'Urgent plumbing repairs needed. Experience with residential and commercial plumbing.', skills: ['Plumbing','Pipe fitting','Drainage'], urgent: true },
    { title: 'Graphic Designer — Brand Identity', category: 'Graphic Design', type: 'contract', location: 'Remote', pay: 'KES 60,000/month', description: 'We need a skilled graphic designer for a 3-month brand identity project. Proficiency in Adobe Suite required.', skills: ['Illustrator','Photoshop','Figma','Branding'], urgent: false },
    { title: 'Security Officer — Night Shift', category: 'Security', type: 'permanent', location: 'CBD, Nairobi', pay: 'KES 25,000/month', description: 'Night security officer for a commercial building in CBD. G4S training preferred.', skills: ['Security','First Aid','CCTV Monitoring'], urgent: false },
    { title: 'Executive Driver', category: 'Driving', type: 'temporary', location: 'Kilimani, Nairobi', pay: 'KES 35,000/month', description: 'Professional executive driver needed. Must have a clean driving record and valid PSV license.', skills: ['Driving','PSV License','Professionalism'], urgent: true },
    { title: 'Data Entry Clerk', category: 'Admin / Office', type: 'temporary', location: 'Upperhill, Nairobi', pay: 'KES 18,000/month', description: 'Data entry for a fintech startup. Fast typing and Excel proficiency required.', skills: ['Excel','Data Entry','Attention to Detail'], urgent: false },
    { title: 'Event Waitstaff — Corporate Dinner', category: 'Event Staff', type: 'quick-gig', location: 'Gigiri, Nairobi', pay: 'KES 1,500/event', description: 'Professional waitstaff needed for a corporate dinner event this weekend.', skills: ['Hospitality','Customer Service','Smart Appearance'], urgent: true },
    { title: 'House Cleaner — Weekly', category: 'Cleaning', type: 'temporary', location: 'Karen, Nairobi', pay: 'KES 800/day', description: 'Professional house cleaner for weekly cleaning of a 4-bedroom home.', skills: ['Cleaning','Organizing','Attention to Detail'], urgent: false },
    { title: 'IT Support Technician', category: 'IT Support', type: 'permanent', location: 'Westlands, Nairobi', pay: 'KES 45,000/month', description: 'IT support for a 50-person office. Windows, networking, and printer support required.', skills: ['Windows','Networking','Troubleshooting','Hardware'], urgent: false },
  ];

  const created = await mongoose.model('Job').insertMany(
    JOBS.map(j => ({ ...j, postedBy: admin._id, status: 'open', removed: false }))
  );

  return res.status(200).json({ success: true, result: created, message: `${created.length} real jobs seeded.` });
}));

module.exports = router;
