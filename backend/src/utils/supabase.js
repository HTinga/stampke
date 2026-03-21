'use strict';
// ── Supabase Backend Client ───────────────────────────────────────────────────
// Uses the service role key (secret) — NEVER expose this in frontend
// Supabase URL: https://rqsndxictgatmqjfnaye.supabase.co
// Docs: https://supabase.com/docs/reference/javascript

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL         = process.env.SUPABASE_URL         || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

let _client = null;

const getClient = () => {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — Supabase features disabled');
    return null;
  }
  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
};

// ── Query helpers (mirrors MongoDB patterns our controllers use) ──────────────
const db = {
  // Generic query
  from: (table) => {
    const client = getClient();
    if (!client) throw new Error('Supabase not configured');
    return client.from(table);
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
