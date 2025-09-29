const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Group description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group creator is required']
  },
  category: {
    type: String,
    required: [true, 'Group category is required'],
    enum: ['Study Group', 'Club', 'Sports', 'Hobby', 'Professional', 'Social', 'Other'],
    default: 'Other'
  },
  course: {
    type: String,
    trim: true,
    maxlength: [50, 'Course cannot exceed 50 characters']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxMembers: {
    type: Number,
    min: [2, 'Maximum members must be at least 2'],
    max: [100, 'Maximum members cannot exceed 100'],
    default: 20
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  meetingSchedule: {
    frequency: {
      type: String,
      enum: ['Once', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed'],
      default: 'As needed'
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    time: {
      type: String
    },
    location: {
      type: String,
      maxlength: [200, 'Location cannot exceed 200 characters']
    }
  },
  rules: {
    type: String,
    maxlength: [1000, 'Rules cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
groupSchema.index({ category: 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ tags: 1 });
groupSchema.index({ course: 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Virtual for remaining spots
groupSchema.virtual('remainingSpots').get(function() {
  const memberCount = this.members ? this.members.length : 0;
  return this.maxMembers - memberCount;
});

// Method to check if user is a member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to get user's role in group
groupSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Ensure virtuals are included in JSON output
groupSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);