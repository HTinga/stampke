'use strict';
require('module-alias/register');

const express       = require('express');
const cors          = require('cors');
const compression   = require('compression');
const cookieParser  = require('cookie-parser');
const helmet        = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp           = require('hpp');
const rateLimit     = require('express-rate-limit');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter  = require('./routes/coreRoutes/coreApi');
const appApiRouter   = require('./routes/appRoutes/appApi');
const userAuth       = require('./controllers/middlewaresControllers/createAuthMiddleware')('User');
const { notFound, productionErrors } = require('./handlers/errorHandlers');
const logger         = require('./utils/logger');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = process.env.FRONTEND_URL || '';
    if (
      origin === allowed ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp());

// ── IntaSend webhook — raw body must come BEFORE express.json ─────────────────
const paymentGateway = require('./controllers/appControllers/paymentGatewayController');
const { catchErrors } = require('./handlers/errorHandlers');
app.post('/api/payments/callback', paymentGateway.mpesaCallback);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(compression());

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.on('finish', () => logger.http(`${req.method} ${req.path} ${res.statusCode}`));
  next();
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, result: null, message: 'Too many requests, slow down.' },
}));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, result: null, message: 'Too many auth attempts. Try again in 15 minutes.' },
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgetpassword', authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', coreAuthRouter);
// Google OAuth redirect callback lives on /auth/google/callback (browser redirect)
app.use('/auth', coreAuthRouter);
app.use('/api', userAuth.isValidAuthToken, coreApiRouter);
app.use('/api', userAuth.isValidAuthToken, appApiRouter);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(productionErrors);

module.exports = app;
