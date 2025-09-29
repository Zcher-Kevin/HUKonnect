const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const { category, page = 1, limit = 10, upcoming = true } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter upcoming events
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName username')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ startDate: 1 });

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
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

// Create new event
router.post('/', [
  auth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('category').isIn(['Academic', 'Social', 'Sports', 'Cultural', 'Professional', 'Other'])
    .withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const eventData = {
      ...req.body,
      organizer: req.userId
    };

    const event = new Event(eventData);
    await event.save();

    await event.populate('organizer', 'firstName lastName username');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
});

// Get event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName username')
      .populate('attendees', 'firstName lastName username');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event',
      error: error.message
    });
  }
});

// Join event
router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if already attending
    if (event.attendees.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already attending this event'
      });
    }

    // Check if event is full
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Add user to attendees
    event.attendees.push(req.userId);
    await event.save();

    // Add event to user's attending list
    await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { eventsAttending: event._id } }
    );

    res.json({
      success: true,
      message: 'Successfully joined event'
    });

  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join event',
      error: error.message
    });
  }
});

// Leave event
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(
      attendee => attendee.toString() !== req.userId.toString()
    );
    await event.save();

    // Remove event from user's attending list
    await User.findByIdAndUpdate(
      req.userId,
      { $pull: { eventsAttending: event._id } }
    );

    res.json({
      success: true,
      message: 'Successfully left event'
    });

  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave event',
      error: error.message
    });
  }
});

module.exports = router;