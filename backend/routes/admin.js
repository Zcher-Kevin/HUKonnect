const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const Event = require('../models/Event');

const router = express.Router();

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const groupCount = await Group.countDocuments();
    const eventCount = await Event.countDocuments();

    // Get users by major
    const usersByMajor = await User.aggregate([
      { $group: { _id: '$major', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get groups by category
    const groupsByCategory = await Group.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get events by category
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          users: userCount,
          groups: groupCount,
          events: eventCount
        },
        distribution: {
          usersByMajor,
          groupsByCategory,
          eventsByCategory
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
      .populate('joinedGroups', 'name category')
      .populate('eventsAttending', 'title category startDate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
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

// Get all groups with details
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'firstName lastName username')
      .populate('admin', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get groups',
      error: error.message
    });
  }
});

// Get all events with details
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'firstName lastName username')
      .populate('attendees', 'firstName lastName username')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
      error: error.message
    });
  }
});

// Get recent activity (last 10 actions)
router.get('/activity', async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('firstName lastName username createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentGroups = await Group.find()
      .select('name category createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEvents = await Event.find()
      .select('title category startDate createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        recentUsers,
        recentGroups,
        recentEvents
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

// Clear all data (be careful with this!)
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
    await Group.deleteMany({});
    await Event.deleteMany({});

    res.json({
      success: true,
      message: 'All data cleared successfully'
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