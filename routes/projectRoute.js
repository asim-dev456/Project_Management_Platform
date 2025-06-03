const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  createProject,
  deleteProject,
  updateProject,
  projectList,
} = require('../controller/projectController');
const router = express.Router();

router.post(
  '/create-project',
  authenticateToken,
  authorizeRoles('manager'),
  createProject
);
router.delete(
  '/delete-project/:id',
  authenticateToken,
  authorizeRoles('manager'),
  deleteProject
);
router.put(
  '/update-project/:id',
  authenticateToken,
  authorizeRoles('manager'),
  updateProject
);
router.get(
  '/projects-list',
  authenticateToken,
  authorizeRoles('manager'),
  projectList
);
module.exports = router;
