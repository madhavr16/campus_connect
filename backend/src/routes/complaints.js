const express = require('express');
const Complaint = require('../models/Complaint');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

// create complaint (reporter optional). If authenticated, attach reporterId.
router.post('/', authenticate, async (req, res) => {
    try {
        const data = req.body;
        // Accept either a GeoJSON `location` or a human-friendly `locationName` string
        if (!data.location && !data.locationName) return res.status(400).json({ error: 'location required (either location GeoJSON or locationName string)' });
        // attach reporter if present
        if (req.user) data.reporterId = req.user._id;
        const complaint = await Complaint.create(data);
        res.status(201).json(complaint);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// list complaints (public)
router.get('/', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort('-createdAt').limit(200);
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// admin update status
// update status: admins can update any complaint; users can update their own complaint
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: 'not found' });
        const { status, reason } = req.body;
        if (!['REPORTED', 'IN_PROGRESS', 'RESOLVED'].includes(status)) return res.status(400).json({ error: 'invalid status' });

        // allow if admin, or if the requester is the reporter of this complaint
        const isAdmin = req.user && req.user.role === 'ADMIN';
        const isReporter = req.user && complaint.reporterId && complaint.reporterId.toString() === req.user._id.toString();
        if (!isAdmin && !isReporter) {
            return res.status(403).json({ error: 'not allowed' });
        }

        // record previous status if needed
        const prevStatus = complaint.status;
        complaint.status = status;

        // push to history
        complaint.statusHistory = complaint.statusHistory || [];
        complaint.statusHistory.push({
            status,
            changedBy: req.user ? req.user._id : null,
            role: req.user ? req.user.role : 'USER',
            reason: reason || '',
            changedAt: new Date()
        });

        complaint.lastStatusChange = {
            changedBy: req.user ? req.user._id : null,
            role: req.user ? req.user.role : 'USER',
            changedAt: new Date()
        };

        await complaint.save();
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
