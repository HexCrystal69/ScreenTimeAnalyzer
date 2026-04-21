// Settings routes - User preferences
const express = require('express');
const router = express.Router();
const { Settings } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne({ where: { userId: req.userId } });
        if (!settings) {
            settings = await Settings.create({ userId: req.userId });
        }
        res.json({ settings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings
router.put('/', async (req, res) => {
    try {
        let settings = await Settings.findOne({ where: { userId: req.userId } });
        if (!settings) {
            settings = await Settings.create({ userId: req.userId });
        }

        const fields = [
            'productiveStart', 'productiveEnd', 'productiveDays',
            'hourlyRate', 'dailyGoalMinutes', 'timezone',
            'theme', 'dateFormat', 'weeklyReportEmail', 'notifications'
        ];

        fields.forEach(f => {
            if (req.body[f] !== undefined) settings[f] = req.body[f];
        });

        await settings.save();
        res.json({ settings, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
