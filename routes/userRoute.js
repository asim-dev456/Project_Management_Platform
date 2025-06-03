const express = require('express');
const registerUser = require('../controller/registrationController.js');
const loginUser = require('../controller/loginController.js');
const userProfile = require('../controller/userProfile.js');
const authenticateToken = require('../middleware/authenticateToken.js');
const authorizeRoles = require('../middleware/authorizeRoles.js');
const adminDashBoard = require('../controller/adminDashBoard.js');
const verifyOpt = require('../controller/otpVerificationController.js');

const tokenRefresh = require('../controller/refreshTokenController.js');
const logOut = require('../controller/logOutController.js');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logOut);
router.get('/profile', authenticateToken, userProfile);
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles('admin'),
  adminDashBoard
);
router.get('/profile/:id', authenticateToken, userProfile);

router.post('/refresh-token', tokenRefresh);
router.post('/verify-otp', verifyOpt);
module.exports = router;
