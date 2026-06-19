const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Home feed
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'username profilePic')
            .populate('comments.user', 'username')
            .sort({ createdAt: -1 });
        const user = await User.findById(req.user.id);
        res.render('index', { posts, user, search: '' });
    } catch (err) {
        res.redirect('/login');
    }
});

// Search
router.get('/search', auth, async (req, res) => {
    try {
        const query = req.query.q || '';
        const posts = await Post.find({
            $or: [
                { content: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } }
            ]
        }).populate('user', 'username profilePic')
          .populate('comments.user', 'username')
          .sort({ createdAt: -1 });

        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).limit(5);

        const user = await User.findById(req.user.id);
        res.render('index', { posts, user, search: query, searchUsers: users });
    } catch (err) {
        res.redirect('/');
    }
});

// Profile page
router.get('/profile/:id', auth, async (req, res) => {
    try {
        const profileUser = await User.findById(req.params.id)
            .populate('followers', 'username')
            .populate('following', 'username');
        const posts = await Post.find({ user: req.params.id })
            .populate('user', 'username profilePic')
            .populate('comments.user', 'username')
            .sort({ createdAt: -1 });
        const currentUser = await User.findById(req.user.id);
        const isFollowing = profileUser.followers.some(f => f._id.toString() === req.user.id);
        res.render('profile', { profileUser, posts, currentUser, isFollowing });
    } catch (err) {
        res.redirect('/');
    }
});

// Update profile bio
router.post('/profile/update', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { bio: req.body.bio });
        res.redirect('/profile/' + req.user.id);
    } catch (err) {
        res.redirect('/');
    }
});

// Follow/Unfollow
router.post('/follow/:id', auth, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        const isFollowing = targetUser.followers.includes(req.user.id);
        if (isFollowing) {
            targetUser.followers.pull(req.user.id);
            currentUser.following.pull(req.params.id);
        } else {
            targetUser.followers.push(req.user.id);
            currentUser.following.push(req.params.id);
        }
        await targetUser.save();
        await currentUser.save();
        res.redirect('/profile/' + req.params.id);
    } catch (err) {
        res.redirect('/');
    }
});

// Create post
router.post('/posts', auth, upload.single('image'), async (req, res) => {
    try {
        const { content, tags } = req.body;
        const post = new Post({
            user: req.user.id,
            content,
            image: req.file ? '/uploads/' + req.file.filename : '',
            tags: tags ? tags.split(',').map(t => t.trim()) : []
        });
        await post.save();
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

// Like post
router.post('/posts/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const liked = post.likes.includes(req.user.id);
        if (liked) {
            post.likes.pull(req.user.id);
        } else {
            post.likes.push(req.user.id);
        }
        await post.save();
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

// Comment on post
router.post('/posts/:id/comment', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.comments.push({ user: req.user.id, text: req.body.text });
        await post.save();
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

// Delete post
router.post('/posts/:id/delete', auth, async (req, res) => {
    try {
        await Post.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

module.exports = router;
// Public post view (no auth needed)
router.get('/post/:id/public', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user', 'username')
            .populate('comments.user', 'username');
        if (!post) return res.send('Post not found!');
        res.render('public_post', { post });
    } catch (err) {
        res.send('Error loading post!');
    }
});