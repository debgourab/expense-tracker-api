const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });
    const user = await User.findById(decoded.sub).select('name email');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    req.userId = user._id;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
