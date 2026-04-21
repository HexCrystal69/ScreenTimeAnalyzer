// User Tasks routes - Task tracking with distraction impact
const express = require('express');
const router = express.Router();
const { UserTask, ScreenTimeEntry, Settings } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

router.use(authenticate);

// GET /api/tasks - List user's tasks
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const where = { userId: req.userId };
        if (status) where.status = status;

        const tasks = await UserTask.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
        res.json({ tasks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks - Create a task
router.post('/', async (req, res) => {
    try {
        const { title, description, estimatedMinutes, deadline } = req.body;

        if (!title || !estimatedMinutes) {
            return res.status(400).json({ error: 'Title and estimated time are required' });
        }

        const task = await UserTask.create({
            userId: req.userId,
            title,
            description: description || null,
            estimatedMinutes,
            deadline: deadline || null,
            status: 'pending'
        });

        res.status(201).json({ task });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
    try {
        const task = await UserTask.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const { title, description, estimatedMinutes, deadline, status, completionPercent, actualMinutesSpent } = req.body;

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (estimatedMinutes !== undefined) task.estimatedMinutes = estimatedMinutes;
        if (deadline !== undefined) task.deadline = deadline;
        if (completionPercent !== undefined) task.completionPercent = completionPercent;
        if (actualMinutesSpent !== undefined) task.actualMinutesSpent = actualMinutesSpent;

        if (status !== undefined) {
            task.status = status;
            if (status === 'in_progress' && !task.startedAt) {
                task.startedAt = new Date();
            }
            if (status === 'completed') {
                task.completedAt = new Date();
                task.completionPercent = 100;
            }
        }

        await task.save();
        res.json({ task });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// GET /api/tasks/:id/impact - Get distraction impact for a task
router.get('/:id/impact', async (req, res) => {
    try {
        const task = await UserTask.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Calculate distraction time during the task's active period
        const startDate = task.startedAt || task.createdAt;
        const endDate = task.completedAt || new Date();

        const distractingEntries = await ScreenTimeEntry.findAll({
            where: {
                userId: req.userId,
                isDistracting: true,
                date: {
                    [Op.between]: [
                        startDate.toISOString().split('T')[0],
                        endDate.toISOString().split('T')[0]
                    ]
                }
            }
        });

        const totalDistractionMinutes = distractingEntries.reduce((sum, e) => sum + e.usageMinutes, 0);

        // Update task's distraction minutes
        await task.update({ distractionMinutes: totalDistractionMinutes });

        // Calculate what could have been done
        const remaining = task.estimatedMinutes - task.actualMinutesSpent;
        const couldHaveCompleted = Math.min(remaining, totalDistractionMinutes);
        const potentialPercent = task.estimatedMinutes > 0
            ? Math.min(100, task.completionPercent + Math.round((couldHaveCompleted / task.estimatedMinutes) * 100))
            : 0;

        // Get settings for cost calculation
        const settings = await Settings.findOne({ where: { userId: req.userId } });
        const hourlyRate = settings ? settings.hourlyRate : 12.50;
        const costLost = Math.round((totalDistractionMinutes / 60) * hourlyRate * 100) / 100;

        // Top distracting apps during task period
        const topDistractors = distractingEntries
            .reduce((acc, e) => {
                const existing = acc.find(a => a.app === e.app);
                if (existing) existing.minutes += e.usageMinutes;
                else acc.push({ app: e.app, minutes: e.usageMinutes });
                return acc;
            }, [])
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 5);

        const formatTime = (mins) => {
            const h = Math.floor(mins / 60);
            const m = Math.round(mins % 60);
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        res.json({
            task: task.toJSON(),
            impact: {
                distractionMinutes: totalDistractionMinutes,
                distractionFormatted: formatTime(totalDistractionMinutes),
                currentPercent: task.completionPercent,
                potentialPercent,
                additionalPercent: potentialPercent - task.completionPercent,
                costLost,
                topDistractors,
                message: totalDistractionMinutes > 0
                    ? `You were distracted for ${formatTime(totalDistractionMinutes)} during "${task.title}". Without distractions, you could be ${potentialPercent}% done instead of ${task.completionPercent}%.`
                    : `Great focus! No significant distractions detected during "${task.title}".`
            }
        });
    } catch (error) {
        console.error('Task impact error:', error);
        res.status(500).json({ error: 'Failed to calculate impact' });
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
    try {
        const task = await UserTask.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        await task.destroy();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
