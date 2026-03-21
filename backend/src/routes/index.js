const express = require('express');
const router = express.Router();

const { protect, requireRole, requireActive } = require('../middleware/auth');
const auth    = require('../controllers/authController');
const clients = require('../controllers/clientController');
const invoices = require('../controllers/invoiceController');
const workers = require('../controllers/workerController');
const jobs    = require('../controllers/jobController');

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/register',      wrap(auth.register));
router.post('/auth/login',         wrap(auth.login));
router.post('/auth/google',        wrap(auth.googleSignIn));
router.get ('/auth/me',            protect, wrap(auth.getMe));
router.patch('/auth/me',           protect, wrap(auth.updateMe));

// ── Admin: user management ────────────────────────────────────────────────────
router.get   ('/admin/users',          protect, requireRole('admin'), wrap(auth.listUsers));
router.patch ('/admin/users/:id/activate', protect, requireRole('admin'), wrap(auth.activateUser));
router.patch ('/admin/users/:id/suspend',  protect, requireRole('admin'), wrap(auth.suspendUser));
router.delete('/admin/users/:id',      protect, requireRole('admin'), wrap(auth.deleteUser));

// ── Clients ───────────────────────────────────────────────────────────────────
router.get   ('/clients/summary',   protect, requireActive, wrap(clients.summary));
router.get   ('/clients',           protect, requireActive, wrap(clients.list));
router.post  ('/clients',           protect, requireActive, wrap(clients.create));
router.get   ('/clients/:id',       protect, requireActive, wrap(clients.read));
router.patch ('/clients/:id',       protect, requireActive, wrap(clients.update));
router.delete('/clients/:id',       protect, requireActive, wrap(clients.remove));

// ── Invoices ──────────────────────────────────────────────────────────────────
router.get   ('/invoices/summary',     protect, requireActive, wrap(invoices.summary));
router.get   ('/invoices',             protect, requireActive, wrap(invoices.list));
router.post  ('/invoices',             protect, requireActive, wrap(invoices.create));
router.get   ('/invoices/:id',         protect, requireActive, wrap(invoices.read));
router.patch ('/invoices/:id',         protect, requireActive, wrap(invoices.update));
router.patch ('/invoices/:id/paid',    protect, requireActive, wrap(invoices.markPaid));
router.post  ('/invoices/:id/remind',  protect, requireActive, wrap(invoices.sendReminder));
router.delete('/invoices/:id',         protect, requireActive, wrap(invoices.remove));

// ── Workers ───────────────────────────────────────────────────────────────────
router.get   ('/workers',              protect, requireActive, wrap(workers.list));
router.get   ('/workers/me',           protect, wrap(workers.myProfile));
router.post  ('/workers/me',           protect, wrap(workers.upsertProfile));

// Admin worker management
router.get   ('/admin/workers',        protect, requireRole('admin'), wrap(workers.adminList));
router.patch ('/admin/workers/:id/approve', protect, requireRole('admin'), wrap(workers.approve));
router.patch ('/admin/workers/:id/suspend', protect, requireRole('admin'), wrap(workers.suspend));
router.patch ('/admin/workers/:id/rate',    protect, requireRole('admin'), wrap(workers.rate));
router.delete('/admin/workers/:id',    protect, requireRole('admin'), wrap(workers.remove));

// ── Jobs ──────────────────────────────────────────────────────────────────────
router.get   ('/jobs',             protect, requireActive, wrap(jobs.list));
router.get   ('/jobs/mine',        protect, requireActive, wrap(jobs.myJobs));
router.post  ('/jobs',             protect, requireActive, wrap(jobs.create));
router.get   ('/jobs/:id',         protect, requireActive, wrap(jobs.read));
router.patch ('/jobs/:id',         protect, requireActive, wrap(jobs.update));
router.delete('/jobs/:id',         protect, requireActive, wrap(jobs.remove));
router.post  ('/jobs/:id/apply',   protect, wrap(jobs.apply));
router.patch ('/jobs/:id/applicant', protect, requireActive, wrap(jobs.updateApplicant));

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

module.exports = router;
