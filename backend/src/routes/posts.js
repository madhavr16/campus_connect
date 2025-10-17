const express = require('express');
const Post = require('../models/Post');
const router = express.Router();

// create post
router.post('/', async (req, res) => {
    try {
        const post = await Post.create(req.body);
        res.status(201).json(post);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// list posts (with optional type filter)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) filter.type = req.query.type;
        const posts = await Post.find(filter).sort('-createdAt').limit(100);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
