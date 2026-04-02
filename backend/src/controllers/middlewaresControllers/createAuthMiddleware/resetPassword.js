'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const supabase = require('@/config/supabase');
const shortid = require('shortid');

const resetPassword = async (req, res, { userModel }) => {
  const { password, userId, resetToken } = req.body;

  const { error } = Joi.object({
    password: Joi.string().min(6).required(),
    userId: Joi.string().required(),
    resetToken: Joi.string().required(),
  }).validate({ password, userId, resetToken });

  if (error)
    return res.status(400).json({ success: false, result: null, message: error.details[0].message });

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('removed', false)
    .single();

  const { data: dbPass, error: passError } = await supabase
    .from('user_passwords')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (userError || passError || !user || !dbPass)
    return res.status(404).json({ success: false, result: null, message: 'No account found.' });

  if (!user.enabled)
    return res.status(403).json({ success: false, result: null, message: 'Account is disabled.' });

  if (!dbPass.reset_token || dbPass.reset_token !== resetToken)
    return res.status(403).json({ success: false, result: null, message: 'Invalid reset token.' });

  if (dbPass.reset_token_expires && new Date() > new Date(dbPass.reset_token_expires))
    return res.status(403).json({ success: false, result: null, message: 'Reset token has expired. Please request a new one.' });

  const salt = shortid.generate();
  const hashedPassword = bcrypt.hashSync(salt + password);
  const newToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const { error: updateError } = await supabase
    .from('user_passwords')
    .update({
      password_hash: hashedPassword,
      salt: salt,
      reset_token: null, // clear token
      reset_token_expires: null,
      // Note: loggedSessions logic might need a separate table if we want to track it
    })
    .eq('user_id', userId);

  if (updateError) return res.status(500).json({ success: false, message: updateError.message });

  return res.status(200).json({
    success: true,
    result: {
      id: user.id, name: user.name, role: user.role, email: user.email, token: newToken,
    },
    message: 'Password reset successfully',
  });
};

module.exports = resetPassword;
