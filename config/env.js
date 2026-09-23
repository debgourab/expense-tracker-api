const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/expense-tracker';
const DEFAULT_JWT_SECRET = 'development-secret-change-me';

const nodeEnv = process.env.NODE_ENV || 'development';
const isHostedRuntime =
  nodeEnv === 'production' || process.env.RENDER === 'true' || process.env.VERCEL === '1';

function requireInHostedRuntime(name, fallback) {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (isHostedRuntime) {
    throw new Error(`${name} is required in production or on Vercel`);
  }

  return fallback;
}

function parseOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parsePort(value) {
  const port = Number(value || 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

const jwtSecret = requireInHostedRuntime('JWT_SECRET', DEFAULT_JWT_SECRET);
const clientOrigins = parseOrigins(process.env.CLIENT_ORIGIN);

if (isHostedRuntime && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in hosted environments');
}

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env.PORT),
  mongoUri: requireInHostedRuntime('MONGO_URI', DEFAULT_MONGO_URI),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtIssuer: process.env.JWT_ISSUER || 'expense-tracker-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'expense-tracker-client',
  clientOrigins,
  logFormat: process.env.LOG_FORMAT || (nodeEnv === 'production' ? 'combined' : 'dev'),
  trustProxy: nodeEnv === 'production' ? 1 : false,
};
