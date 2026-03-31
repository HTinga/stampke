const express              = require('express');
const router               = express.Router();
const { catchErrors }      = require('@/handlers/errorHandlers');

const clientController     = require('@/controllers/appControllers/clientController');
const invoiceController    = require('@/controllers/appControllers/invoiceController');
const paymentController    = require('@/controllers/appControllers/paymentController');
const jobController        = require('@/controllers/appControllers/jobController');
const workerController     = require('@/controllers/appControllers/workerController');
const paymentGateway       = require('@/controllers/appControllers/paymentGatewayController');
const templateController     = require('@/controllers/appControllers/templateController');
const auditController       = require('@/controllers/appControllers/auditController');
const envelopeController    = require('@/controllers/appControllers/envelopeController');
const notificationController = require('@/controllers/appControllers/notificationController');
const meetingController      = require('@/controllers/appControllers/meetingController');

const routeEntity = (entity, controller) => {
  router.post  (`/${entity}/create`,    catchErrors(controller.create));
  router.get   (`/${entity}/read/:id`,  catchErrors(controller.read));
  router.patch (`/${entity}/update/:id`,catchErrors(controller.update));
  router.delete(`/${entity}/delete/:id`,catchErrors(controller.delete));
  router.get   (`/${entity}/list`,      catchErrors(controller.list));
  router.get   (`/${entity}/listAll`,   catchErrors(controller.listAll));
  router.get   (`/${entity}/search`,    catchErrors(controller.search));
  router.get   (`/${entity}/filter`,    catchErrors(controller.filter));
  router.get   (`/${entity}/summary`,   catchErrors(controller.summary));
};

routeEntity('client',  clientController);
routeEntity('invoice', invoiceController);
router.patch(`/invoice/paid/:id`,   catchErrors(invoiceController.markPaid));
router.post (`/invoice/remind/:id`, catchErrors(invoiceController.sendReminder));

routeEntity('payment', paymentController);

routeEntity('job', jobController);
router.get  (`/job/mine`,          catchErrors(jobController.mine));
router.post (`/job/apply/:id`,     catchErrors(jobController.apply));
router.patch(`/job/applicant/:id`, catchErrors(jobController.updateApplicant));
  router.get  (`/job/open`,            catchErrors(jobController.listOpen));
  router.get  (`/job/my-applications`, catchErrors(jobController.myApplications));

routeEntity('worker', workerController);
router.get  (`/worker/me`,                catchErrors(workerController.myProfile));
router.post (`/worker/me`,                catchErrors(workerController.upsertProfile));
router.get  (`/worker/approved`,          catchErrors(workerController.listApproved));
router.get  (`/worker/admin/list`,        catchErrors(workerController.adminList));
router.patch(`/worker/admin/approve/:id`, catchErrors(workerController.approve));
router.patch(`/worker/admin/suspend/:id`, catchErrors(workerController.suspend));
router.patch(`/worker/admin/rate/:id`,    catchErrors(workerController.rate));

// ── Payments: IntaSend M-Pesa + Card ─────────────────────────────────────────
router.post(`/payments/mpesa/stk-push`,           catchErrors(paymentGateway.mpesaStkPush));
router.get (`/payments/mpesa/status/:checkoutRequestId`, catchErrors(paymentGateway.mpesaStatus));
router.post(`/payments/card/checkout`,            catchErrors(paymentGateway.cardCheckout));
router.post(`/payments/callback`,                 paymentGateway.mpesaCallback);

// ── Templates ──
router.post(`/template/create`,    catchErrors(templateController.createTemplate));
router.get (`/template/list`,      catchErrors(templateController.getTemplates));
router.delete(`/template/delete/:id`, catchErrors(templateController.deleteTemplate));

// ── Audit Logs ──
router.post(`/audit/create`,       catchErrors(auditController.createLog));
router.get (`/audit/list`,         catchErrors(auditController.list));

// ── eSign Envelopes ──
router.post  (`/envelope/create`,     catchErrors(envelopeController.create));
router.get   (`/envelope/list`,       catchErrors(envelopeController.list));
router.post  (`/envelope/send`,       catchErrors(envelopeController.send));
router.post  (`/envelope/update/:id`, catchErrors(envelopeController.update));
router.delete(`/envelope/delete/:id`, catchErrors(envelopeController.delete));

// ── Notifications ──
router.post(`/notification/create`,    catchErrors(notificationController.create));
router.get  (`/notification/list`,      catchErrors(notificationController.list));
router.patch(`/notification/read/:id`, catchErrors(notificationController.markRead));
router.patch(`/notification/readAll`,  catchErrors(notificationController.markAllRead));

// ── AI Meetings ──
router.post(`/meeting/create`,      catchErrors(meetingController.createMeeting));
router.get(`/meeting/list`,         catchErrors(meetingController.getMeetings));
router.get(`/meeting/read/:id`,     catchErrors(meetingController.getMeeting));
router.patch(`/meeting/update/:id`,  catchErrors(meetingController.updateMeeting));
router.delete(`/meeting/delete/:id`, catchErrors(meetingController.deleteMeeting));

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) =>
  res.status(200).json({ success: true, result: { status: 'ok', ts: new Date().toISOString() }, message: 'API running' })
);

// ── Email Notifications ───────────────────────────────────────────────────────
const notifyController = require('@/controllers/appControllers/notifyController');
router.post('/notify/sign-request', catchErrors(notifyController.signRequest));
router.post('/notify/completed',    catchErrors(notifyController.completed));

module.exports = router;
