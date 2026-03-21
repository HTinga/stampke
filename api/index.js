// api/index.js — Vercel Serverless Function
// All /api/* requests are handled by this single file
// Uses the same Express app from backend/src/app.js

require('module-alias/register');

// Set up module aliases relative to this file
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', require('path').join(__dirname, '../backend/src'));

// Load environment (Vercel injects env vars automatically)
const mongoose = require('mongoose');
const path     = require('path');
const { globSync } = require('glob');

// Connect to MongoDB (reuse connection across invocations)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 5,   // lower pool for serverless (issue #15)
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;

  // Auto-register all models
  const modelFiles = globSync('./backend/src/models/**/*.js', {
    cwd: path.join(__dirname, '..'),
  });
  for (const f of modelFiles) {
    require(path.join(__dirname, '..', f));
  }
}

// Build the Express app
const app = require('../backend/src/app');

// Vercel serverless handler
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
