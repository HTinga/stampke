// ── Supabase Frontend Client ──────────────────────────────────────────────────
// Uses the anon/publishable key — safe for browser, respects Row Level Security
// Project: https://rqsndxictgatmqjfnaye.supabase.co
import { createClient } from '@supabase/supabase-js';

// Hardcoded URL (public, safe) — key comes from env for flexibility
const SUPABASE_URL  = 'https://rqsndxictgatmqjfnaye.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'sb_publishable_iJPEhZoPZJfu5DhUIuEb3Q_hrbBza6r';  // public anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false }, // Tomo uses its own JWT auth
});

// ── Typed table helpers ───────────────────────────────────────────────────────
export const db = {
  clients:     () => supabase.from('clients'),
  invoices:    () => supabase.from('invoices'),
  payments:    () => supabase.from('payments'),
  jobs:        () => supabase.from('jobs'),
  workers:     () => supabase.from('worker_profiles'),
  users:       () => supabase.from('users'),
  activity:    () => supabase.from('activity_log'),
  subscriptions:() => supabase.from('subscriptions'),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type DbClient = {
  id: string; user_id: string; name: string; email?: string; phone?: string;
  company?: string; address?: string; country?: string; city?: string;
  notes?: string; source: string; status: string; tags?: string[];
  created_at: string; updated_at: string;
};

export type DbInvoice = {
  id: string; user_id: string; client_id?: string; invoice_number: string;
  client_name: string; client_email?: string; business_name?: string;
  items: { description: string; qty: number; unit_price: number; total: number }[];
  subtotal: number; tax_rate: number; tax_total: number; total: number;
  currency: string; status: string; due_date?: string; paid_at?: string;
  reminder_count: number; created_at: string;
};

export type DbJob = {
  id: string; posted_by: string; title: string; description?: string;
  category: string; type: string; location?: string; pay?: string;
  skills?: string[]; urgent: boolean; status: string; created_at: string;
};

export type DbWorkerProfile = {
  id: string; user_id: string; category: string; job_types: string[];
  location: string; bio: string; hourly_rate: string; skills: string[];
  availability: string; short_notice: boolean; status: string;
  rating?: number; created_at: string;
};
