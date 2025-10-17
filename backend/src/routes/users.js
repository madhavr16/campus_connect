const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

// admin: change a user's role
router.patch('/:id/role', authenticate, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['USER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'invalid role' });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'user not found' });
        user.role = role;
        await user.save();
        res.json({ id: user._id, registrationNumber: user.registrationNumber, name: user.name, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
