// Attention Score route
const express = require('express');
const router = express.Router();
const { ScreenTimeEntry, Settings } = require('../models');
const { authenticate } = require('../middleware/auth');
const { calculateAttentionScore } = require('../utils/attentionScore');
const { Op, fn, col } = require('sequelize');

router.use(authenticate);

// GET /api/attention/score
router.get('/score', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const entries = await ScreenTimeEntry.findAll({
            where: { userId: req.userId, date: targetDate }
        });

        const settings = await Settings.findOne({ where: { userId: req.userId } });

        const totalMinutes = entries.reduce((sum, e) => sum + e.usageMinutes, 0);
        const distractingMinutes = entries.filter(e => e.isDistracting).reduce((sum, e) => sum + e.usageMinutes, 0);
        const productiveMinutes = totalMinutes - distractingMinutes;
        const appSwitches = entries.reduce((sum, e) => sum + e.timesOpened, 0);
        const notifications = entries.reduce((sum, e) => sum + e.notifications, 0);
        const productiveGoal = settings ? settings.dailyGoalMinutes : 360;

        const result = calculateAttentionScore({
            totalMinutes,
            distractingMinutes,
            appSwitches,
            notifications,
            productiveMinutes,
            productiveGoal
        });

        // Get previous week's score for comparison
        const weekAgo = new Date(targetDate);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const prevEntries = await ScreenTimeEntry.findAll({
            where: { userId: req.userId, date: weekAgo.toISOString().split('T')[0] }
        });

        let prevScore = null;
        if (prevEntries.length > 0) {
            const prev = calculateAttentionScore({
                totalMinutes: prevEntries.reduce((s, e) => s + e.usageMinutes, 0),
                distractingMinutes: prevEntries.filter(e => e.isDistracting).reduce((s, e) => s + e.usageMinutes, 0),
                appSwitches: prevEntries.reduce((s, e) => s + e.timesOpened, 0),
                notifications: prevEntries.reduce((s, e) => s + e.notifications, 0),
                productiveMinutes: prevEntries.filter(e => !e.isDistracting).reduce((s, e) => s + e.usageMinutes, 0),
                productiveGoal
            });
            prevScore = prev.score;
        }

        res.json({
            ...result,
            date: targetDate,
            change: prevScore !== null ? result.score - prevScore : null,
            changeLabel: prevScore !== null
                ? (result.score > prevScore ? `+${result.score - prevScore} from last week ↑` : `${result.score - prevScore} from last week ↓`)
                : null
        });
    } catch (error) {
        console.error('Attention score error:', error);
        res.status(500).json({ error: 'Failed to calculate attention score' });
    }
});

module.exports = router;
