const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
      },
    ],
  },
  { timestamps: true }
);

const projectModel = mongoose.model('project', projectSchema);

module.exports = projectModel;
