const express         = require('express');
const router          = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const userController  = require('@/controllers/coreControllers/userController');
const userAuth        = require('@/controllers/middlewaresControllers/createAuthMiddleware')('User');

// ── Own profile ───────────────────────────────────────────────────────────────
router.get('/user/me',            catchErrors(userController.me));
router.patch('/user/profile',     catchErrors(userController.updateProfile));
router.post('/logout',            catchErrors(userAuth.logout));

// ── User management (superadmin + admin) ──────────────────────────────────────
router.get('/user/list',          catchErrors(userController.list));
router.get('/user/read/:id',      catchErrors(userController.read));
router.patch('/user/activate/:id',catchErrors(userController.activate));
router.patch('/user/suspend/:id', catchErrors(userController.suspend));
router.delete('/user/delete/:id', catchErrors(userController.delete));

// ── Superadmin only ───────────────────────────────────────────────────────────
router.post('/user/create-admin',              catchErrors(userController.createAdmin));
router.patch('/user/grant-plan/:id',           catchErrors(userController.grantPlan));
router.patch('/user/admin-permissions/:id',    catchErrors(userController.updateAdminPermissions));

module.exports = router;
