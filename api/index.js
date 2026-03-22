// api/index.js — Vercel Serverless Function
// Runs from the root — all backend deps must be in root package.json

const path = require('path');

// Set up @/ alias BEFORE requiring any backend code
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', path.join(__dirname, '../backend/src'));

const mongoose = require('mongoose');

// Track connection state across warm invocations
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  });

  isConnected = true;

  // Register all models (safe to call multiple times — mongoose dedupes)
  const models = [
    '../backend/src/models/coreModels/User',
    '../backend/src/models/coreModels/UserPassword',
    '../backend/src/models/coreModels/Setting',
    '../backend/src/models/appModels/Client',
    '../backend/src/models/appModels/Invoice',
    '../backend/src/models/appModels/Payment',
    '../backend/src/models/appModels/Job',
    '../backend/src/models/appModels/WorkerProfile',
  ];
  for (const m of models) {
    try { require(path.join(__dirname, m)); } catch (e) { /* already registered */ }
  }
}

// Load Express app once and cache it
let app;
function getApp() {
  if (!app) app = require('../backend/src/app');
  return app;
}

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    await connectDB();
    return getApp()(req, res);
  } catch (err) {
    console.error('[Serverless] Fatal error:', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        result:  null,
        message: 'Server error. Please try again.',
        error:   process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
  }
};
