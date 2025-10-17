const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// register
router.post('/register', async (req, res) => {
    try {
        const { name, registrationNumber, password } = req.body;
        if (!registrationNumber || !password) return res.status(400).json({ error: 'registrationNumber and password required' });
        const existing = await User.findOne({ registrationNumber });
        if (existing) return res.status(400).json({ error: 'registrationNumber exists' });
        const passwordHash = await bcrypt.hash(password, 10);

        // determine role automatically: 5-digit numeric registration numbers are officials/admins
        let role = 'USER';
        if (/^\d{5}$/.test(registrationNumber)) role = 'ADMIN';

        const user = await User.create({ name, registrationNumber, passwordHash, role });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'replace_this', { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, registrationNumber: user.registrationNumber, name: user.name, role: user.role } });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

// login
router.post('/login', async (req, res) => {
    try {
        const { registrationNumber, password } = req.body;
        const user = await User.findOne({ registrationNumber });
        if (!user) return res.status(400).json({ error: 'invalid credentials' });
        const ok = await bcrypt.compare(password, user.passwordHash || '');
        if (!ok) return res.status(400).json({ error: 'invalid credentials' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'replace_this', { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, registrationNumber: user.registrationNumber, name: user.name, role: user.role } });
    } catch (err) { res.status(500).json({ error: err.message }) }
});

module.exports = router;
