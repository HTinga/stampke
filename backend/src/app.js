const express      = require('express');
const cors         = require('cors');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter  = require('./routes/coreRoutes/coreApi');
const appApiRouter   = require('./routes/appRoutes/appApi');

const userAuth        = require('./controllers/middlewaresControllers/createAuthMiddleware')('User');
const { catchErrors, notFound, productionErrors } = require('./handlers/errorHandlers');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
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
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));   // 15 MB for base64 portfolio images
app.use(express.urlencoded({ extended: true }));
app.use(compression());

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Rate limit: 200 req / 15 min per IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, result: null, message: 'Too many requests, please slow down.' },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
// Public auth (no token required)
app.use('/api', coreAuthRouter);

// Protected routes — require valid JWT
app.use('/api', userAuth.isValidAuthToken, coreApiRouter);
app.use('/api', userAuth.isValidAuthToken, appApiRouter);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(productionErrors);

module.exports = app;
