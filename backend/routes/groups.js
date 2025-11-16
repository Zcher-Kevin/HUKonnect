const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// NOTE: Groups feature has been disabled. All endpoints in this router
// return 410 Gone to make the change reversible without deleting code.
// This keeps the server stable while the frontend is updated to hide group UI.
router.use((req, res) => {
  res.status(410).json({ success: false, message: 'Groups feature disabled' });
});

// Create new group
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['Study Group', 'Club', 'Sports', 'Hobby', 'Professional', 'Social', 'Other'])
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

    const groupData = {
      ...req.body,
      creator: req.userId,
      members: [{
        user: req.userId,
        role: 'admin',
        joinedAt: new Date()
      }]
    };

    const group = new Group(groupData);
    await group.save();

    // Add group to user's joined groups
    await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { joinedGroups: group._id } }
    );

    await group.populate('creator', 'firstName lastName username');
    await group.populate('members.user', 'firstName lastName username');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: error.message
    });
  }
});

// Get group by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'firstName lastName username')
      .populate('members.user', 'firstName lastName username');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      group
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group',
      error: error.message
    });
  }
});

// Join group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if already a member
    if (group.isMember(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is full'
      });
    }

    // Add user to group members
    group.members.push({
      user: req.userId,
      role: 'member',
      joinedAt: new Date()
    });
    await group.save();

    // Add group to user's joined groups
    await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { joinedGroups: group._id } }
    );

    res.json({
      success: true,
      message: 'Successfully joined group'
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group',
      error: error.message
    });
  }
});

// Leave group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is the creator
    if (group.creator.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Group creator cannot leave the group. Consider transferring ownership first.'
      });
    }

    // Remove user from group members
    group.members = group.members.filter(
      member => member.user.toString() !== req.userId.toString()
    );
    await group.save();

    // Remove group from user's joined groups
    await User.findByIdAndUpdate(
      req.userId,
      { $pull: { joinedGroups: group._id } }
    );

    res.json({
      success: true,
      message: 'Successfully left group'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group',
      error: error.message
    });
  }
});

module.exports = router;