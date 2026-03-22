// api/index.js — Vercel Serverless Function
'use strict';

const path            = require('path');
const BACKEND_MODULES = path.join(__dirname, '../backend/node_modules');
const BACKEND_SRC     = path.join(__dirname, '../backend/src');

// ── Step 1: Add backend/node_modules to Node's search path FIRST ─────────────
// Must happen before ANY require() that needs backend packages
process.env.NODE_PATH = BACKEND_MODULES;
require('module').Module._initPaths();

// ── Step 2: Set up @/ alias ───────────────────────────────────────────────────
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', BACKEND_SRC);

// ── Step 3: Now we can require backend packages normally ──────────────────────
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI env var not set');

  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize:              3,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS:          45000,
    connectTimeoutMS:         10000,
  });
  isConnected = true;

  // Register models
  [
    '../backend/src/models/coreModels/User',
    '../backend/src/models/coreModels/UserPassword',
    '../backend/src/models/coreModels/Setting',
    '../backend/src/models/appModels/Client',
    '../backend/src/models/appModels/Invoice',
    '../backend/src/models/appModels/Payment',
    '../backend/src/models/appModels/Job',
    '../backend/src/models/appModels/WorkerProfile',
  ].forEach(m => { try { require(path.join(__dirname, m)); } catch (_) {} });
}

// Cache Express app
let app;
function getApp() {
  if (!app) app = require('../backend/src/app');
  return app;
}

// Vercel handler
module.exports = async (req, res) => {
  try {
    await connectDB();
    return getApp()(req, res);
  } catch (err) {
    console.error('[Serverless]', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false, result: null,
        message: err.message,   // always show real error
      });
    }
  }
};
