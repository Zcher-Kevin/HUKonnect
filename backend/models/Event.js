const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event organizer is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: ['Academic', 'Social', 'Sports', 'Cultural', 'Professional', 'Other'],
    default: 'Other'
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Maximum attendees must be at least 1'],
    max: [1000, 'Maximum attendees cannot exceed 1000']
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  requirements: {
    type: String,
    maxlength: [500, 'Requirements cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Validate that end date is after start date
eventSchema.pre('validate', function(next) {
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Index for better query performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ tags: 1 });

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees ? this.attendees.length : 0;
});

// Virtual for remaining spots
eventSchema.virtual('remainingSpots').get(function() {
  if (!this.maxAttendees) return null;
  const attendeeCount = this.attendees ? this.attendees.length : 0;
  return this.maxAttendees - attendeeCount;
});

// Ensure virtuals are included in JSON output
eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);