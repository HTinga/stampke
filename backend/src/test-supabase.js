require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabase = require('./config/supabase');

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    console.error('❌  Supabase connection failed:', error.message);
    console.error('    Check your .env for SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  } else {
    console.log('✅  Supabase connection successful!');
    console.log('    Users found:', data.length);
    process.exit(0);
  }
}

testConnection();
