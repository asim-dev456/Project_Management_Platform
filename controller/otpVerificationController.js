const { verifyOtpService } = require('../services/otpVerificationService');

async function verifyOpt(req, res) {
  try {
    let result = await verifyOtpService(req.body);
    res
      .cookie('token', result.accessToken, { httpOnly: true })
      .cookie('refreshToken', result.refreshToken, { httpOnly: true })
      .json({
        message: '2FA login successful',
        accessToken: result.accessToken,
      });
  } catch (error) {
    if (error.message === 'Invalid OTP') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'OTP has expired') {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: 'Error Verifing OTP' });
  }
}
module.exports = { verifyOpt };
