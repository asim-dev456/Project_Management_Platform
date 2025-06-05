const mongoose = require('mongoose');

async function healthCheck(req, res) {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    server: {
      uptime: process.uptime().toFixed(0) + 's',
      memoryUsage: process.memoryUsage().rss,
      timestamp: new Date().toISOString(),
    },
    database: {
      status: mongoStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
  });
}

module.exports = { healthCheck };
