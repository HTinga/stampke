const express              = require('express');
const router               = express.Router();
const { catchErrors }      = require('@/handlers/errorHandlers');

const clientController     = require('@/controllers/appControllers/clientController');
const invoiceController    = require('@/controllers/appControllers/invoiceController');
const paymentController    = require('@/controllers/appControllers/paymentController');
const jobController        = require('@/controllers/appControllers/jobController');
const workerController     = require('@/controllers/appControllers/workerController');

// ── Helper: register standard CRUD routes for an entity ──────────────────────
// Follows idurar's /{entity}/create, /{entity}/read/:id, etc. convention
const routeEntity = (entity, controller) => {
  router.post  (`/${entity}/create`,       catchErrors(controller.create));
  router.get   (`/${entity}/read/:id`,     catchErrors(controller.read));
  router.patch (`/${entity}/update/:id`,   catchErrors(controller.update));
  router.delete(`/${entity}/delete/:id`,   catchErrors(controller.delete));
  router.get   (`/${entity}/list`,         catchErrors(controller.list));
  router.get   (`/${entity}/listAll`,      catchErrors(controller.listAll));
  router.get   (`/${entity}/search`,       catchErrors(controller.search));
  router.get   (`/${entity}/filter`,       catchErrors(controller.filter));
  router.get   (`/${entity}/summary`,      catchErrors(controller.summary));
};

// ── Clients ───────────────────────────────────────────────────────────────────
routeEntity('client', clientController);

// ── Invoices ──────────────────────────────────────────────────────────────────
routeEntity('invoice', invoiceController);
router.patch(`/invoice/paid/:id`,    catchErrors(invoiceController.markPaid));
router.post (`/invoice/remind/:id`,  catchErrors(invoiceController.sendReminder));

// ── Payments ──────────────────────────────────────────────────────────────────
routeEntity('payment', paymentController);

// ── Jobs ──────────────────────────────────────────────────────────────────────
routeEntity('job', jobController);
router.get  (`/job/mine`,                    catchErrors(jobController.mine));
router.post (`/job/apply/:id`,               catchErrors(jobController.apply));
router.patch(`/job/applicant/:id`,           catchErrors(jobController.updateApplicant));

// ── Workers ───────────────────────────────────────────────────────────────────
routeEntity('worker', workerController);
router.get  (`/worker/me`,                   catchErrors(workerController.myProfile));
router.post (`/worker/me`,                   catchErrors(workerController.upsertProfile));
router.get  (`/worker/approved`,             catchErrors(workerController.listApproved));
router.get  (`/worker/admin/list`,           catchErrors(workerController.adminList));
router.patch(`/worker/admin/approve/:id`,    catchErrors(workerController.approve));
router.patch(`/worker/admin/suspend/:id`,    catchErrors(workerController.suspend));
router.patch(`/worker/admin/rate/:id`,       catchErrors(workerController.rate));

// ── Health ─────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) =>
  res.status(200).json({ success: true, result: { status: 'ok', ts: new Date().toISOString() }, message: 'API is running' })
);

module.exports = router;

// ── Payment gateway ───────────────────────────────────────────────────────────
const paymentGateway = require('@/controllers/appControllers/paymentGatewayController');

// Public — plans page
router.get('/payment/plans', catchErrors(paymentGateway.getPlans));

// Protected — Stripe
router.post('/payment/stripe/checkout', catchErrors(paymentGateway.stripeCheckout));
router.post('/payment/stripe/portal',   catchErrors(paymentGateway.stripePortal));

// Protected — M-Pesa
router.post('/payment/mpesa/stk',    catchErrors(paymentGateway.mpesaSTK));
router.post('/payment/mpesa/status', catchErrors(paymentGateway.mpesaStatus));
