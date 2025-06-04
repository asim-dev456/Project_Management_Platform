const jwt = require('jsonwebtoken');
const refreshTokenModel = require('../model/refreashTokenModel');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/tokens');

module.exports = async function authWithAutoRefresh(req, res, next) {
  const accessToken = req.cookies.token;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name !== 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid access token' });
    }

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const existing = await refreshTokenModel.findOne({ token: refreshToken });
    if (!existing) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      const userPayload = {
        _id: decoded.id,
        roles: decoded.roles,
      };

      const newAccessToken = generateAccessToken(userPayload);
      const newRefreshToken = generateRefreshToken(userPayload);

      await refreshTokenModel.deleteOne({ token: refreshToken });
      await refreshTokenModel.create({
        userId: decoded.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.cookie('token', newAccessToken, { httpOnly: true });
      res.cookie('refreshToken', newRefreshToken, { httpOnly: true });

      req.user = jwt.verify(newAccessToken, process.env.ACCESS_SECRET);
      next();
    } catch (refreshErr) {
      return res
        .status(403)
        .json({ error: 'Refresh token expired or invalid' });
    }
  }
};
