// Auth routes - Register, Login, Logout, Me
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { User, Settings } = require('../models');
const { authenticate, generateToken } = require('../middleware/auth');
const { DEFAULT_DISTRACTING_APPS } = require('../utils/distractionMatcher');
const DistractingApp = require('../models/DistractingApp');

const ACTIVE_USER_FILE = path.join(__dirname, '..', 'active_user.json');

function writeActiveUser(email, userId) {
    fs.writeFileSync(ACTIVE_USER_FILE, JSON.stringify({ email, userId }, null, 2));
}

function clearActiveUser() {
    try { fs.unlinkSync(ACTIVE_USER_FILE); } catch (e) { /* file may not exist */ }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user
        const user = await User.create({ name, email, password });

        // Create default settings for the user
        await Settings.create({ userId: user.id });

        // Add default distracting apps preset
        const defaultApps = DEFAULT_DISTRACTING_APPS.map(app => ({
            ...app,
            userId: user.id
        }));
        await DistractingApp.bulkCreate(defaultApps);

        const token = generateToken(user.id);

        // Write active user for the Python tracker
        writeActiveUser(email, user.id);

        res.status(201).json({
            message: 'Account created successfully',
            user: user.toJSON(),
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user.id);

        // Write active user for the Python tracker
        writeActiveUser(email, user.id);

        res.json({
            message: 'Login successful',
            user: user.toJSON(),
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            include: [{ model: Settings }]
        });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
    // JWT is stateless — client simply deletes the token
    clearActiveUser();
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
