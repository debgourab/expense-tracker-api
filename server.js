const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const config = require('./config/env');

const app = express();

let mongoConnectionPromise = null;

function buildCorsOptions() {
  if (config.clientOrigins.length === 0) {
    return {};
  }

  return {
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS'));
    },
  };
}

function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (mongoose.connection.readyState !== 2 || !mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(config.mongoUri);
  }

  return mongoConnectionPromise;
}

async function requireDatabase(req, res, next) {
  try {
    await connectToDatabase();
    return next();
  } catch (error) {
    mongoConnectionPromise = null;
    return next(error);
  }
}

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Expense Tracker API is running' });
});

app.use('/auth', requireDatabase, authRoutes);
app.use('/expenses', requireDatabase, expenseRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  if (err.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }

  return res.status(500).json({ message: 'Something went wrong on the server' });
});

async function startServer() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
