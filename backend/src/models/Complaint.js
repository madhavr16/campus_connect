const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }
});

const ComplaintSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    anonymous: { type: Boolean, default: true },
    title: String,
    description: String,
    location: PointSchema,
    // human-friendly textual location (e.g., "Library - North Wing")
    locationName: { type: String },
    status: { type: String, enum: ['REPORTED', 'IN_PROGRESS', 'RESOLVED'], default: 'REPORTED' },
    // audit trail for status changes
    statusHistory: [{
        status: { type: String, enum: ['REPORTED', 'IN_PROGRESS', 'RESOLVED'] },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
        reason: String,
        changedAt: { type: Date, default: Date.now }
    }],
    // quick reference to who last changed status (optional)
    lastStatusChange: {
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['USER', 'ADMIN'] },
        changedAt: Date
    },
    createdAt: { type: Date, default: Date.now }
});

ComplaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', ComplaintSchema);
