const mongoose = require('mongoose');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const connectWithRetry = async () => {
  let delay = 3000;
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`MongoDB connect attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await wait(delay);
      delay = Math.min(delay * 1.5, 30000);
    }
  }
};

const connectDB = () => {
  mongoose.set('bufferTimeoutMS', 60000);

  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected — reconnecting...');
    connectWithRetry().catch(() => { });
  });
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

  connectWithRetry().catch(() => { });
};

module.exports = connectDB;
