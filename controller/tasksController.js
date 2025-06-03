const taskModel = require('../model/taskModel');

async function createTask(req, res) {
  try {
    const { title, description, status, project, assignedTo } = req.body;
    let task = await taskModel.create({
      title,
      description,
      status,
      project,
      assignedTo,
    });
    res.status(201).json({ message: 'Task Created and Assigned' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

//update task updated by user status of the task
async function updateTask(req, res) {
  try {
    const { status } = req.body;
    let id = req.params.id;
    let checkId = await taskModel.findOne({ _id: id });
    if (!checkId) {
      return res.status(400).json({ error: 'Task not Exists' });
    }
    let updatedTaask = await taskModel.findByIdAndUpdate(id, {
      status,
    });
    res.status(200).json({ message: 'Task Updated' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
//delete task deleted by manager and only when assigned task status is done

async function deleteTask(req, res) {
  try {
    let id = req.params.id;
    let checkId = await taskModel.findOne({ _id: id });
    if (!checkId) {
      return res.status(400).json({ error: 'Task not Exists' });
    }
    if (checkId.status == 'todo' || checkId.status == 'in-progress') {
      return res
        .status(400)
        .json({ error: 'Task is Not Completed Yet Please Finish the Task' });
    }
    await taskModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Task Deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
module.exports = { createTask, updateTask, deleteTask };
