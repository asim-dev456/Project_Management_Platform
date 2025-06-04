const express = require('express');
const {
  registerUser,
  loginUser,
  logOutUser,
  createUser,
  updateUser,
  deleteUser,
  patchUser,
  adminDashBoard,
} = require('../controller/registrationController.js');
const { refreshToken } = require('../controller/refreshTokenController.js');

const authenticateToken = require('../middleware/authenticateToken.js');
const authorizeRoles = require('../middleware/authorizeRoles.js');

const { verifyOpt } = require('../controller/otpVerificationController.js');

const router = express.Router();

const {
  createProject,
  deleteProject,
  updateProject,
  projectList,
  createTask,
  updateTask,
  deleteTask,
} = require('../controller/projectController');

router.post(
  '/projects/create',
  authenticateToken,
  authorizeRoles('manager'),
  createProject
);
router.delete(
  '/projects/delete/:id',
  authenticateToken,
  authorizeRoles('manager'),
  deleteProject
);
router.put(
  '/projects/update/:id',
  authenticateToken,
  authorizeRoles('manager'),
  updateProject
);
router.get(
  '/projects/list',
  authenticateToken,
  authorizeRoles('manager'),
  projectList
);
router.post(
  '/tasks/create',
  authenticateToken,
  authorizeRoles('manager'),
  createTask
);
router.patch(
  '/tasks/update/:id',
  authenticateToken,
  authorizeRoles('user'),
  updateTask
);
router.delete(
  '/tasks/delete/:id',
  authenticateToken,
  authorizeRoles('manager'),
  deleteTask
);
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/logout', logOutUser);

router.get(
  '/admin/dashboard',
  authenticateToken,
  authorizeRoles('admin'),
  adminDashBoard
);

router.post(
  '/users/create',
  authenticateToken,
  authorizeRoles('admin'),
  createUser
);
router.put(
  '/users/update/:id',
  authenticateToken,
  authorizeRoles('admin'),
  updateUser
);
router.delete(
  '/users/delete/:id',
  authenticateToken,
  authorizeRoles('admin'),
  deleteUser
);
router.patch(
  '/users/patch/:id',
  authenticateToken,
  authorizeRoles('admin'),
  patchUser
);
router.post('/auth/refresh-token', refreshToken);
router.post('/auth/verify-otp', verifyOpt);
module.exports = router;
