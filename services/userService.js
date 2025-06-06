const userModel = require('../model/userModel');
const taskModel = require('../model/taskModel');
const refreshTokenModel = require('../model/refreashTokenModel');
const bcrypt = require('bcrypt');
const transporter = require('../utils/nodeMailer.js');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/tokens');
const redisClient = require('../config/redisServer.js');

//register user
async function registerUserService({ name, email, password, roles }) {
  let checkEmail = await userModel.findOne({ email });
  if (checkEmail) {
    throw new Error('Email Already in Use');
  }
  //hashPassword
  const hashedpassword = await bcrypt.hash(password, 10);
  let user = await userModel.create({
    name,
    email,
    password: hashedpassword,
    roles,
    assignedProjects,
  });
  return user;
}

// login user

async function loginUserService({ email, password }) {
  let user = await userModel.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Wrong Email or Password');
  }

  let generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  if (user.roles === 'admin') {
    await redisClient.setEx(`otp:${email}`, 60, generatedOtp);

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Your OTP',
      text: `Your login OTP is ${generatedOtp}`,
    });

    return { otpSent: true };
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await refreshTokenModel.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { userId: user._id, accessToken, refreshToken };
}

// logOut User
async function logoutUserService({ refreshToken }) {
  await refreshTokenModel.deleteOne({ token: refreshToken });
}

// update user
async function updateUserService({ name, email, password, roles }, id) {
  let checkId = await userModel.findOne({ _id: id });
  if (!checkId) {
    throw new Error('User Not Found');
  }
  await userModel.findByIdAndUpdate(id, {
    name,
    email,
    password,
    roles,
  });
}

// delete user
async function deleteUserService(id) {
  let checkId = await userModel.findOne({ _id: id });
  if (!checkId) {
    throw new Error('User Not Found');
  }
  await userModel.findByIdAndDelete(id);
}

// patch User

async function patchUserService({ assignedProjects }, id) {
  let checkId = await userModel.findOne({ _id: id });
  if (!checkId) {
    throw new Error('User Not Found');
  }
  await userModel.findByIdAndUpdate(id, {
    assignedProjects,
  });
}

// admin Dashboard

async function adminDashBoardService() {
  try {
    const cached = await redisClient.get('dashboardData');
    if (cached) {
      console.log('Serving from cache');
      return JSON.parse(cached);
    }

    let usersData = await userModel
      .find()
      .select('-password -_id -__v')
      .populate({
        path: 'assignedProjects',
        select: '-_id -__v',
        populate: [
          { path: 'createdby', select: 'name email -_id' },
          { path: 'assignedUsers', select: 'name email -_id' },
        ],
      });

    let taskData = await taskModel
      .find()
      .select('-_id -__v')
      .populate([
        { path: 'project', select: 'title description -_id' },
        { path: 'assignedTo', select: 'name email -_id' },
      ]);

    const dashboardData = { usersData, taskData };

    await redisClient.setEx('dashboardData', 30, JSON.stringify(dashboardData));

    return dashboardData;
  } catch (error) {
    console.error('Error in adminDashBoardService:', error);
    throw error;
  }
}

module.exports = {
  registerUserService,
  loginUserService,
  logoutUserService,
  updateUserService,
  deleteUserService,
  patchUserService,
  adminDashBoardService,
};
