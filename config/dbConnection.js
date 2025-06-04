const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    await mongoose.connect(process.env.DB_URI);
    isConnected = true;
    console.log('Database Connected');
  } catch (error) {
    console.error('Error Connecting to Database:', error);
    process.exit(1);
  }
}

module.exports = connectDB;
