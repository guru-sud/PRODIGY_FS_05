const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register
router.get('/register', (req, res) => res.render('register', {}));

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.render('register', { error: 'All fields are required!' });
        }

        if (password.length < 6) {
            return res.render('register', { error: 'Password must be at least 6 characters!' });
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.render('register', { error: 'Username or email already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        return res.render('register', { error: err.message });
    }
});

// Login
router.get('/login', (req, res) => res.render('login', {}));

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid credentials!' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials!' });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/');
    } catch (err) {
        res.render('login', { error: err.message });
    }
});

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

module.exports = router;