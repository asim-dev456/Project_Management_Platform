const mongoose = require('mongoose');
var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validateEmail, 'Please fill a valid email address'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: String,
      enum: ['admin', 'manager', 'user'],
      default: 'user',
    },
    assignedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
      },
    ],
  },
  { timestamps: true }
);

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
