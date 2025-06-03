const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');

async function registerUser(req, res) {
  try {
    const { name, email, password, roles, assignedProjects } = req.body;
    // check if email already exists
    let checkEmail = await userModel.findOne({ email });
    if (checkEmail) {
      return res.status(400).json({ error: 'Email Already in Use' });
    }
    // hashpassword
    const hashpassword = await bcrypt.hash(password, 1000);
    let user = await userModel.create({
      name,
      email,
      password: hashpassword,
      roles,
      assignedProjects,
    });
    res.status(201).json({ message: 'User Registered', user: user._id });
  } catch (error) {
    return res.status(500).json({
      error: 'Error Creating User',
    });
  }
}

module.exports = registerUser;
