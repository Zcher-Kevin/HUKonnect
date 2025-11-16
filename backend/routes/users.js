const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

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
    // (debug log removed)
  // Allow these profile fields to be updated from the mobile client.
  // Expanded to include minor, dob, gender and termsAccepted which the
  // frontend may send from the Create Account screen.
  const allowedUpdates = ['firstName', 'lastName', 'major', 'minor', 'year', 'yearOfStudy', 'dob', 'gender', 'bio', 'interests', 'termsAccepted', 'schedule'];
    const updates = {};

    // Only include allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

      // Map `dob` (frontend) to the `birthdate` field in the model.
      if (updates.dob) {
        const parsed = new Date(updates.dob);
        if (!isNaN(parsed.getTime())) {
          updates.birthdate = parsed;
        }
        delete updates.dob;
      }

      // Normalize and accept either `year` (legacy) or `yearOfStudy` from clients.
      const normalize = (v) => {
        if (v === undefined || v === null) return undefined;
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
      };

      if (updates.yearOfStudy) {
        const n = normalize(updates.yearOfStudy);
        if (n) updates.yearOfStudy = n;
      }

      if (updates.year) {
        const n = normalize(updates.year);
        if (n) updates.yearOfStudy = n;
        delete updates.year;
      }

      // Sanitize gender if provided: restrict to allowed values.
      if (updates.gender) {
        const allowed = ['male', 'female', 'non-binary', 'other', 'unspecified'];
        if (!allowed.includes(String(updates.gender))) {
          updates.gender = 'unspecified';
        } else {
          updates.gender = String(updates.gender);
        }
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
    const { query, major, year, page = 1, limit = 10, excludeSelf } = req.query;
    const skip = (page - 1) * limit;

    let searchQuery = { isActive: true };

    // Exclude the requesting user from search results by default. This
    // prevents the client from seeing their own profile in discovery lists.
    if (req.userId) {
      searchQuery._id = { $ne: req.userId };
    }

    // Development debug: log who is asking and the query (do not log tokens)
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log(`[users.search] req.userId=${req.userId} excludeSelf=${excludeSelf} q=${String(query || '')} page=${page} limit=${limit}`);
      } catch (e) {}
    }

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
      // frontend may still send `year`; map it to `yearOfStudy` in the DB
      searchQuery.yearOfStudy = year;
    }

    let users = await User.find(searchQuery)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // map to public shape
    users = users.map(u => u.toPublicJSON ? u.toPublicJSON() : u);

    // Defensive: ensure the requesting user is not present in the returned
    // list. This avoids edge cases where query casting or types cause the
    // $ne filter to miss the requester. It's cheap for paginated pages.
    if (req.userId) {
      users = users.filter(u => String(u._id) !== String(req.userId));
    }

    // Dev debug: log whether the current user was present in the fetched page
    if (process.env.NODE_ENV !== 'production') {
      try {
        const ids = users.map(u => String(u._id));
        const contained = req.userId ? ids.includes(String(req.userId)) : false;
        console.log(`[users.search] returned ${ids.length} users; containedReqUser=${contained}`);
      } catch (e) {}
    }

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
    const user = await User.findById(req.params.id).select('-password');

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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

module.exports = router;