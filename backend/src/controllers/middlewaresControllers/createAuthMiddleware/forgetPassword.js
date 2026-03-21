const sendEmail = require('@/utils/sendEmail');
const Joi      = require('joi');
const mongoose = require('mongoose');
const shortid  = require('shortid');

const forgetPassword = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User         = mongoose.model(userModel);
  const { email }    = req.body;

  const { error } = Joi.object({
    email: Joi.string().email({ tlds: { allow: true } }).required(),
  }).validate({ email });

  if (error)
    return res.status(409).json({ success: false, result: null, message: 'Invalid email.' });

  const user = await User.findOne({ email: email.toLowerCase(), removed: false });
  if (!user)
    return res.status(404).json({
      success: false, result: null, message: 'No account with this email has been registered.',
    });

  const resetToken = shortid.generate();
  await UserPassword.findOneAndUpdate({ user: user._id }, { resetToken }, { new: true }).exec();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${frontendUrl}/resetpassword/${user._id}/${resetToken}`;

  sendEmail({ to: email, subject: 'Reset your Tomo password', html: `<p>Hi ${user.name},</p><p>Click this link to reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`, from: `Tomo <noreply@tomo.ke>` });

  return res.status(200).json({
    success: true, result: null, message: 'Check your email inbox to reset your password.',
  });
};

module.exports = forgetPassword;
