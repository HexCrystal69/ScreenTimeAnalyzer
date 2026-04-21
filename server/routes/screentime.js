// Screen Time routes - CRUD + CSV Upload with auto-flagging
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { ScreenTimeEntry, DistractingApp } = require('../models');
const { authenticate } = require('../middleware/auth');
const { isDistractingApp } = require('../utils/distractionMatcher');
const { Op } = require('sequelize');

const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

// GET /api/screentime - Get entries with filters
router.get('/', async (req, res) => {
    try {
        const { date, dateFrom, dateTo, app, category } = req.query;
        const where = { userId: req.userId };

        if (date) where.date = date;
        if (dateFrom && dateTo) where.date = { [Op.between]: [dateFrom, dateTo] };
        if (app) where.app = app;
        if (category) where.category = category;

        const entries = await ScreenTimeEntry.findAll({
            where,
            order: [['date', 'DESC'], ['usageMinutes', 'DESC']]
        });
        res.json({ entries });
    } catch (error) {
        console.error('Get screentime error:', error);
        res.status(500).json({ error: 'Failed to fetch screen time data' });
    }
});

// POST /api/screentime - Add single entry
router.post('/', async (req, res) => {
    try {
        const { app, category, date, usageMinutes, notifications, timesOpened, hour } = req.body;

        // Auto-flag if app is in user's distraction list
        const distractingApps = await DistractingApp.findAll({ where: { userId: req.userId } });
        const flagged = isDistractingApp(app, distractingApps);

        const entry = await ScreenTimeEntry.create({
            userId: req.userId,
            app,
            category: category || 'Other',
            date: date || new Date().toISOString().split('T')[0],
            usageMinutes: usageMinutes || 0,
            notifications: notifications || 0,
            timesOpened: timesOpened || 0,
            isDistracting: flagged,
            hour: hour || null
        });

        res.status(201).json({ entry });
    } catch (error) {
        console.error('Add screentime error:', error);
        res.status(500).json({ error: 'Failed to add screen time entry' });
    }
});

// POST /api/screentime/upload - CSV upload with auto-flagging
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get user's distraction list for auto-flagging
        const distractingApps = await DistractingApp.findAll({ where: { userId: req.userId } });
        const entries = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => {
                    // Support multiple CSV column name formats
                    const app = row.App || row.app || row.Application || row.application || '';
                    const category = row.Category || row.category || 'Other';
                    const date = row.Date || row.date || new Date().toISOString().split('T')[0];
                    const usage = parseFloat(row.Usage || row.usage || row.UsageMinutes || row.usageMinutes || 0);
                    const notif = parseInt(row.Notifications || row.notifications || 0);
                    const opened = parseInt(row['Times opened'] || row.TimesOpened || row.timesOpened || 0);

                    if (app) {
                        entries.push({
                            userId: req.userId,
                            app: app.trim(),
                            category,
                            date,
                            usageMinutes: usage,
                            notifications: notif,
                            timesOpened: opened,
                            isDistracting: isDistractingApp(app.trim(), distractingApps)
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Bulk insert
        const created = await ScreenTimeEntry.bulkCreate(entries);

        // Clean up uploaded file
        fs.unlink(req.file.path, () => { });

        const distractingCount = entries.filter(e => e.isDistracting).length;

        res.json({
            message: `Imported ${created.length} entries (${distractingCount} auto-flagged as distracting)`,
            count: created.length,
            distractingCount
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (req.file) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Failed to process CSV file' });
    }
});

// DELETE /api/screentime/:id
router.delete('/:id', async (req, res) => {
    try {
        const entry = await ScreenTimeEntry.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        await entry.destroy();
        res.json({ message: 'Entry deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

module.exports = router;
