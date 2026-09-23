const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const config = require('../config/env');
const { authRateLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

function validateSignupInput({ name, email, password }) {
  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return 'Name, email, and password are required';
  }

  if (name.trim().length > 60) {
    return 'Name cannot be longer than 60 characters';
  }

  if (email.trim().length > 254 || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return 'Please provide a valid email address';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    return 'Password cannot be longer than 72 bytes';
  }

  return null;
}

router.post('/signup', authRateLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const validationError = validateSignupInput({ name, email, password });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'Signup successful',
      token: createToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      message: 'Login successful',
      token: createToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
