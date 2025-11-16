const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Get database statistics (users only)
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();

    // Get users by major
    const usersByMajor = await User.aggregate([
      { $group: { _id: '$major', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          users: userCount
        },
        distribution: {
          usersByMajor
        }
      }
    });
  } catch (error) {
    console.error('Database stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database statistics',
      error: error.message
    });
  }
});

// Get all users with basic info
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    // map to public shape
    const publicUsers = users.map(u => u.toPublicJSON ? u.toPublicJSON() : u);

    res.json({
      success: true,
      data: publicUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Get recent activity (users only)
router.get('/activity', async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('firstName lastName username createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
      error: error.message
    });
  }
});

// Clear all user data (be careful with this!)
router.delete('/clear-all', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'YES_DELETE_ALL') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Send {"confirm": "YES_DELETE_ALL"} to proceed.'
      });
    }

    await User.deleteMany({});

    res.json({
      success: true,
      message: 'All user data cleared successfully'
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear data',
      error: error.message
    });
  }
});

module.exports = router;