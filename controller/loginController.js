const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');

const transporter = require('../utils/nodeMailer.js');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/tokens');
const otpModel = require('../model/otpModel.js');
const refreshTokenModel = require('../model/refreashTokenModel.js');
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    let user = await userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Wrong Email or Password' });
    }

    let generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    if (user.roles === 'admin') {
      await otpModel.deleteMany({ email });
      await otpModel.create({
        email,
        otp: generatedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Your OTP',
        text: `Your login OTP is ${generatedOtp}`,
      });
      return res.json({ message: 'OTP sent to email. Use /verify-otp' });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //store refresh token in db
    await refreshTokenModel.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    res
      .cookie('token', accessToken, { httpOnly: true })
      .cookie('refreshToken', refreshToken, { httpOnly: true })
      .json({ message: 'Login successful', accessToken });
  } catch (error) {
    return res.status(500).json({ error: 'Error Logging User' });
  }
}
module.exports = loginUser;
