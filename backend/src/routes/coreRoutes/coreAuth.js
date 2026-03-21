const express = require('express');
const router  = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const userAuth        = require('@/controllers/middlewaresControllers/createAuthMiddleware')('User');

// Public auth routes — no token required
router.post('/login',          catchErrors(userAuth.login));
router.post('/register',       catchErrors(userAuth.register));
router.post('/google',         catchErrors(userAuth.googleSignIn));
router.post('/forgetpassword', catchErrors(userAuth.forgetPassword));
router.post('/resetpassword',  catchErrors(userAuth.resetPassword));

module.exports = router;
