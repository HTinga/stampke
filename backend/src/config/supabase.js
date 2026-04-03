const { getClient } = require('@/utils/supabase');

/**
 * Proxy object to the Supabase client.
 * This allows us to keep the existing `const supabase = require('@/config/supabase')` syntax
 * while ensuring that the client is only initialized when first used,
 * and with proper environment variable validation.
 */
const supabase = new Proxy({}, {
  get: (target, prop) => {
    return getClient()[prop];
  }
});

module.exports = supabase;
