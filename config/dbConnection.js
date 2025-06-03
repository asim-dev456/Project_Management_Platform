const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Database Connected');
  } catch (error) {
    console.log('Error Connecting Database ', error);
  }
}

module.exports = connectDB;
