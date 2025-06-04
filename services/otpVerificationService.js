const otpModel = require('../model/otpModel');
const refreshTokenModel = require('../model/refreashTokenModel');
const userModel = require('../model/userModel');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/tokens');

async function verifyOtpService({ email, otp }) {
  const user = await otpModel.findOne({ email });
  const loginUser = await userModel.findOne({ email });
  if (!user || user.otp !== otp) {
    throw new Error('Invalid OTP');
  }
  if (user.expiresAt < new Date()) {
    throw new Error('OTP has expired');
  }
  const accessToken = generateAccessToken(loginUser);
  const refreshToken = generateRefreshToken(loginUser);
  //store refresh token in db
  await refreshTokenModel.create({
    userId: loginUser._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return { userId: loginUser._id, accessToken, refreshToken };
}

module.exports = { verifyOtpService };
