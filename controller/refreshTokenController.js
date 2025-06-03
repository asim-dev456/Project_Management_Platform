const refreshTokenModel = require('../model/refreashTokenModel');
const { generateRefreshToken } = require('../utils/tokens');

async function tokenRefresh(req, res) {
  const { refreshToken } = req.signedCookies;
  if (!refreshToken)
    return res.status(401).json({ error: 'No token provided' });
  const existing = await refreshTokenModel.findOne({ token: refreshToken });
  if (!existing) return res.status(403).json({ error: 'Invalid token' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const newRefreshToken = generateRefreshToken(decoded._id);
    await refreshTokenModel.deleteOne({ token: refreshToken });
    await refreshTokenModel.create({
      userId: decoded.userId,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    res
      .cookie('accessToken', newAccessToken, { httpOnly: true })
      .cookie('refreshToken', newRefreshToken, { httpOnly: true })
      .json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Token expired or invalid' });
  }
}
module.exports = tokenRefresh;
