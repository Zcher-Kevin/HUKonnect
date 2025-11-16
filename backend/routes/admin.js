const express = require('express');
const User = require('../models/User');
const asyncHandler = require('../lib/asyncHandler');
const { sendError } = require('../lib/errorResponse');

const router = express.Router();

// Get database statistics (users only)
router.get('/stats', asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  const usersByMajor = await User.aggregate([
    { $group: { _id: '$major', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  res.json({ success: true, data: { totals: { users: userCount }, distribution: { usersByMajor } } });
}));

// Get all users with basic info
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  const publicUsers = users.map(u => u.toPublicJSON ? u.toPublicJSON() : u);
  res.json({ success: true, data: publicUsers });
}));

// Get recent activity (users only)
router.get('/activity', asyncHandler(async (req, res) => {
  const recentUsers = await User.find().select('firstName lastName username createdAt').sort({ createdAt: -1 }).limit(10);
  res.json({ success: true, data: { recentUsers } });
}));

// Clear all user data (be careful with this!)
router.delete('/clear-all', asyncHandler(async (req, res) => {
  const { confirm } = req.body;
  if (confirm !== 'YES_DELETE_ALL') return sendError(res, 400, 'Confirmation required. Send {"confirm": "YES_DELETE_ALL"} to proceed.');
  await User.deleteMany({});
  res.json({ success: true, message: 'All user data cleared successfully' });
}));

module.exports = router;