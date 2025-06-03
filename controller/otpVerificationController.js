const otpModel = require('../model/otpModel');
const refreshTokenModel = require('../model/refreashTokenModel');
const userModel = require('../model/userModel');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/tokens');

async function verifyOpt(req, res) {
  const { email, otp } = req.body;

  const user = await otpModel.findOne({ email });
  const loginUser = await userModel.findOne({ email });
  if (!user || user.otp !== otp) {
    return res.status(403).json({ error: 'Invalid OTP' });
  }
  user.otp = null;

  const accessToken = generateAccessToken(loginUser);
  const refreshToken = generateRefreshToken(loginUser);

  //store refresh token in db
  await refreshTokenModel.create({
    userId: loginUser._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  res
    .cookie('token', accessToken, { httpOnly: true })
    .cookie('refreshToken', refreshToken, { httpOnly: true })
    .json({ message: '2FA login successful', accessToken });
}
module.exports = verifyOpt;
