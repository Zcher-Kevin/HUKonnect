const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token. jwt.verify will throw for malformed tokens; catch that
    // specific error and return a concise 401 without printing a full stack
    // to server logs (which can be noisy for many malformed requests).
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      // Log minimal info: method + url + error message (do NOT log token)
      console.warn(`[auth] jwt verify failed for ${req.method} ${req.originalUrl}: ${err.message}`);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Add user id to request
    req.userId = decoded.userId;
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = auth;