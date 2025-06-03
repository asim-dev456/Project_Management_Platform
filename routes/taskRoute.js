const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const { createTask, updateTask } = require('../controller/tasksController');
const router = express.Router();

router.post(
  '/create-task',
  authenticateToken,
  authorizeRoles('manager'),
  createTask
);
router.patch(
  '/update-task/:id',
  authenticateToken,
  authorizeRoles('user'),
  updateTask
);
module.exports = router;
