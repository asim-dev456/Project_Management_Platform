const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { String, required: true },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
      required: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);
const taskModel = mongoose.model('task', taskSchema);
module.exports = taskModel;
