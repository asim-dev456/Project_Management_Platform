const projectModel = require('../model/projectModel');

async function createProject(req, res) {
  try {
    const { title, description, createdby, assignedUsers } = req.body;
    const project = await projectModel.create({
      title,
      description,
      createdby,
      assignedUsers,
    });
    res.status(201).json({ message: 'Project Created', details: project });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
async function deleteProject(req, res) {
  try {
    let id = req.params.id;
    let checkId = await projectModel.findOne({ _id: id });
    if (!checkId) {
      return res.status(400).json({ error: 'Project Not Found' });
    }
    await projectModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Project Deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateProject(req, res) {
  try {
    const { title, description, createdby, assignedUsers } = req.body;
    let id = req.params.id;
    let checkId = await projectModel.findOne({ _id: id });
    if (!checkId) {
      return res.status(400).json({ error: 'Project Not Found' });
    }
    await projectModel.findByIdAndUpdate(id, {
      title,
      description,
      createdby,
      assignedUsers,
    });
    res.status(200).json({ message: 'Project Updated' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function projectList(req, res) {
  try {
    let projects = await projectModel.find();
    res.status(200).json({ ProjectDetails: projects });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
module.exports = { createProject, deleteProject, updateProject, projectList };
