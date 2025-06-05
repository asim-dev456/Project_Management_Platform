const {
  createProjectService,
  deleteProjectService,
  updateProjectService,
  projectListService,
  createTaskService,
  deleteTaskService,
  updateTaskService,
  uploadTaskAttachmentService,
} = require('../services/projectAndTaskService');

async function createProject(req, res) {
  try {
    let project = await createProjectService(req.body);
    res.status(201).json({ message: 'Project Created', details: project });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteProject(req, res) {
  try {
    await deleteProjectService(req.params.id);
    res.status(200).json({ message: 'Project Deleted' });
  } catch (error) {
    if (error.message === 'Project Not Found') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateProject(req, res) {
  try {
    await updateProjectService(req.body, req.params.id);
    res.status(200).json({ message: 'Project Updated' });
  } catch (error) {
    if (error.message === 'Project Not Found') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function projectList(req, res) {
  try {
    let projects = await projectListService();
    res.status(200).json({ ProjectDetails: projects });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Tasks
async function createTask(req, res) {
  try {
    const files = req.files;
    await createTaskService(req.body, files);
    res.status(201).json({ message: 'Task Created and Assigned' });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updateTask(req, res) {
  try {
    await updateTaskService(req.body, req.params.id);
    res.status(200).json({ message: 'Task Updated' });
  } catch (error) {
    if (error.message === 'Only status field can be updated') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Task not Exists') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
async function deleteTask(req, res) {
  try {
    await deleteTaskService(req.params.id);
    res.status(200).json({ message: 'Task Deleted' });
  } catch (error) {
    if (error.message === 'Task not Exists') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Task is Not Completed Yet Please Finish the Task') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
async function uploadAttachmentController(req, res) {
  try {
    const taskId = req.params.id;
    const files = req.files;

    await uploadTaskAttachmentService(taskId, files);

    res.status(200).json({ message: 'Attachments uploaded successfully' });
  } catch (error) {
    if (error.message === 'Task not Exists') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  createProject,
  deleteProject,
  updateProject,
  projectList,
  createTask,
  updateTask,
  deleteTask,
  uploadAttachmentController,
};
