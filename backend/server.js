const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
let server;
let io;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compression
app.use(limiter); // Rate limiting
// During development allow flexible origins so web (localhost), Expo and
// other dev clients can reach the API. In production you should lock this
// down to specific trusted origins.
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev ? true : ['http://localhost:8081', 'exp://192.168.1.1:8081'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hukonnect';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'HUKonnect Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Short-lived request logger for debugging route issues. This logs method,
// path, remote IP and whether an Authorization header was provided. It
// intentionally does not log the token value to avoid leaking secrets.
app.use((req, res, next) => {
  try {
    const hasAuth = Boolean(req.headers && (req.headers.authorization || req.headers.Authorization));
    console.log(`[req] ${req.ip} ${req.method} ${req.originalUrl} auth:${hasAuth}`);
  } catch (e) {}
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend connection successful!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Import and use route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
// Groups and Events features have been permanently removed.
// The routes and models were intentionally deleted as part of the
// dataset reduction to only retain `User` and `Message` collections.
const adminRoutes = require('./routes/admin');

// Compatibility shim: accept legacy client calls to /api/users/me/profile
// and rewrite them to /api/users/profile. This is a small development-only
// convenience to avoid 404s from older client bundles while we update apps.
app.use((req, res, next) => {
  try {
    if (req.originalUrl && req.originalUrl.includes('/api/users/me/profile')) {
      req.url = req.url.replace('/me/profile', '/profile');
    }
  } catch (e) {}
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Attach messages routes (depends on Socket.IO for broadcasts)
const messagesRoutes = require('./routes/messages');
app.use('/api', messagesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close().then(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Create raw http server and attach socket.io for real-time messaging
server = http.createServer(app);

try {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: isDev ? true : ['http://localhost:8081'],
      methods: ['GET', 'POST']
    }
  });

  // Socket auth: expect token via auth.token (Bearer or raw)
  io.use(async (socket, next) => {
    try {
      const tokenRaw = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!tokenRaw) return next(new Error('Auth token required'));
      const token = String(tokenRaw).replace(/^Bearer\s+/i, '');
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      // store user id on socket
      socket.userId = decoded.userId;
      // join a user-specific room for targeted emits
      socket.join(`user:${decoded.userId}`);
      return next();
    } catch (e) {
      console.warn('Socket auth failed:', e.message || e);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    try {
      console.log('Socket connected user:', socket.userId);

      socket.on('disconnect', () => {
        // leaving room is automatic
      });
    } catch (e) {
      console.warn('Socket connection handler failed:', e.message || e);
    }
  });

  // Make io available to routes via app.get('io')
  app.set('io', io);
} catch (e) {
  console.warn('Socket.IO not available:', e.message || e);
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };