const {
  registerUserService,
  loginUserService,
  logoutUserService,
  updateUserService,
  deleteUserService,
  patchUserService,
  adminDashBoardService,
} = require('../services/userService');

// admin dashboard
async function adminDashBoard(req, res) {
  let result = await adminDashBoardService();
  res.status(200).json({
    message: 'Admin DashBoard',
    UsersData: result.usersData,
    taskData: result.taskData,
  });
}
async function registerUser(req, res) {
  try {
    const user = await registerUserService(req.body);
    res.status(201).json({ message: 'User Registered', user: user._id });
  } catch (error) {
    if (error.message === 'Email Already in Use') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({
      error: 'Error Creating User',
    });
  }
}

async function loginUser(req, res) {
  try {
    const result = await loginUserService(req.body);
    if (result.otpSent) {
      return res.json({
        message: 'OTP sent to email. Use /api/auth/verify-otp',
      });
    }
    res
      .cookie('token', result.accessToken, { httpOnly: true })
      .cookie('refreshToken', result.refreshToken, { httpOnly: true })
      .json({ message: 'Login successful', accessToken: result.accessToken });
  } catch (error) {
    if (error.message === 'Wrong Email or Password') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error Logging User' });
  }
}

async function logOutUser(req, res) {
  await logoutUserService(req.cookies);
  res
    .clearCookie('token')
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json({ message: 'Logged out' });
}

// userCreation by Admin
async function createUser(req, res) {
  try {
    const user = await registerUserService(req.body);
    res.status(201).json({ message: 'User Registered', user: user._id });
  } catch (error) {
    if (error.message === 'Email Already in Use') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({
      error: 'Error Creating User',
    });
  }
}

// userUpdation by admin
async function updateUser(req, res) {
  try {
    await updateUserService(req.body, req.params.id);
    res.status(200).json({ message: 'User Updated' });
  } catch (error) {
    if (error.message === 'User Not Found') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// userDeletion by admin
async function deleteUser(req, res) {
  try {
    await deleteUserService(req.params.id);
    res.status(200).json({ message: 'User Deleted' });
  } catch (error) {
    if (error.message === 'User Not Found') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
// userUpdation by patch by admin

async function patchUser(req, res) {
  try {
    await patchUserService(req.body, req.params.id);
    res.status(200).json({ message: 'User Updated' });
  } catch (error) {
    if (error.message === 'User Not Found') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
module.exports = {
  registerUser,
  loginUser,
  logOutUser,
  createUser,
  updateUser,
  deleteUser,
  patchUser,
  adminDashBoard,
};
