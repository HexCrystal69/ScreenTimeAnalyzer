const express = require('express');
const router = express.Router();
const { ScreenTimeEntry, Settings, UserTask } = require('../models');
const { authenticate } = require('../middleware/auth');
const { calculateOpportunityCost } = require('../utils/opportunityCost');
const { Op, fn, col } = require('sequelize');

router.use(authenticate);

router.get('/cost', async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        const settings = await Settings.findOne({ where: { userId: req.userId } });
        const hourlyRate = (settings && settings.hourlyRate != null) ? settings.hourlyRate : 500;

        const distractingEntries = await ScreenTimeEntry.findAll({
            where: { userId: req.userId, isDistracting: true, date: { [Op.gte]: startDate.toISOString().split('T')[0] } }
        });
        const totalDistractionMinutes = distractingEntries.reduce((sum, e) => sum + e.usageMinutes, 0);

        const tasks = await UserTask.findAll({
            where: { userId: req.userId, status: { [Op.in]: ['pending', 'in_progress'] } }
        });
        const result = calculateOpportunityCost(totalDistractionMinutes, hourlyRate, tasks);

        const appBreakdown = distractingEntries
            .reduce((acc, e) => {
                const ex = acc.find(a => a.app === e.app);
                if (ex) { ex.minutes += e.usageMinutes; ex.sessions += e.timesOpened; }
                else acc.push({ app: e.app, minutes: e.usageMinutes, sessions: e.timesOpened });
                return acc;
            }, [])
            .sort((a, b) => b.minutes - a.minutes)
            .map(a => ({ ...a, hours: Math.round((a.minutes / 60) * 10) / 10, cost: Math.round((a.minutes / 60) * hourlyRate * 100) / 100, recommendation: a.minutes > 500 ? 'Block' : a.minutes > 200 ? 'Set Limit' : 'Monitor' }));

        res.json({ ...result, period: daysAgo, appBreakdown });
    } catch (error) {
        console.error('Opportunity cost error:', error);
        res.status(500).json({ error: 'Failed to calculate opportunity cost' });
    }
});

module.exports = router;
