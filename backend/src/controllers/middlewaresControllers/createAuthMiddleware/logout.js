const mongoose = require('mongoose');

const logout = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const token = req.authToken;

  if (token) {
    await UserPassword.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { loggedSessions: token } },
      { new: true }
    ).exec();
  } else {
    await UserPassword.findOneAndUpdate(
      { user: req.user._id },
      { loggedSessions: [] },
      { new: true }
    ).exec();
  }

  // Clear httpOnly cookie (issue #2)
  res.clearCookie('tomo_session', { httpOnly: true, path: '/' });
  return res.status(200).json({ success: true, result: {}, message: 'Successfully logged out' });
};

module.exports = logout;
