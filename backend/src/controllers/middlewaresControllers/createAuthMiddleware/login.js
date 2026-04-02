const Joi      = require('joi');
const supabase = require('@/config/supabase');
const { authUser } = require('./authUser');

const login = async (req, res, { userModel }) => {
  const { email, password } = req.body;

  const { error } = Joi.object({
    email:    Joi.string().email({ tlds: { allow: true } }).required(),
    password: Joi.string().required(),
  }).validate({ email, password });

  if (error)
    return res.status(409).json({ success: false, result: null, message: 'Invalid/Missing credentials.' });

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('removed', false)
    .single();

  if (userError || !user)
    return res.status(404).json({ success: false, result: null, message: 'No account with this email has been registered.' });

  if (!user.enabled)
    return res.status(409).json({
      success: false, result: null,
      message: 'Your account has been disabled. Contact support.',
      code: 'DISABLED',
    });

  const { data: databasePassword, error: passwordError } = await supabase
    .from('user_passwords')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (passwordError || !databasePassword)
    return res.status(404).json({ success: false, result: null, message: 'No password set — please use Google Sign-In.' });

  // Start trial on first business login
  if (user.role === 'business' && !user.trial_started_at) {
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        trial_started_at: now,
        trial_ends_at: trialEndsAt
      })
      .eq('id', user.id);
    
    if (!updateError) {
      user.trial_started_at = now;
      user.trial_ends_at = trialEndsAt;
    }
  }

  return authUser(req, res, { user, databasePassword, password });
};

module.exports = login;

