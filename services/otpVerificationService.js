const redisClient = require('../config/redisServer');
const refreshTokenModel = require('../model/refreashTokenModel');
const userModel = require('../model/userModel');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/tokens');

async function verifyOtpService({ email, otp }) {
  const loginUser = await userModel.findOne({ email });
  if (!loginUser) {
    throw new Error('User not found');
  }

  const storedOtp = await redisClient.get(`otp:${email}`);

  if (!storedOtp) {
    throw new Error('OTP has expired');
  }

  if (storedOtp !== otp) {
    throw new Error('Invalid OTP');
  }

  await redisClient.del(`otp:${email}`);

  const accessToken = generateAccessToken(loginUser);
  const refreshToken = generateRefreshToken(loginUser);

  await refreshTokenModel.create({
    userId: loginUser._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { userId: loginUser._id, accessToken, refreshToken };
}

module.exports = { verifyOtpService };
