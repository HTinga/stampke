const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Joi      = require('joi');
const mongoose = require('mongoose');
const shortid  = require('shortid');

const resetPassword = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User         = mongoose.model(userModel);
  const { password, userId, resetToken } = req.body;

  const { error } = Joi.object({
    password:   Joi.string().min(6).required(),
    userId:     Joi.string().required(),
    resetToken: Joi.string().required(),
  }).validate({ password, userId, resetToken });

  if (error)
    return res.status(409).json({ success: false, result: null, message: error.details[0].message });

  const [user, databasePassword] = await Promise.all([
    User.findOne({ _id: userId, removed: false }),
    UserPassword.findOne({ user: userId, removed: false }),
  ]);

  if (!user || !databasePassword)
    return res.status(404).json({ success: false, result: null, message: 'No account found.' });

  if (!user.enabled)
    return res.status(409).json({ success: false, result: null, message: 'Account is disabled.' });

  if (!databasePassword.resetToken || databasePassword.resetToken !== resetToken)
    return res.status(403).json({ success: false, result: null, message: 'Invalid or expired reset token.' });

  const salt           = shortid.generate();
  const hashedPassword = bcrypt.hashSync(salt + password);
  const newToken       = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  await UserPassword.findOneAndUpdate(
    { user: userId },
    {
      password,
      salt,
      password: hashedPassword,
      resetToken: shortid.generate(), // invalidate old token
      $push: { loggedSessions: newToken },
    },
    { new: true }
  ).exec();

  return res.status(200).json({
    success: true,
    result: {
      _id: user._id, name: user.name, role: user.role, email: user.email, token: newToken,
    },
    message: 'Password reset successfully',
  });
};

module.exports = resetPassword;
