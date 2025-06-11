const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.TEST_REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();
async function Connection() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}
Connection();
module.exports = redisClient;
