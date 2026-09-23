const mongoose = require('mongoose');
const config = require('./env');

let connectionPromise = null;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

async function disconnectFromDatabase() {
  connectionPromise = null;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  isDatabaseReady,
};
