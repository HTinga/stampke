'use strict';
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

let _client = null;

const getClient = () => {
  if (_client) return _client;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    const msg = '[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env';
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }

  try {
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return _client;
  } catch (error) {
    console.error('❌ Supabase initialization error:', error.message);
    throw error;
  }
};

// ── Query helpers (mirrors MongoDB patterns our controllers use) ──────────────
const db = {
  // Generic query
  from: (table) => {
    return getClient().from(table);
  },

  // Insert and return row
  insert: async (table, data) => {
    const { data: row, error } = await getClient().from(table).insert(data).select().single();
    if (error) throw error;
    return row;
  },

  // Update by id
  update: async (table, id, data) => {
    const { data: row, error } = await getClient().from(table).update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  },

  // Select with filters
  select: async (table, filters = {}, opts = {}) => {
    let q = getClient().from(table).select(opts.columns || '*');
    for (const [key, val] of Object.entries(filters)) q = q.eq(key, val);
    if (opts.limit)  q = q.limit(opts.limit);
    if (opts.order)  q = q.order(opts.order, { ascending: opts.asc ?? false });
    if (opts.single) q = q.single();
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  // Soft delete
  softDelete: async (table, id) => {
    const { error } = await getClient().from(table).update({ removed: true }).eq('id', id);
    if (error) throw error;
  },
};

module.exports = { getClient, db };
