const express = require('express');
const Trip = require('../models/Trip');
const router = express.Router();

// create trip
router.post('/', async (req, res) => {
    try {
        const trip = await Trip.create(req.body);
        res.status(201).json(trip);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// list trips
router.get('/', async (req, res) => {
    try {
        const items = await Trip.find().sort({ createdAt: -1 }).limit(100);
        res.json(items.map(t => ({ ...t.toObject(), costPerRider: t.costPerRider() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// match trips: find trips whose origin/destination are near provided points
router.get('/match', async (req, res) => {
    try {
        const { originLng, originLat, destLng, destLat, radiusMeters = 5000 } = req.query;
        if (!originLng || !originLat || !destLng || !destLat) return res.status(400).json({ error: 'origin and destination required' });

        const originPoint = { type: 'Point', coordinates: [parseFloat(originLng), parseFloat(originLat)] };
        const destPoint = { type: 'Point', coordinates: [parseFloat(destLng), parseFloat(destLat)] };

        const trips = await Trip.find({
            origin: { $nearSphere: { $geometry: originPoint, $maxDistance: parseInt(radiusMeters) } },
            destination: { $nearSphere: { $geometry: destPoint, $maxDistance: parseInt(radiusMeters) } }
        }).limit(50);

        res.json(trips.map(t => ({ ...t.toObject(), costPerRider: t.costPerRider() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// join a trip
router.post('/:id/join', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        const seats = req.body.seats || 1;
        if (trip.seatsAvailable < seats) return res.status(400).json({ error: 'Not enough seats' });
        trip.riders.push({ userId: req.body.userId, seatsTaken: seats });
        await trip.save();

        // emit socket event
        const io = req.app.get('io');
        if (io) io.to(`trip_${trip._id}`).emit('riderJoined', { tripId: trip._id, seatsTaken: seats, seatsAvailable: trip.seatsAvailable });

        res.json({ trip, costPerRider: trip.costPerRider() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// get messages for a trip
router.get('/:id/messages', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).populate('messages.userId', 'name registrationNumber');
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        res.json(trip.messages || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// post a message to a trip (also emitted via socket)
router.post('/:id/messages', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        const { userId, text } = req.body;
        const msg = { userId: userId || null, text, createdAt: new Date() };
        trip.messages = trip.messages || [];
        trip.messages.push(msg);
        await trip.save();

        const io = req.app.get('io');
        if (io) io.to(`trip_${trip._id}`).emit('tripChatMessage', { tripId: trip._id, userId: userId || null, text, createdAt: msg.createdAt });

        res.json(msg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// leave a trip (simple remove by userId)
router.post('/:id/leave', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });
        const userId = req.body.userId;
        const before = trip.riders.length;
        trip.riders = trip.riders.filter(r => !r.userId || r.userId.toString() !== (userId || '').toString());
        await trip.save();

        const io = req.app.get('io');
        if (io) io.to(`trip_${trip._id}`).emit('riderLeft', { tripId: trip._id, seatsAvailable: trip.seatsAvailable });

        res.json({ removed: before - trip.riders.length, trip, costPerRider: trip.costPerRider() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
