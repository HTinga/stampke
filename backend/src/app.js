'use strict';
require('module-alias/register');

const express      = require('express');
const cors         = require('cors');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp          = require('hpp');
const rateLimit    = require('express-rate-limit');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter  = require('./routes/coreRoutes/coreApi');
const appApiRouter   = require('./routes/appRoutes/appApi');
const userAuth       = require('./controllers/middlewaresControllers/createAuthMiddleware')('User');
const { notFound, productionErrors } = require('./handlers/errorHandlers');
const logger         = require('./utils/logger');

const app = express();

// ── #13 CORS ────────────────────────────────────────────────────────────────
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

// ── Security headers (covers XSS, clickjacking, sniffing) ───────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled so API responses aren't blocked
  crossOriginEmbedderPolicy: false,
}));

// ── #3 Input sanitisation — strip MongoDB operators from req.body/query ──────
app.use(mongoSanitize({ replaceWith: '_' }));

// ── #3 HTTP parameter pollution prevention ───────────────────────────────────
app.use(hpp());


// ── Stripe webhook — raw body required for signature verification (issue #5) ─
app.post('/api/payment/stripe/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/appControllers/paymentGatewayController').stripeWebhook
);

app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(compression());

// ── #18 Request logging (morgan → winston) ───────────────────────────────────
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.http(`${req.method} ${req.path} ${res.statusCode}`);
  });
  next();
});

// ── #1 Rate limiting — tiered ────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, result: null, message: 'Too many requests, slow down.' },
});
// Stricter limit on auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, result: null, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

app.use('/api', limiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgetpassword', authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', coreAuthRouter);
app.use('/api', userAuth.isValidAuthToken, coreApiRouter);
app.use('/api', userAuth.isValidAuthToken, appApiRouter);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(productionErrors);

module.exports = app;
