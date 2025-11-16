const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../lib/asyncHandler');
const { sendError } = require('../lib/errorResponse');

const router = express.Router();

function normalizeYearOfStudy(v) {
  if (!v && v !== 0) return undefined;
  const s = String(v).trim().toLowerCase();
  if (['1', 'one', 'freshman', 'first', 'f'].includes(s)) return 'one';
  if (['2', 'two', 'sophomore', 'second', 's'].includes(s)) return 'two';
  if (['3', 'three', 'junior', 'third', 'j'].includes(s)) return 'three';
  if (['4', 'four', 'senior', 'fourth', 'sr', 'sen'].includes(s)) return 'four';
  if (['master', "master's", 'masters', 'm'].includes(s)) return 'master';
  if (['phd', 'doctor', 'doctoral', 'dr'].includes(s)) return 'phd';
  if (['other', 'unspecified', 'none'].includes(s)) return 'other';
  const canonical = ['one', 'two', 'three', 'four', 'master', 'phd', 'other'];
  if (canonical.includes(s)) return s;
  return undefined;
}

// Register
router.post(
  '/register',
  [
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('username').optional({ checkFalsy: true }).trim().isLength({ min: 3, max: 30 }),
    body('password').isLength({ min: 6 }),
    body('firstName').optional({ checkFalsy: true }).trim(),
    body('lastName').optional({ checkFalsy: true }).trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());

    let { username, email, password, firstName, lastName, major, year, yearOfStudy, bio } = req.body;
    const normalizedYear = normalizeYearOfStudy(yearOfStudy || year);

    const orQuery = [];
    if (email) orQuery.push({ email });
    if (username) orQuery.push({ username });
    if (orQuery.length) {
      const existingUser = await User.findOne({ $or: orQuery });
      if (existingUser) return sendError(res, 400, 'User with this email or username already exists');
    }

    if (!username) {
      const localBase = email ? email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '') : 'user';
      let candidate = `${localBase}-${Date.now().toString().slice(-4)}`;
      let exists = await User.findOne({ username: candidate });
      let counter = 1;
      while (exists && counter <= 10) {
        candidate = `${localBase}-${Date.now().toString().slice(-4)}-${counter}`;
        exists = await User.findOne({ username: candidate });
        counter += 1;
      }
      username = candidate;
    }

    const user = new User({
      username,
      email: email || undefined,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      major,
      yearOfStudy: normalizedYear,
      bio,
      authProvider: 'local',
    });

    await user.save();

    const tokenExpiry = req.body && req.body.remember ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: tokenExpiry });

    return res.status(201).json({ success: true, message: 'User registered successfully', token, user: user.toPublicJSON() });
  })
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 400, 'Validation failed', errors.array());

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 401, 'Invalid credentials');

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) return sendError(res, 401, 'Invalid credentials');

    // Best-effort last login update
    try {
      await User.updateOne({ _id: user._id }, { $set: { lastlogin: new Date() } });
    } catch (e) {
      try { await user.save({ validateBeforeSave: false }); } catch (e2) { /* ignore */ }
    }

    const tokenExpiry = req.body && req.body.remember ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: tokenExpiry });
    return res.json({ success: true, message: 'Login successful', token, user: user.toPublicJSON() });
  })
);

// Verify token
router.get('/verify', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return sendError(res, 401, 'No token provided');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);
    if (!user) return sendError(res, 401, 'Invalid token');
    const needsProfile = !user.username || !user.firstName || !user.lastName;
    return res.json({ success: true, user: user.toPublicJSON(), needsProfile });
  } catch (err) {
    return sendError(res, 401, 'Invalid token');
  }
}));

module.exports = router;
