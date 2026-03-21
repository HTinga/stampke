const Joi      = require('joi');
const mongoose = require('mongoose');
const authUser = require('./authUser');

const login = async (req, res, { userModel }) => {
  const UserPasswordModel = mongoose.model(userModel + 'Password');
  const UserModel         = mongoose.model(userModel);
  const { email, password } = req.body;

  const { error } = Joi.object({
    email:    Joi.string().email({ tlds: { allow: true } }).required(),
    password: Joi.string().required(),
  }).validate({ email, password });

  if (error)
    return res.status(409).json({
      success: false, result: null, message: 'Invalid/Missing credentials.', errorMessage: error.message,
    });

  const user = await UserModel.findOne({ email: email.toLowerCase(), removed: false });
  if (!user)
    return res.status(404).json({
      success: false, result: null, message: 'No account with this email has been registered.',
    });

  if (!user.enabled)
    return res.status(409).json({
      success: false, result: null, message: 'Your account is pending activation by the admin.',
      code: 'PENDING',
    });

  const databasePassword = await UserPasswordModel.findOne({ user: user._id, removed: false });
  if (!databasePassword)
    return res.status(404).json({
      success: false, result: null, message: 'No password set — please use Google Sign-In.',
    });

  return authUser(req, res, { user, databasePassword, password, UserPasswordModel });
};

module.exports = login;
