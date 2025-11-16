const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true, index: true },
  senderId: { type: String, required: true, index: true },
  recipientId: { type: String, required: true, index: true },
  text: { type: String, trim: true, maxlength: 2000 },
  replyToId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now, index: true },
  editedAt: { type: Date, required: false },
  deletedAt: { type: Date, required: false },
  readAt: { type: Date, required: false }
});

// Convenience transformation for API responses
messageSchema.methods.toPublicJSON = function () {
  const m = this.toObject({ getters: true });
  return {
    id: m._id,
    chatId: m.chatId,
    senderId: m.senderId,
    recipientId: m.recipientId,
    text: m.text,
    replyToId: m.replyToId,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    deletedAt: m.deletedAt,
    readAt: m.readAt
  };
};

module.exports = require('mongoose').model('Message', messageSchema);
