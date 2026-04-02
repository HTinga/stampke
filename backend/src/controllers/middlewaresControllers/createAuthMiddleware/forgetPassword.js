'use strict';
const sendEmail = require('@/utils/sendEmail');
const Joi      = require('joi');
const supabase = require('@/config/supabase');
const shortid  = require('shortid');

const forgetPassword = async (req, res, { userModel }) => {
  const { email } = req.body;

  const { error } = Joi.object({
    email: Joi.string().email({ tlds: { allow: true } }).required(),
  }).validate({ email });

  if (error)
    return res.status(400).json({ success: false, result: null, message: 'Invalid email.' });

  const emailLower = email.toLowerCase();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name')
    .eq('email', emailLower)
    .eq('removed', false)
    .maybeSingle();

  if (userError || !user)
    return res.status(404).json({
      success: false, result: null, message: 'No account with this email has been registered.',
    });

  const resetToken = shortid.generate();
  
  const { error: updateError } = await supabase
    .from('user_passwords')
    .update({ 
      reset_token: resetToken,
      reset_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('user_id', user.id);

  if (updateError) return res.status(500).json({ success: false, message: updateError.message });

  const frontendUrl = process.env.FRONTEND_URL || 'https://stampke.vercel.app';
  const link = `${frontendUrl}/resetpassword/${user.id}/${resetToken}`;

  try {
    await sendEmail({ 
      to: emailLower, 
      subject: 'Reset your StampKE password', 
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#18181b;">Reset your password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${link}" style="background:#18181b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password &rarr;</a>
          </div>
          <p style="color:#6b7280;font-size:14px;">This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `, 
      from: `StampKE <noreply@stampke.co.ke>` 
    });
  } catch (err) {
    console.error('[Email] forgetPassword error:', err.message);
  }

  return res.status(200).json({
    success: true, result: null, message: 'Check your email inbox to reset your password.',
  });
};

module.exports = forgetPassword;
