const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const User = require('../models/User');
const asyncHandler = require('../lib/asyncHandler');
const { sendError } = require('../lib/errorResponse');

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
router.post('/chats/:peerId/messages', auth, asyncHandler(async (req, res) => {
  const senderId = req.userId;
  const { peerId } = req.params;
  const { text, replyToId } = req.body;

  if (!text || String(text).trim().length === 0) {
    return sendError(res, 400, 'Message text required');
  }

  // quick existence check for recipient
  const peer = await User.findById(peerId).select('_id');
  if (!peer) return sendError(res, 404, 'Recipient not found');

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
  // If client supplied a temp id, include it so clients can match optimistic messages
  try {
    if (req.body && req.body.clientTempId) payload.clientTempId = String(req.body.clientTempId);
  } catch (e) {}

  // Broadcast via Socket.IO to the recipient (best-effort).
  // We intentionally avoid broadcasting the created message back to the
  // sender here because the sender already gets the created message via
  // the HTTP response. Broadcasting to the sender can create a race with
  // the client's HTTP response handler and lead to duplicate messages.
  try {
    const io = req.app.get('io');
    if (io) {
      emitToRooms(io, [`user:${String(saved.recipientId)}`], 'message', payload);
    }
  } catch (e) {
    console.warn('Socket broadcast failed:', e && e.message);
  }

  return res.status(201).json({ success: true, message: payload });
}));

// List threads for current user (simple last-message per peer)
router.get('/chats', auth, asyncHandler(async (req, res) => {
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
}));

// Fetch messages for a DM
router.get('/chats/:peerId/messages', auth, asyncHandler(async (req, res) => {
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
}));

// Edit message
router.patch('/messages/:id', auth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { text } = req.body;

  const msg = await Message.findById(id);
  if (!msg) return sendError(res, 404, 'Message not found');
  if (String(msg.senderId) !== String(userId)) return sendError(res, 403, 'Not allowed');

  msg.text = text || msg.text;
  msg.editedAt = new Date();
  const saved = await msg.save();

  // Broadcast edit (include sender display name)
  const names = await resolveDisplayNames([saved.senderId]);
  const payload = Object.assign({}, saved.toPublicJSON(), { senderName: names.get(String(saved.senderId)) });
  try {
    const io = req.app.get('io');
  // Emit edit to recipient only; sender receives edit confirmation via HTTP
  // response to avoid duplicate application of the same change.
  emitToRooms(io, [`user:${String(msg.recipientId)}`], 'message:edit', payload);
  } catch (e) {
    // ignore emit errors
  }

  return res.json({ success: true, message: payload });
}));

// Delete message (soft delete)
router.delete('/messages/:id', auth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const msg = await Message.findById(id);
  if (!msg) return sendError(res, 404, 'Message not found');
  if (String(msg.senderId) !== String(userId)) return sendError(res, 403, 'Not allowed');

  msg.deletedAt = new Date();
  const saved = await msg.save();

  try {
    const names = await resolveDisplayNames([msg.senderId]);
    const payload = { id: saved._id, chatId: msg.chatId, senderId: msg.senderId, senderName: names.get(String(msg.senderId)) };
    const io = req.app.get('io');
  // Emit delete to recipient only; sender receives delete confirmation via HTTP
  // response to avoid duplicate handling on the client.
  emitToRooms(io, [`user:${String(msg.recipientId)}`], 'message:delete', payload);
  } catch (e) {
    // ignore emit errors
  }

  return res.json({ success: true });
}));

module.exports = router;
