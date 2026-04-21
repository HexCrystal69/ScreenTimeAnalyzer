// Alert routes - CRUD + auto-trigger checking
const express = require('express');
const router = express.Router();
const { Alert, ScreenTimeEntry } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op, fn, col } = require('sequelize');

router.use(authenticate);

// GET /api/alerts - List user's alerts
router.get('/', async (req, res) => {
    try {
        const { active, dismissed } = req.query;
        const where = { userId: req.userId };
        if (active !== undefined) where.active = active === 'true';
        if (dismissed !== undefined) where.dismissed = dismissed === 'true';

        const alerts = await Alert.findAll({
            where,
            order: [['lastTriggered', 'DESC'], ['createdAt', 'DESC']]
        });

        // Summary stats
        const totalActive = await Alert.count({ where: { userId: req.userId, active: true } });
        const totalCritical = await Alert.count({ where: { userId: req.userId, severity: 'critical', dismissed: false } });
        const totalTriggered = alerts.reduce((sum, a) => sum + a.triggerCount, 0);

        res.json({
            alerts,
            stats: { totalActive, totalCritical, totalTriggered }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// POST /api/alerts - Create alert
router.post('/', async (req, res) => {
    try {
        const { name, triggerType, appOrCategory, thresholdMinutes, notificationMethod, severity } = req.body;

        if (!name || !appOrCategory || !thresholdMinutes) {
            return res.status(400).json({ error: 'Name, app/category, and threshold are required' });
        }

        const alert = await Alert.create({
            userId: req.userId,
            name,
            triggerType: triggerType || 'usage_limit',
            appOrCategory,
            thresholdMinutes,
            notificationMethod: notificationMethod || 'in_app',
            severity: severity || 'warning'
        });

        res.status(201).json({ alert });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

// PUT /api/alerts/:id - Update alert
router.put('/:id', async (req, res) => {
    try {
        const alert = await Alert.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        const fields = ['name', 'triggerType', 'appOrCategory', 'thresholdMinutes', 'active', 'notificationMethod', 'severity', 'dismissed'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) alert[f] = req.body[f];
        });

        await alert.save();
        res.json({ alert });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
    try {
        const alert = await Alert.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        await alert.destroy();
        res.json({ message: 'Alert deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

// GET /api/alerts/check - Evaluate all active alerts against current data
router.get('/check', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const activeAlerts = await Alert.findAll({
            where: { userId: req.userId, active: true }
        });

        const triggered = [];

        for (const alert of activeAlerts) {
            let usage = 0;

            if (alert.triggerType === 'usage_limit') {
                // Sum usage for the specific app or category today
                const where = { userId: req.userId, date: today };

                // Check if it's an app name or category
                const isCategory = ['Social', 'Work', 'Entertainment', 'News', 'Communication', 'Education', 'Other'].includes(alert.appOrCategory);
                if (isCategory) {
                    where.category = alert.appOrCategory;
                } else {
                    where.app = alert.appOrCategory;
                }

                const result = await ScreenTimeEntry.findAll({
                    attributes: [[fn('SUM', col('usageMinutes')), 'total']],
                    where,
                    raw: true
                });
                usage = result[0]?.total || 0;
            }

            if (usage >= alert.thresholdMinutes) {
                await alert.update({
                    lastTriggered: new Date(),
                    triggerCount: alert.triggerCount + 1,
                    severity: usage >= alert.thresholdMinutes * 1.5 ? 'critical' : 'warning'
                });

                triggered.push({
                    alertId: alert.id,
                    name: alert.name,
                    appOrCategory: alert.appOrCategory,
                    threshold: alert.thresholdMinutes,
                    currentUsage: Math.round(usage),
                    severity: alert.severity,
                    overBy: Math.round(usage - alert.thresholdMinutes)
                });
            }
        }

        res.json({ triggered, checkedCount: activeAlerts.length });
    } catch (error) {
        console.error('Alert check error:', error);
        res.status(500).json({ error: 'Failed to check alerts' });
    }
});

module.exports = router;
