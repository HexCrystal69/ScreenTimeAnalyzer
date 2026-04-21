// Seed data script — populates sample 30-day screentime data
const { sequelize, User, ScreenTimeEntry, DistractingApp, Settings, Alert, UserTask } = require('../models');

const apps = [
    { app: 'Instagram', category: 'Social', distracting: true },
    { app: 'YouTube', category: 'Entertainment', distracting: true },
    { app: 'Chrome', category: 'Work', distracting: false },
    { app: 'Slack', category: 'Work', distracting: false },
    { app: 'VS Code', category: 'Work', distracting: false },
    { app: 'Twitter', category: 'Social', distracting: true },
    { app: 'Reddit', category: 'Social', distracting: true },
    { app: 'WhatsApp', category: 'Communication', distracting: false },
    { app: 'Spotify', category: 'Entertainment', distracting: true },
    { app: 'Netflix', category: 'Entertainment', distracting: true },
    { app: 'Facebook', category: 'Social', distracting: true },
    { app: 'Zoom', category: 'Work', distracting: false },
    { app: 'Gmail', category: 'Work', distracting: false }
];

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('Database synced (tables recreated)');

        // Create demo user
        const user = await User.create({ name: 'Prayaskar', email: 'prayaskar024@gmail.com', password: 'password123' });
        console.log('Demo user created: prayaskar024@gmail.com / password123');

        await Settings.create({ userId: user.id });

        // Generate 30 days of data
        const entries = [];
        const today = new Date();
        for (let d = 0; d < 30; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            for (const appInfo of apps) {
                let baseUsage = appInfo.distracting ? 40 + Math.random() * 80 : 20 + Math.random() * 60;
                if (isWeekend && appInfo.distracting) baseUsage *= 1.5;
                if (isWeekend && !appInfo.distracting) baseUsage *= 0.3;

                entries.push({
                    userId: user.id, app: appInfo.app, category: appInfo.category,
                    date: dateStr, usageMinutes: Math.round(baseUsage * 10) / 10,
                    notifications: Math.floor(Math.random() * (appInfo.distracting ? 40 : 15)),
                    timesOpened: Math.floor(Math.random() * (appInfo.distracting ? 20 : 8)),
                    isDistracting: appInfo.distracting
                });

                // Add hourly entries for today and yesterday
                if (d < 2) {
                    for (let h = 8; h < 22; h++) {
                        const hourUsage = baseUsage / 14 * (0.5 + Math.random());
                        entries.push({
                            userId: user.id, app: appInfo.app, category: appInfo.category,
                            date: dateStr, usageMinutes: Math.round(hourUsage * 10) / 10,
                            notifications: Math.floor(Math.random() * 5), timesOpened: Math.floor(Math.random() * 3),
                            isDistracting: appInfo.distracting, hour: h
                        });
                    }
                }
            }
        }
        await ScreenTimeEntry.bulkCreate(entries);
        console.log(`${entries.length} screen time entries created`);

        // Sample alerts
        await Alert.bulkCreate([
            { userId: user.id, name: 'Instagram limit exceeded', triggerType: 'usage_limit', appOrCategory: 'Instagram', thresholdMinutes: 60, severity: 'critical', notificationMethod: 'in_app' },
            { userId: user.id, name: 'Social media spike', triggerType: 'distraction_spike', appOrCategory: 'Social', thresholdMinutes: 120, severity: 'warning', notificationMethod: 'in_app' },
            { userId: user.id, name: 'Weekly goal missed', triggerType: 'goal_missed', appOrCategory: 'All', thresholdMinutes: 360, severity: 'info', notificationMethod: 'both' }
        ]);

        // Sample tasks
        await UserTask.bulkCreate([
            { userId: user.id, title: 'Complete project report', estimatedMinutes: 180, status: 'in_progress', completionPercent: 35, actualMinutesSpent: 63, distractionMinutes: 45, startedAt: new Date() },
            { userId: user.id, title: 'Study for exam', estimatedMinutes: 300, status: 'pending', completionPercent: 0 },
            { userId: user.id, title: 'Code review PRs', estimatedMinutes: 60, status: 'in_progress', completionPercent: 50, actualMinutesSpent: 30, startedAt: new Date() }
        ]);

        console.log('Seed data complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
