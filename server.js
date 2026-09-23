const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const config = require('./config/env');
const { connectToDatabase, disconnectFromDatabase } = require('./config/database');

async function startServer() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });

    async function shutdown(signal) {
      console.log(`${signal} received. Closing the server gracefully.`);

      server.close(async () => {
        await disconnectFromDatabase();
        process.exit(0);
      });
    }

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();
