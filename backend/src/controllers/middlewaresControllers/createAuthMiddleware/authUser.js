const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);
  if (!isMatch)
    return res.status(403).json({ success: false, result: null, message: 'Invalid credentials.' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: req.body.remember ? '365d' : '7d',
  });

  await UserPasswordModel.findOneAndUpdate(
    { user: user._id },
    { $push: { loggedSessions: token } },
    { new: true }
  ).exec();

  // Trial info for frontend
  const now           = new Date();
  const trialActive   = user.plan === 'trial' && user.trialEndsAt && now < user.trialEndsAt;
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((user.trialEndsAt - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return res.status(200).json({
    success: true,
    result: {
      _id:      user._id,
      name:     user.name,
      surname:  user.surname,
      role:     user.role,
      email:    user.email,
      photo:    user.photo,
      plan:     user.plan,
      trialActive,
      trialDaysLeft,
      adminPermissions: user.adminPermissions || [],
      token,
    },
    message: 'Successfully logged in',
  });
};

module.exports = authUser;
