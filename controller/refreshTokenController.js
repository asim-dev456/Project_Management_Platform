const { refreshTokenService } = require('../services/refreshTokenService');

async function refreshToken(req, res) {
  try {
    const result = await refreshTokenService(req.cookies);
    res
      .cookie('token', result.newAccessToken, { httpOnly: true })
      .cookie('refreshToken', result.newRefreshToken, { httpOnly: true })
      .json({ accessToken: result.newAccessToken });
  } catch (error) {
    if (error.message === 'No token provided') {
      return res.status(401).json({ error: error.message });
    }
    if (error.message === 'Invalid token') {
      return res.status(403).json({ error: error.message });
    }
    res.status(403).json({ error: 'Token expired or invalid' });
  }
}
module.exports = { refreshToken };
