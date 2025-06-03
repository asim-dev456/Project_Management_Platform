const userModel = require('../model/userModel');

async function userProfile(req, res) {
  const user = await userModel.findById(req.params.id);
  if (!user) {
    return res.status(400).json({ error: 'User Not found' });
  }
  res.status(200).json({
    message: 'Welcome',
    user: { id: user._id, email: user.email, role: user.roles },
  });
}
module.exports = userProfile;
