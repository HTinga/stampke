const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Supabase URL or Key missing in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
