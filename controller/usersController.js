const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');
async function users(req, res) {
  try {
    const usersData = await userModel.find().select('-password');
    res.status(200).json({ message: usersData });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, roles } = req.body;
    let checkEmail = await userModel.findOne({ email });
    if (checkEmail) {
      return res.status(400).json({ error: 'Email Already in Use' });
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    let createdUser = await userModel.create({
      name,
      email,
      password: hashedpassword,
      roles,
    });
    res.status(201).json({ message: 'User Created', id: createdUser._id });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updateUser(req, res) {
  try {
    const { name, email, password, roles } = req.body;
    let id = req.params.id;
    let checkId = await userModel.findOne({ _id: id });
    if (!checkId) {
      return res.status(400).json({ error: 'User Not Found' });
    }
    let updatedUser = await userModel.findByIdAndUpdate(id, {
      name,
      email,
      password,
      roles,
    });
    res.status(200).json({ message: 'User Updated' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function deleteUser(req, res) {
  try {
    let id = req.params.id;
    let checkId = await userModel.findOne({ _id: id });
    if (!checkId) {
      return res.status(400).json({ error: 'User Not Found' });
    }
    await userModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'User Deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
module.exports = { users, createUser, updateUser, deleteUser };
