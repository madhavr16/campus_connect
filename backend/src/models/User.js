const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    registrationNumber: { type: String, unique: true, required: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' }
});

module.exports = mongoose.model('User', UserSchema);
