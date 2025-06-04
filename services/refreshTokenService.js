const refreshTokenModel = require('../model/refreashTokenModel');
const jwt = require('jsonwebtoken');
const {
  generateRefreshToken,
  generateAccessToken,
} = require('../utils/tokens');

async function refreshTokenService({ refreshToken }) {
  if (!refreshToken) {
    throw new Error('No token provided');
  }
  const existing = await refreshTokenModel.findOne({ token: refreshToken });
  if (!existing) {
    throw new Error('Invalid token');
  }
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  const userPayload = { _id: decoded.id, roles: decoded.roles };

  const newRefreshToken = generateRefreshToken(userPayload);
  const newAccessToken = generateAccessToken(userPayload);

  // replace old token
  await refreshTokenModel.deleteOne({ token: refreshToken });
  await refreshTokenModel.create({
    userId: decoded.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return { userId: decoded.id, newAccessToken, newRefreshToken };
}

module.exports = { refreshTokenService };
