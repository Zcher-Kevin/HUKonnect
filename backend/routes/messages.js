const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Helper to compute chatId for a DM (simple canonical form)
function chatIdFor(userA, userB) {
  // keep deterministic: smaller id first
  return `dm:${[userA, userB].sort().join('-')}`;
}

// Helper: human-friendly display name for a User doc or id
function displayNameFromUserDoc(u) {
  if (!u) return null;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return name || u.username || String(u._id);
}

// Resolve a map of userId -> displayName. Accepts array of ids.
async function resolveDisplayNames(ids = []) {
  const uniq = Array.from(new Set((ids || []).filter(Boolean)));
  if (uniq.length === 0) return new Map();
  const users = await User.find({ _id: { $in: uniq } }).select('firstName lastName username').lean();
  const m = new Map(users.map((u) => [String(u._id), displayNameFromUserDoc(u)]));
  // ensure every requested id has at least a string value
  uniq.forEach((id) => {
    if (!m.has(String(id))) m.set(String(id), String(id));
  });
  return m;
}

// Safe emitter helper - emits a payload to provided Socket.IO rooms when io is available
function emitToRooms(io, rooms = [], event, payload) {
  if (!io) return;
  rooms.forEach((r) => {
    try {
      io.to(r).emit(event, payload);
    } catch (e) {
      // don't fail the request because a single emit errored
      console.warn('emit failed', event, r, e && e.message);
    }
  });
}

// Send a message (persist and broadcast)
router.post('/chats/:peerId/messages', auth, async (req, res) => {
  try {
    const senderId = req.userId;
    const { peerId } = req.params;
    const { text, replyToId } = req.body;

    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }

    // quick existence check for recipient
    const peer = await User.findById(peerId).select('_id');
    if (!peer) return res.status(404).json({ success: false, message: 'Recipient not found' });

    const chatId = chatIdFor(senderId, peerId);

    const msg = new Message({
      chatId,
      senderId,
      recipientId: peerId,
      text: String(text).trim(),
      replyToId: replyToId || undefined,
    });

    const saved = await msg.save();

    // Prepare display names in batch
    const names = await resolveDisplayNames([saved.senderId, saved.recipientId]);
    const payload = Object.assign({}, saved.toPublicJSON(), {
      senderName: names.get(String(saved.senderId)),
      recipientName: names.get(String(saved.recipientId)),
    });

    // Broadcast via Socket.IO to both participants (best-effort)
    try {
      const io = req.app.get('io');
      if (io) {
        emitToRooms(io, [`user:${String(saved.senderId)}`, `user:${String(saved.recipientId)}`], 'message', payload);
      }
    } catch (e) {
      console.warn('Socket broadcast failed:', e && e.message);
    }

    return res.status(201).json({ success: true, message: payload });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
});

// List threads for current user (simple last-message per peer)
router.get('/chats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    // Aggregate last message per chat where user is participant
    const threads = await Message.aggregate([
      { $match: { $or: [{ senderId: userId }, { recipientId: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$chatId',
          lastMessage: { $first: '$text' },
          lastCreatedAt: { $first: '$createdAt' },
          lastMessageDocId: { $first: '$_id' },
          senderId: { $first: '$senderId' },
          recipientId: { $first: '$recipientId' }
        }
      },
      { $sort: { lastCreatedAt: -1 } }
    ]).exec();

    // Map to a friendly thread object with peerId/peerName
    const peerIds = threads.map((t) => {
      const ids = String(t._id).replace(/^dm:/, '').split('-');
      return ids[0] === userId ? ids[1] : ids[0];
    });
    const uniqPeerIds = Array.from(new Set(peerIds.filter(Boolean)));
    const names = await resolveDisplayNames(uniqPeerIds);

    const out = threads.map((t) => {
      const ids = String(t._id).replace(/^dm:/, '').split('-');
      const peerId = ids[0] === userId ? ids[1] : ids[0];
      const peerName = names.get(String(peerId)) || String(peerId);
      return { chatId: t._id, peerId, peerName, lastMessage: t.lastMessage, updatedAt: t.lastCreatedAt };
    });

    return res.json({ success: true, threads: out });
  } catch (error) {
    console.error('List threads error:', error);
    res.status(500).json({ success: false, message: 'Failed to list chats', error: error.message });
  }
});

// Fetch messages for a DM
router.get('/chats/:peerId/messages', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { peerId } = req.params;
    const chatId = chatIdFor(userId, peerId);

    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);

    const msgs = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();

    // Batch-resolve sender names for the messages to avoid N+1
    const senderIds = Array.from(new Set(msgs.map((m) => String(m.senderId || ''))));
    const names = await resolveDisplayNames(senderIds);
    const publicMsgs = msgs.map((m) => {
      const pm = m.toPublicJSON();
      pm.senderName = names.get(String(pm.senderId)) || String(pm.senderId);
      return pm;
    });

    return res.json({ success: true, messages: publicMsgs });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
});

// Edit message
router.patch('/messages/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { text } = req.body;

    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    if (msg.senderId !== userId) return res.status(403).json({ success: false, message: 'Not allowed' });

    msg.text = text || msg.text;
    msg.editedAt = new Date();
    const saved = await msg.save();

    // Broadcast edit (include sender display name)
    const names = await resolveDisplayNames([saved.senderId]);
    const payload = Object.assign({}, saved.toPublicJSON(), { senderName: names.get(String(saved.senderId)) });
    try {
      const io = req.app.get('io');
      emitToRooms(io, [`user:${String(msg.senderId)}`, `user:${String(msg.recipientId)}`], 'message:edit', payload);
    } catch (e) {
      // ignore emit errors
    }

    return res.json({ success: true, message: payload });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message', error: error.message });
  }
});

// Delete message (soft delete)
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    if (msg.senderId !== userId) return res.status(403).json({ success: false, message: 'Not allowed' });

    msg.deletedAt = new Date();
    const saved = await msg.save();

    try {
      const names = await resolveDisplayNames([msg.senderId]);
      const payload = { id: saved._id, chatId: msg.chatId, senderId: msg.senderId, senderName: names.get(String(msg.senderId)) };
      const io = req.app.get('io');
      emitToRooms(io, [`user:${String(msg.senderId)}`, `user:${String(msg.recipientId)}`], 'message:delete', payload);
    } catch (e) {
      // ignore emit errors
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message', error: error.message });
  }
});

module.exports = router;
