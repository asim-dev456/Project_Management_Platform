const jwt = require('jsonwebtoken');
function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.ACCESS_SECRET,
    {
      expiresIn: '15m',
    }
  );
}
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
