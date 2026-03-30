const express                          = require('express');
const router                           = express.Router();
const { catchErrors }                  = require('@/handlers/errorHandlers');
const userController                   = require('@/controllers/coreControllers/userController');
const userAuth                         = require('@/controllers/middlewaresControllers/createAuthMiddleware')('User');
const { requireRole, requirePermission } = require('@/middleware/roleCheck');

// ── Own profile (any authenticated user) ─────────────────────────────────────
router.get('/user/me',        catchErrors(userController.me));
router.get('/user/usage',     catchErrors(userController.getUsage));
router.post('/user/usage',    catchErrors(userController.trackUsage));
router.post('/user/usage/bulk', catchErrors(userController.trackBulkUsage));
router.patch('/user/profile', catchErrors(userController.updateProfile));
router.post('/logout',        catchErrors(userAuth.logout));

// ── User management — superadmin + admin ─────────────────────────────────────
// #16: role-gated
router.get('/user/list',           requireRole('superadmin', 'admin'), catchErrors(userController.list));
router.get('/user/read/:id',       requireRole('superadmin', 'admin'), catchErrors(userController.read));
router.patch('/user/activate/:id', requireRole('superadmin', 'admin'), catchErrors(userController.activate));
router.patch('/user/suspend/:id',  requireRole('superadmin', 'admin'), catchErrors(userController.suspend));
router.delete('/user/delete/:id',  requireRole('superadmin', 'admin'), catchErrors(userController.delete));

// ── Superadmin ONLY ───────────────────────────────────────────────────────────
router.post('/user/create-admin',           requireRole('superadmin'), catchErrors(userController.createAdmin));
router.patch('/user/grant-plan/:id',        requireRole('superadmin'), catchErrors(userController.grantPlan));
router.patch('/user/admin-permissions/:id', requireRole('superadmin'), catchErrors(userController.updateAdminPermissions));

module.exports = router;
