const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = {};

auth.authenticate = async function (req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'no token' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'replace_this');
        const user = await User.findById(payload.id).select('-passwordHash');
        if (!user) return res.status(401).json({ error: 'invalid user' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'invalid token' });
    }
}

auth.requireAdmin = function (req, res, next) {
    if (req.user && req.user.role === 'ADMIN') return next();
    return res.status(403).json({ error: 'admin only' });
}

module.exports = auth;
