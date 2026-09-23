const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const config = require('./config/env');
const { isDatabaseReady } = require('./config/database');

const app = express();

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

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
  res.json({
    name: 'Expense Tracker API',
    version: '1.0.0',
    status: 'available',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Expense Tracker API is running' });
});

app.get('/ready', (req, res) => {
  const ready = isDatabaseReady();
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    database: ready ? 'connected' : 'disconnected',
  });
});

app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);

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

module.exports = app;
