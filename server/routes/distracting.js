// Distracting Apps routes - per-user distraction list + browser detection
const express = require('express');
const router = express.Router();
const { DistractingApp, ScreenTimeEntry } = require('../models');
const { authenticate } = require('../middleware/auth');
const { isDistractingApp } = require('../utils/distractionMatcher');

router.use(authenticate);

// GET /api/distracting-apps - Get user's distraction list
router.get('/', async (req, res) => {
    try {
        const apps = await DistractingApp.findAll({
            where: { userId: req.userId },
            order: [['createdAt', 'DESC']]
        });
        res.json({ apps });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch distraction list' });
    }
});

// POST /api/distracting-apps - Add app/website to distraction list
router.post('/', async (req, res) => {
    try {
        const { appName, type, url, category, isBlocked } = req.body;

        if (!appName) {
            return res.status(400).json({ error: 'App name is required' });
        }

        // Check if already exists for this user
        const existing = await DistractingApp.findOne({
            where: { userId: req.userId, appName }
        });
        if (existing) {
            return res.status(400).json({ error: 'App already in your distraction list' });
        }

        const app = await DistractingApp.create({
            userId: req.userId,
            appName,
            type: type || 'app',
            url: url || null,
            category: category || 'Other',
            isBlocked: isBlocked || false
        });

        // Auto-flag any existing screen time entries matching this app
        await ScreenTimeEntry.update(
            { isDistracting: true },
            { where: { userId: req.userId, isDistracting: false } }
        );
        // Re-check which entries match the updated distraction list
        const allDistractingApps = await DistractingApp.findAll({ where: { userId: req.userId } });
        const unflaggedEntries = await ScreenTimeEntry.findAll({
            where: { userId: req.userId }
        });

        for (const entry of unflaggedEntries) {
            const shouldFlag = isDistractingApp(entry.app, allDistractingApps);
            if (entry.isDistracting !== shouldFlag) {
                await entry.update({ isDistracting: shouldFlag });
            }
        }

        res.status(201).json({ app, message: 'App added to distraction list' });
    } catch (error) {
        console.error('Add distracting app error:', error);
        res.status(500).json({ error: 'Failed to add app' });
    }
});

// DELETE /api/distracting-apps/:id - Remove from list
router.delete('/:id', async (req, res) => {
    try {
        const app = await DistractingApp.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!app) return res.status(404).json({ error: 'App not found in your list' });

        const appName = app.appName;
        await app.destroy();

        // Un-flag screen time entries for this app (re-evaluate)
        const remainingApps = await DistractingApp.findAll({ where: { userId: req.userId } });
        const entries = await ScreenTimeEntry.findAll({
            where: { userId: req.userId, app: appName }
        });
        for (const entry of entries) {
            const stillDistracting = isDistractingApp(entry.app, remainingApps);
            await entry.update({ isDistracting: stillDistracting });
        }

        res.json({ message: 'App removed from distraction list' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove app' });
    }
});

// PUT /api/distracting-apps/:id - Update (e.g., toggle block)
router.put('/:id', async (req, res) => {
    try {
        const app = await DistractingApp.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!app) return res.status(404).json({ error: 'App not found' });

        const { isBlocked, url, category } = req.body;
        if (isBlocked !== undefined) app.isBlocked = isBlocked;
        if (url !== undefined) app.url = url;
        if (category !== undefined) app.category = category;
        await app.save();

        res.json({ app });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update app' });
    }
});

// POST /api/distracting-apps/detect - Browser activity detection endpoint
// Frontend sends current tab info, backend checks against user's list
router.post('/detect', async (req, res) => {
    try {
        const { tabTitle, tabUrl } = req.body;

        if (!tabTitle && !tabUrl) {
            return res.json({ isDistracting: false });
        }

        const apps = await DistractingApp.findAll({ where: { userId: req.userId } });

        const detected = apps.find(app => {
            const name = app.appName.toLowerCase();
            const title = (tabTitle || '').toLowerCase();
            const url = (tabUrl || '').toLowerCase();
            const appUrl = (app.url || '').toLowerCase();

            return title.includes(name) || url.includes(name) ||
                (appUrl && url.includes(appUrl)) ||
                (appUrl && title.includes(appUrl));
        });

        if (detected) {
            // Log this as a screen time entry for today
            const today = new Date().toISOString().split('T')[0];
            const currentHour = new Date().getHours();

            const [entry, created] = await ScreenTimeEntry.findOrCreate({
                where: {
                    userId: req.userId,
                    app: detected.appName,
                    date: today,
                    hour: currentHour
                },
                defaults: {
                    userId: req.userId,
                    app: detected.appName,
                    category: detected.category || 'Other',
                    date: today,
                    usageMinutes: 0.5, // 30 second ping
                    timesOpened: 1,
                    isDistracting: true,
                    hour: currentHour
                }
            });

            if (!created) {
                await entry.update({
                    usageMinutes: entry.usageMinutes + 0.5,
                    timesOpened: entry.timesOpened + 1
                });
            }

            return res.json({
                isDistracting: true,
                app: detected.appName,
                isBlocked: detected.isBlocked,
                message: `${detected.appName} is on your distraction list!`
            });
        }

        res.json({ isDistracting: false });
    } catch (error) {
        console.error('Detection error:', error);
        res.status(500).json({ error: 'Detection failed' });
    }
});

module.exports = router;
