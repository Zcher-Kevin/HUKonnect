const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
	title: { type: String, required: true, trim: true },
	description: { type: String, default: '' },
	organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	location: { type: String, default: '' },
	startDate: { type: Date },
	endDate: { type: Date },
	category: { type: String, default: 'Other' },
	isPublic: { type: Boolean, default: true },
	attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	tags: [{ type: String }],
}, { timestamps: true });

// Basic indexes for queries
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });

module.exports = mongoose.model('Event', eventSchema);