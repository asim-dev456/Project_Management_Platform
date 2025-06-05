const projectModel = require('../model/projectModel');
const taskModel = require('../model/taskModel');
const path = require('path');
const fs = require('fs/promises');

async function createProjectService({
  title,
  description,
  createdby,
  assignedUsers,
}) {
  const project = await projectModel.create({
    title,
    description,
    createdby,
    assignedUsers,
  });
  return project;
}
async function deleteProjectService(id) {
  let checkId = await projectModel.findOne({ _id: id });
  if (!checkId) {
    throw new Error('Project Not Found');
  }
  await projectModel.findByIdAndDelete(id);
}

async function updateProjectService(
  { title, description, createdby, assignedUsers },
  id
) {
  let checkId = await projectModel.findOne({ _id: id });
  if (!checkId) {
    throw new Error('Project Not Found');
  }
  await projectModel.findByIdAndUpdate(id, {
    title,
    description,
    createdby,
    assignedUsers,
  });
}
async function projectListService() {
  let projects = await projectModel.find();
  return projects;
}
async function createTaskService(
  { title, description, status, project, assignedTo },
  attachments
) {
  const uploadFolder = path.join(__dirname, '../uploads');
  const savedFiles = [];
  for (const file of attachments) {
    const fileName = `${Date.now()}-${file.originalname}`;
    const fullPath = path.join(uploadFolder, fileName);
    await fs.writeFile(fullPath, file.buffer);
    savedFiles.push(`/uploads/${fileName}`);
  }
  await taskModel.create({
    title,
    description,
    status,
    project,
    assignedTo,
    attachments: savedFiles,
  });
}
async function updateTaskService({ status, ...others }, id) {
  if (Object.keys(others).length > 0) {
    throw new Error('Only status field can be updated');
  }
  let checkId = await taskModel.findOne({ _id: id });
  if (!checkId) {
    throw new Error('Task not Exists');
  }
  await taskModel.findByIdAndUpdate(id, {
    status,
  });
}
async function uploadTaskAttachmentService(taskId, files) {
  const task = await taskModel.findById(taskId);
  if (!task) {
    throw new Error('Task not Exists');
  }
  const uploadFolder = path.join(__dirname, '../uploads');
  const savedFiles = [];
  for (const file of files) {
    const fileName = `${Date.now()}-${file.originalname}`;
    const fullPath = path.join(uploadFolder, fileName);
    await fs.writeFile(fullPath, file.buffer);
    savedFiles.push(`/uploads/${fileName}`);
  }
  task.attachments.push(...savedFiles);
  await task.save();
}

async function deleteTaskService(id) {
  let checkId = await taskModel.findOne({ _id: id });
  if (!checkId) {
    throw new Error('Task not Exists');
  }
  if (checkId.status == 'todo' || checkId.status == 'in-progress') {
    throw new Error('Task is Not Completed Yet Please Finish the Task');
  }
  await taskModel.findByIdAndDelete(id);
}
module.exports = {
  createProjectService,
  deleteProjectService,
  updateProjectService,
  projectListService,
  createTaskService,
  updateTaskService,
  deleteTaskService,
  uploadTaskAttachmentService,
};
