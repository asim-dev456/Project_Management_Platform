const refreshTokenModel = require('../model/refreashTokenModel');
const jwt = require('jsonwebtoken');
const {
  generateRefreshToken,
  generateAccessToken,
} = require('../utils/tokens');

async function tokenRefresh(req, res) {
  const { refreshToken } = req.cookies;
  if (!refreshToken)
    return res.status(401).json({ error: 'No token provided' });

  const existing = await refreshTokenModel.findOne({ token: refreshToken });
  if (!existing) return res.status(403).json({ error: 'Invalid token' });

  try {
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

    res
      .cookie('token', newAccessToken, { httpOnly: true })
      .cookie('refreshToken', newRefreshToken, { httpOnly: true })
      .json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Token expired or invalid' });
  }
}
module.exports = tokenRefresh;
