const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const config = require('./config/env');
const { isDatabaseReady } = require('./config/database');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers');
const requestId = require('./middleware/requestId');

const app = express();

morgan.token('request-id', (req) => req.id);
const requestLogFormat =
  config.logFormat === 'combined'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" requestId=:request-id'
    : ':method :url :status :response-time ms requestId=:request-id';

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

app.use(requestId);
app.use(
  morgan(requestLogFormat, {
    skip: () => config.nodeEnv === 'test',
  })
);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '100kb' }));
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

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
