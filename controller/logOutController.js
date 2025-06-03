const refreshTokenModel = require('../model/refreashTokenModel');

async function logOut(req, res) {
  const { refreshToken } = req.cookies;

  await refreshTokenModel.deleteOne({ token: refreshToken });

  res
    .clearCookie('token')
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json({ message: 'Logged out' });
}
module.exports = logOut;
