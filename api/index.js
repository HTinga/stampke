// api/index.js — Vercel Serverless Function (Supabase Backend)
'use strict';

const path            = require('path');
const BACKEND_MODULES = path.join(__dirname, '../backend/node_modules');
const BACKEND_SRC     = path.join(__dirname, '../backend/src');

// ── Step 1: Add backend/node_modules to Node's search path FIRST ─────────────
// Must happen before ANY require() that needs backend packages
process.env.NODE_PATH = BACKEND_MODULES;
require('module').Module._initPaths();

// ── Step 0: Load environment variables ────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.local') });

// ── Step 2: Set up @/ alias ───────────────────────────────────────────────────
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', BACKEND_SRC);

// ── Step 3: Require backend packages normally ─────────────────────────────────
// No DB connection logic here — handled by supabase client in the app

// Cache Express app
let appInstance;
function getApp() {
  if (!appInstance) {
    appInstance = require('../backend/src/app');
  }
  return appInstance;
}

// Vercel handler
module.exports = async (req, res) => {
  try {
    const app = getApp();
    return app(req, res);
  } catch (err) {
    console.error('[Serverless Error]', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        result: null,
        message: 'Internal Server Error: ' + err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
};
