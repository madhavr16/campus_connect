const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    text: String,
    createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    type: { type: String, enum: ['EVENT', 'LOST_FOUND', 'GENERAL', 'CARPOOL_REQUEST'], required: true },
    title: String,
    body: String,
    images: [String],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
