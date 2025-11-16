const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Export router
module.exports = router;

// Register new user
router.post(
  '/register',
  [
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('username')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName').optional({ checkFalsy: true }).trim(),
    body('lastName').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      // DEV: log incoming body and content-type to help debug missing fields
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('[auth.register] incoming content-type:', req.get('content-type'));
          console.log('[auth.register] req.body keys:', Object.keys(req.body));
          // Print a trimmed body for visibility
          const debugBody = Object.assign({}, req.body);
          if (debugBody.password) debugBody.password = '<<REDACTED>>';
          console.log('[auth.register] body (debug):', JSON.stringify(debugBody));
        } catch (e) {}
      }

      let { username, email, password, firstName, lastName, major, year, yearOfStudy, bio } = req.body;

      // Normalize year input: accept numeric (1-4), strings like 'master'/'phd',
      // or the allowed enum values. Translate to our schema enum.
      const normalizeYear = (v) => {
        if (!v && v !== 0) return undefined;
        const s = String(v).trim().toLowerCase();
        // map common inputs to canonical stored values
        if (['1', 'one', 'freshman', 'first', 'f'].includes(s)) return 'one';
        if (['2', 'two', 'sophomore', 'second', 's'].includes(s)) return 'two';
        if (['3', 'three', 'junior', 'third', 'j'].includes(s)) return 'three';
        if (['4', 'four', 'senior', 'fourth', 'sr', 'sen'].includes(s)) return 'four';
        if (['master', "master's", 'masters', 'm'].includes(s)) return 'master';
        if (['phd', 'doctor', 'doctoral', 'dr'].includes(s)) return 'phd';
        if (['other', 'unspecified', 'none'].includes(s)) return 'other';
        // If it's already one of our canonical strings, return it normalized
        const canonical = ['one', 'two', 'three', 'four', 'master', 'phd', 'other'];
        if (canonical.includes(s)) return s;
        return undefined;
      };

      // prefer explicit yearOfStudy, fall back to legacy `year` field
      const normalizedYear = normalizeYear(yearOfStudy || year);

      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('[auth.register] normalize debug:', { year, yearOfStudy, normalizedYear });
        } catch (e) {}
      }

      // Check if user already exists by email or username (if provided)
      const orQuery = [];
      if (email) orQuery.push({ email });
      if (username) orQuery.push({ username });
      if (orQuery.length) {
        const existingUser = await User.findOne({ $or: orQuery });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'User with this email or username already exists',
          });
        }
      }

      // If username not provided, derive from email or generate a fallback
      if (!username) {
        const localBase = email ? email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '') : 'user';
        let candidate = `${localBase}-${Date.now().toString().slice(-4)}`;
        // Ensure uniqueness (simple loop; should be rare)
        let exists = await User.findOne({ username: candidate });
        let counter = 1;
        while (exists) {
          candidate = `${localBase}-${Date.now().toString().slice(-4)}-${counter}`;
          exists = await User.findOne({ username: candidate });
          counter += 1;
          if (counter > 10) break;
        }
        username = candidate;
      }

      // Create new user object and include password for hashing
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

      // Determine token expiry: if client requested a long-lived session
      // via `remember` flag use 30 days; otherwise fall back to env or 7d.
      const tokenExpiry = req.body && req.body.remember ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: tokenExpiry }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      console.error('Registration error:', error);
      // Mongoose duplicate key error handling
      if (error && error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Email or username already in use' });
      }
      res.status(500).json({ success: false, message: 'Failed to register user', error: error.message });
    }
  }
);

// Login user
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

  // Update last login (store in `lastlogin` to match schema).
  // Use an update operation to avoid triggering full document validation
  // errors if the running schema differs from stored documents.
  try {
    await User.updateOne({ _id: user._id }, { $set: { lastlogin: new Date() } });
  } catch (e) {
    console.error('Failed to update lastlogin via updateOne, falling back to save:', e);
    // Fallback: try saving but disable validation to avoid enum mismatches
    try {
      await user.save({ validateBeforeSave: false });
    } catch (err2) {
      console.error('Fallback save failed:', err2);
      // Continue without failing login - lastlogin is best-effort
    }
  }

    // Determine token expiry: honor `remember` flag from client for longer
    // lived sessions (30 days). Otherwise, use configured env or 7 days.
    const tokenExpiry = req.body && req.body.remember ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: tokenExpiry }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Compute whether the user still needs to complete profile
    const needsProfile = !user.username || !user.firstName || !user.lastName;

    res.json({
      success: true,
      user: user.toPublicJSON(),
      needsProfile
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});
