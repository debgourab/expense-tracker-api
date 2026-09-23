const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/expense-tracker';
const DEFAULT_JWT_SECRET = 'development-secret-change-me';

const isHostedRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

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

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: requireInHostedRuntime('MONGO_URI', DEFAULT_MONGO_URI),
  jwtSecret: requireInHostedRuntime('JWT_SECRET', DEFAULT_JWT_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
};
