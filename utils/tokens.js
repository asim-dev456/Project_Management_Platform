const jwt = require('jsonwebtoken');
function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.ACCESS_SECRET,
    {
      expiresIn: '2d',
    }
  );
}
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.REFRESH_SECRET,
    {
      expiresIn: '2d',
    }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
