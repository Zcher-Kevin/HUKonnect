const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');


const router = express.Router();

// NOTE: Events feature has been disabled. All endpoints in this router
// return 410 Gone so the feature can be re-enabled later without restoring files.
router.use((req, res) => {
  res.status(410).json({ success: false, message: 'Events feature disabled' });
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