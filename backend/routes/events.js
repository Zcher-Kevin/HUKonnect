const express = require('express');
const Event = require('../models/Event');
const asyncHandler = require('../lib/asyncHandler');
const { sendError } = require('../lib/errorResponse');

const router = express.Router();

// Public: list public events (supports ?limit=)
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
  const events = await Event.find({ isPublic: true }).sort({ startDate: -1 }).limit(limit).populate('organizer', 'firstName lastName username');
  res.json({ success: true, data: events });
}));

// Public: get single event
router.get('/:id', asyncHandler(async (req, res) => {
  const ev = await Event.findById(req.params.id).populate('organizer', 'firstName lastName username').populate('attendees', 'firstName lastName username');
  if (!ev) return sendError(res, 404, 'Event not found');
  res.json({ success: true, data: ev });
}));

module.exports = router;