// ── Supabase Client ───────────────────────────────────────────────────────────
// Supabase = Postgres database + realtime + storage + edge functions
// Free tier: 500MB DB, 1GB storage, 50MB file uploads
// Docs: https://supabase.com/docs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[Supabase] Missing env vars — database features will not work');
}

// Main client (anon key — safe to use in browser, respects RLS)
export const supabase = createClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder',
  {
    auth: { persistSession: false }, // Clerk handles auth, not Supabase
  }
);

// ── Table helpers ─────────────────────────────────────────────────────────────

export const db = {
  // Clients CRM
  clients: () => supabase.from('clients'),

  // Invoices
  invoices: () => supabase.from('invoices'),

  // Payments
  payments: () => supabase.from('payments'),

  // Jobs
  jobs: () => supabase.from('jobs'),

  // Worker profiles
  workers: () => supabase.from('worker_profiles'),

  // Users (mirror of Clerk — extended metadata)
  users: () => supabase.from('users'),

  // Activity log
  activity: () => supabase.from('activity_log'),

  // Subscriptions
  subscriptions: () => supabase.from('subscriptions'),
};

// ── Type helpers ──────────────────────────────────────────────────────────────
export type DbClient = {
  id:         string;
  user_id:    string;
  name:       string;
  email?:     string;
  phone?:     string;
  company?:   string;
  address?:   string;
  country?:   string;
  city?:      string;
  notes?:     string;
  source:     'direct' | 'referral' | 'whatsapp' | 'facebook' | 'instagram' | 'website' | 'other';
  status:     'lead' | 'active' | 'inactive';
  tags?:      string[];
  created_at: string;
  updated_at: string;
};

export type DbInvoice = {
  id:            string;
  user_id:       string;
  client_id?:    string;
  invoice_number: string;
  client_name:   string;
  client_email?: string;
  business_name?: string;
  items:         { description: string; qty: number; unit_price: number; total: number }[];
  subtotal:      number;
  tax_rate:      number;
  tax_total:     number;
  total:         number;
  currency:      string;
  status:        'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date?:     string;
  paid_at?:      string;
  reminder_count: number;
  created_at:    string;
};

export type DbJob = {
  id:          string;
  posted_by:   string;
  title:       string;
  description?: string;
  category:    string;
  type:        'quick-gig' | 'temporary' | 'contract' | 'permanent';
  location?:   string;
  pay?:        string;
  skills?:     string[];
  urgent:      boolean;
  status:      'open' | 'in-progress' | 'completed' | 'cancelled';
  created_at:  string;
};

export type DbWorkerProfile = {
  id:           string;
  user_id:      string;
  category:     string;
  job_types:    string[];
  location:     string;
  bio:          string;
  hourly_rate:  string;
  skills:       string[];
  availability: string;
  short_notice: boolean;
  status:       'pending' | 'approved' | 'suspended';
  rating?:      number;
  created_at:   string;
};
