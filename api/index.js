// api/index.js — Vercel Serverless Function
// All backend packages live in backend/node_modules — require them by path

const path = require('path');

// Step 1: Tell module-alias where @ points BEFORE any backend require
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', path.join(__dirname, '../backend/src'));

// Step 2: Require mongoose from BACKEND node_modules (not root)
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });
  isConnected = true;

  // Register models explicitly from backend paths
  const modelPaths = [
    '../backend/src/models/coreModels/User',
    '../backend/src/models/coreModels/UserPassword',
    '../backend/src/models/coreModels/Setting',
    '../backend/src/models/appModels/Client',
    '../backend/src/models/appModels/Invoice',
    '../backend/src/models/appModels/Payment',
    '../backend/src/models/appModels/Job',
    '../backend/src/models/appModels/WorkerProfile',
  ];
  for (const m of modelPaths) {
    try { require(path.join(__dirname, m)); } catch (_) { /* already loaded */ }
  }
}

// Cache the Express app across warm invocations
let app;
function getApp() {
  if (!app) {
    // Tell Node to find all backend requires in backend/node_modules
    // by prepending it to the module lookup path
    const backendNodeModules = path.join(__dirname, '../backend/node_modules');
    if (!require.resolve.paths('express').includes(backendNodeModules)) {
      process.env.NODE_PATH = backendNodeModules;
      require('module').Module._initPaths();
    }
    app = require('../backend/src/app');
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    await connectDB();
    return getApp()(req, res);
  } catch (err) {
    console.error('[Serverless crash]', err.message, '\n', err.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        result:  null,
        message: 'Server error — ' + err.message,
      });
    }
  }
};
