// Opportunity Cost Calculator with suggestions

/**
 * Calculate the opportunity cost of distraction time
 * @param {number} distractionMinutes - Total minutes wasted on distracting apps
 * @param {number} hourlyRate - User's configured hourly value rate
 * @param {Array} tasks - User's pending tasks with estimates
 * @returns {Object} - { totalCost, suggestions, taskImpact }
 */
function calculateOpportunityCost(distractionMinutes, hourlyRate = 12.50, tasks = []) {
    const hours = distractionMinutes / 60;
    const totalCost = Math.round(hours * hourlyRate * 100) / 100;

    // Generate "what you could have done" suggestions
    const suggestions = [
        {
            icon: '📚',
            title: `Read ${Math.floor(hours / 12)} book${Math.floor(hours / 12) !== 1 ? 's' : ''}`,
            description: 'At 12 hours per book average',
            hours: Math.round(hours * 10) / 10,
            color: 'green'
        },
        {
            icon: '🎓',
            title: `Completed ${Math.floor(hours / 20)} online course${Math.floor(hours / 20) !== 1 ? 's' : ''}`,
            description: 'Average 20 hours per course',
            hours: Math.round(hours * 10) / 10,
            color: 'green'
        },
        {
            icon: '💰',
            title: `Earned $${totalCost} freelancing`,
            description: `At your $${hourlyRate}/hr rate`,
            value: `$${totalCost}`,
            color: 'amber'
        },
        {
            icon: '🏃',
            title: `Exercised ${Math.floor(hours * 2)} times`,
            description: 'At 30 minutes per session',
            hours: Math.round(hours * 10) / 10,
            color: 'blue'
        },
        {
            icon: '🧘',
            title: `${Math.floor(hours * 4)} meditation sessions`,
            description: 'At 15 minutes per session',
            hours: Math.round(hours * 10) / 10,
            color: 'green'
        },
        {
            icon: '🎵',
            title: `Learned ${Math.floor(hours / 8)} new songs`,
            description: 'At 8 hours practice per song',
            hours: Math.round(hours * 10) / 10,
            color: 'blue'
        }
    ].filter(s => {
        // Only show suggestions where the count is at least 1
        const match = s.title.match(/(\d+)/);
        return match && parseInt(match[1]) >= 1;
    });

    // Calculate impact on user's pending tasks
    const taskImpact = tasks.map(task => {
        const remaining = task.estimatedMinutes - task.actualMinutesSpent;
        const couldHaveCompleted = Math.min(remaining, distractionMinutes);
        const additionalPercent = task.estimatedMinutes > 0
            ? Math.round((couldHaveCompleted / task.estimatedMinutes) * 100)
            : 0;

        return {
            taskId: task.id,
            title: task.title,
            estimatedMinutes: task.estimatedMinutes,
            currentPercent: task.completionPercent,
            couldHaveCompletedMinutes: couldHaveCompleted,
            potentialPercent: Math.min(100, task.completionPercent + additionalPercent),
            message: additionalPercent > 0
                ? `You could have completed ${additionalPercent}% more of "${task.title}"`
                : `Task "${task.title}" is already complete`
        };
    });

    return {
        distractionHours: Math.round(hours * 10) / 10,
        totalCost,
        hourlyRate,
        suggestions,
        taskImpact
    };
}

module.exports = { calculateOpportunityCost };
