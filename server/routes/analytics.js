// Analytics routes - Dashboard stats, trends, categories, app usage
const express = require('express');
const router = express.Router();
const { ScreenTimeEntry, Settings, DistractingApp } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');

router.use(authenticate);

// GET /api/analytics/dashboard - Aggregated dashboard data
// Supports ?view=hourly|daily|weekly (defaults to daily)
router.get('/dashboard', async (req, res) => {
    try {
        const view = req.query.view || 'daily';
        const today = new Date().toISOString().split('T')[0];
        const settings = await Settings.findOne({ where: { userId: req.userId } });

        // Today's total screen time (always needed for metric cards)
        const todayEntries = await ScreenTimeEntry.findAll({
            where: { userId: req.userId, date: today }
        });

        const totalMinutes = todayEntries.reduce((sum, e) => sum + e.usageMinutes, 0);
        const distractingMinutes = todayEntries.filter(e => e.isDistracting).reduce((sum, e) => sum + e.usageMinutes, 0);
        const productiveMinutes = totalMinutes - distractingMinutes;
        const totalNotifications = todayEntries.reduce((sum, e) => sum + e.notifications, 0);
        const totalSwitches = todayEntries.reduce((sum, e) => sum + e.timesOpened, 0);

        // Goal calculations
        const dailyGoal = settings ? settings.dailyGoalMinutes : 360;
        const goalPercent = dailyGoal > 0 ? Math.round((productiveMinutes / dailyGoal) * 100) : 0;
        const hourlyRate = settings ? settings.hourlyRate : 12.50;
        const productivityLossCost = Math.round((distractingMinutes / 60) * hourlyRate * 100) / 100;

        // Format time helper
        const formatTime = (mins) => {
            const h = Math.floor(mins / 60);
            const m = Math.round(mins % 60);
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        // Top apps today
        const topApps = todayEntries
            .reduce((acc, e) => {
                const existing = acc.find(a => a.app === e.app);
                if (existing) {
                    existing.usageMinutes += e.usageMinutes;
                } else {
                    acc.push({ app: e.app, category: e.category, usageMinutes: e.usageMinutes, isDistracting: e.isDistracting });
                }
                return acc;
            }, [])
            .sort((a, b) => b.usageMinutes - a.usageMinutes)
            .slice(0, 5);

        // Category breakdown
        const categories = todayEntries.reduce((acc, e) => {
            const cat = acc.find(c => c.category === e.category);
            if (cat) {
                cat.minutes += e.usageMinutes;
            } else {
                acc.push({ category: e.category, minutes: e.usageMinutes });
            }
            return acc;
        }, []).sort((a, b) => b.minutes - a.minutes);

        const categoryTotal = categories.reduce((sum, c) => sum + c.minutes, 0);
        categories.forEach(c => {
            c.percent = categoryTotal > 0 ? Math.round((c.minutes / categoryTotal) * 100) : 0;
            c.formatted = formatTime(c.minutes);
        });

        // Build the response base (metric cards always present)
        const response = {
            view,
            today: {
                totalMinutes,
                totalFormatted: formatTime(totalMinutes),
                distractingMinutes,
                distractingFormatted: formatTime(distractingMinutes),
                productiveMinutes,
                productiveFormatted: formatTime(productiveMinutes),
                goalPercent,
                dailyGoal,
                dailyGoalFormatted: formatTime(dailyGoal),
                productivityLossCost,
                totalNotifications,
                totalSwitches
            },
            topApps,
            categories
        };

        // View-specific chart data
        if (view === 'hourly') {
            // Hourly breakdown for today (group by hour)
            const hourlyData = await ScreenTimeEntry.findAll({
                attributes: [
                    'hour',
                    [fn('SUM', col('usageMinutes')), 'totalMinutes'],
                    [fn('SUM', literal('CASE WHEN isDistracting = 0 THEN usageMinutes ELSE 0 END')), 'productiveMinutes'],
                    [fn('SUM', literal('CASE WHEN isDistracting = 1 THEN usageMinutes ELSE 0 END')), 'distractingMinutes']
                ],
                where: {
                    userId: req.userId,
                    date: today,
                    hour: { [Op.not]: null }
                },
                group: ['hour'],
                order: [['hour', 'ASC']],
                raw: true
            });
            response.hourlyBreakdown = hourlyData;
        } else if (view === 'weekly') {
            // Weekly data (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekData = await ScreenTimeEntry.findAll({
                attributes: [
                    'date',
                    [fn('SUM', col('usageMinutes')), 'totalMinutes'],
                    [fn('SUM', literal('CASE WHEN isDistracting = 0 THEN usageMinutes ELSE 0 END')), 'productiveMinutes'],
                    [fn('SUM', literal('CASE WHEN isDistracting = 1 THEN usageMinutes ELSE 0 END')), 'distractingMinutes']
                ],
                where: {
                    userId: req.userId,
                    date: { [Op.gte]: weekAgo.toISOString().split('T')[0] }
                },
                group: ['date'],
                order: [['date', 'ASC']],
                raw: true
            });
            response.weeklyTrend = weekData;
        } else {
            // Daily view — return today's top apps as bar chart data (already in topApps)
            // Also include weekly trend for the small trend line
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekData = await ScreenTimeEntry.findAll({
                attributes: [
                    'date',
                    [fn('SUM', col('usageMinutes')), 'totalMinutes'],
                    [fn('SUM', literal('CASE WHEN isDistracting = 0 THEN usageMinutes ELSE 0 END')), 'productiveMinutes']
                ],
                where: {
                    userId: req.userId,
                    date: { [Op.gte]: weekAgo.toISOString().split('T')[0] }
                },
                group: ['date'],
                order: [['date', 'ASC']],
                raw: true
            });
            response.weeklyTrend = weekData;
        }

        res.json(response);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to generate dashboard data' });
    }
});

// GET /api/analytics/trends - Weekly/monthly trend data
router.get('/trends', async (req, res) => {
    try {
        const { period = '7' } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const data = await ScreenTimeEntry.findAll({
            attributes: [
                'date',
                [fn('SUM', col('usageMinutes')), 'totalMinutes'],
                [fn('SUM', literal('CASE WHEN isDistracting = 1 THEN usageMinutes ELSE 0 END')), 'distractingMinutes'],
                [fn('SUM', literal('CASE WHEN isDistracting = 0 THEN usageMinutes ELSE 0 END')), 'productiveMinutes'],
                [fn('SUM', col('timesOpened')), 'totalSwitches'],
                [fn('SUM', col('notifications')), 'totalNotifications']
            ],
            where: {
                userId: req.userId,
                date: { [Op.gte]: startDate.toISOString().split('T')[0] }
            },
            group: ['date'],
            order: [['date', 'ASC']],
            raw: true
        });

        // Hourly breakdown (average across all days in period)
        const hourlyData = await ScreenTimeEntry.findAll({
            attributes: [
                'hour',
                [fn('AVG', col('usageMinutes')), 'avgMinutes'],
                [fn('SUM', literal('CASE WHEN isDistracting = 1 THEN usageMinutes ELSE 0 END')), 'distractingMinutes']
            ],
            where: {
                userId: req.userId,
                date: { [Op.gte]: startDate.toISOString().split('T')[0] },
                hour: { [Op.not]: null }
            },
            group: ['hour'],
            order: [['hour', 'ASC']],
            raw: true
        });

        // Summary stats
        const totalDays = data.length;
        const avgDaily = totalDays > 0
            ? data.reduce((sum, d) => sum + parseFloat(d.totalMinutes), 0) / totalDays
            : 0;

        const bestDay = data.reduce((best, d) =>
            !best || parseFloat(d.distractingMinutes) < parseFloat(best.distractingMinutes) ? d : best
            , null);

        const worstDay = data.reduce((worst, d) =>
            !worst || parseFloat(d.totalMinutes) > parseFloat(worst.totalMinutes) ? d : worst
            , null);

        res.json({
            daily: data,
            hourly: hourlyData,
            summary: {
                avgDailyMinutes: Math.round(avgDaily),
                bestDay: bestDay ? bestDay.date : null,
                worstDay: worstDay ? worstDay.date : null,
                totalDays
            }
        });
    } catch (error) {
        console.error('Trends error:', error);
        res.status(500).json({ error: 'Failed to generate trend data' });
    }
});

// GET /api/analytics/app-usage - Per-app usage breakdown
router.get('/app-usage', async (req, res) => {
    try {
        const { period = '1', category } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const where = {
            userId: req.userId,
            date: { [Op.gte]: startDate.toISOString().split('T')[0] }
        };
        if (category) where.category = category;

        const apps = await ScreenTimeEntry.findAll({
            attributes: [
                'app',
                'category',
                'isDistracting',
                [fn('SUM', col('usageMinutes')), 'totalMinutes'],
                [fn('SUM', col('notifications')), 'totalNotifications'],
                [fn('SUM', col('timesOpened')), 'totalOpened']
            ],
            where,
            group: ['app', 'category', 'isDistracting'],
            order: [[fn('SUM', col('usageMinutes')), 'DESC']],
            raw: true
        });

        res.json({ apps });
    } catch (error) {
        console.error('App usage error:', error);
        res.status(500).json({ error: 'Failed to generate app usage data' });
    }
});

// GET /api/analytics/categories - Category breakdown
router.get('/categories', async (req, res) => {
    try {
        const { period = '1' } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const categories = await ScreenTimeEntry.findAll({
            attributes: [
                'category',
                [fn('SUM', col('usageMinutes')), 'totalMinutes'],
                [fn('COUNT', fn('DISTINCT', col('app'))), 'appCount']
            ],
            where: {
                userId: req.userId,
                date: { [Op.gte]: startDate.toISOString().split('T')[0] }
            },
            group: ['category'],
            order: [[fn('SUM', col('usageMinutes')), 'DESC']],
            raw: true
        });

        const total = categories.reduce((sum, c) => sum + parseFloat(c.totalMinutes), 0);
        categories.forEach(c => {
            c.percent = total > 0 ? Math.round((parseFloat(c.totalMinutes) / total) * 100) : 0;
        });

        // Top apps per category
        const topAppsPerCategory = await ScreenTimeEntry.findAll({
            attributes: [
                'category',
                'app',
                [fn('SUM', col('usageMinutes')), 'totalMinutes']
            ],
            where: {
                userId: req.userId,
                date: { [Op.gte]: startDate.toISOString().split('T')[0] }
            },
            group: ['category', 'app'],
            order: [[fn('SUM', col('usageMinutes')), 'DESC']],
            raw: true
        });

        res.json({ categories, topAppsPerCategory, totalMinutes: total });
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Failed to generate category data' });
    }
});

module.exports = router;
