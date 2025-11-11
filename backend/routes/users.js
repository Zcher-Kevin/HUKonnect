const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('joinedGroups', 'name category')
      .populate('eventsAttending', 'title startDate location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
  // Allow these profile fields to be updated from the mobile client.
  // Expanded to include minor, dob, gender and termsAccepted which the
  // frontend may send from the Create Account screen.
  const allowedUpdates = ['firstName', 'lastName', 'major', 'minor', 'year', 'dob', 'gender', 'bio', 'interests', 'termsAccepted', 'schedule'];
    const updates = {};

    // Only include allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Map `dob` (frontend) to the `birthDate` field in the model.
    if (updates.dob) {
      const parsed = new Date(updates.dob);
      if (!isNaN(parsed.getTime())) {
        updates.birthDate = parsed;
      }
      delete updates.dob;
    }

    // Sanitize schedule if provided: ensure an array of simple objects with expected fields.
    if (updates.schedule && Array.isArray(updates.schedule)) {
      try {
        updates.schedule = updates.schedule.map(item => {
          const clean = {};
          clean.id = item.id ? String(item.id) : `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
          clean.title = item.title ? String(item.title).slice(0, 200) : 'Untitled';
          clean.color = item.color ? String(item.color) : '#CFE2FF';
          clean.startMins = Number(item.startMins) || 0;
          clean.endMins = Number(item.endMins) || 0;
          clean.recurrence = item.recurrence === 'once' ? 'once' : 'weekly';
          if (typeof item.dayIdx === 'number') clean.dayIdx = item.dayIdx;
          if (item.date) clean.date = String(item.date);
          return clean;
        });
      } catch (e) {
        // If sanitization fails, remove schedule update to avoid breaking validation
        delete updates.schedule;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Get all users (for search/discovery)
router.get('/search', auth, async (req, res) => {
  try {
    const { query, major, year, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let searchQuery = { isActive: true };

    // Add text search if query is provided
    if (query) {
      searchQuery.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ];
    }

    // Add filters
    if (major) {
      searchQuery.major = { $regex: major, $options: 'i' };
    }

    if (year) {
      searchQuery.year = year;
    }

    const users = await User.find(searchQuery)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('joinedGroups', 'name category')
      .populate('eventsAttending', 'title startDate location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

module.exports = router;