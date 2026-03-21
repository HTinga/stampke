const express        = require('express');
const router         = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const userController  = require('@/controllers/coreControllers/userController');
const userAuth        = require('@/controllers/middlewaresControllers/createAuthMiddleware')('User');

// Current user
router.get('/user/me',            catchErrors(userController.me));
router.patch('/user/profile',     catchErrors(userController.updateProfile));
router.post('/logout',            catchErrors(userAuth.logout));

// Admin — user management (owner/admin only)
router.get('/user/list',          catchErrors(userController.list));
router.get('/user/read/:id',      catchErrors(userController.read));
router.patch('/user/activate/:id',catchErrors(userController.activate));
router.patch('/user/suspend/:id', catchErrors(userController.suspend));
router.delete('/user/delete/:id', catchErrors(userController.delete));

module.exports = router;
