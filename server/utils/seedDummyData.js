/**
 * AttenTrack — Dummy Data Seeder
 * Seeds 30 days of realistic screen time data for a specific user.
 * Run: node utils/seedDummyData.js
 */

const { sequelize, ScreenTimeEntry, User, Settings } = require('../models');

const TARGET_EMAIL = 'prayaskar024@gmail.com';
const DAYS = 30;

// Realistic app pool with category and distraction flag
const APP_POOL = [
    // Work / Productive
    { app: 'VS Code',         category: 'Work',          isDistracting: false, baseMinutes: [60, 180] },
    { app: 'Google Chrome',   category: 'Work',          isDistracting: false, baseMinutes: [30, 90]  },
    { app: 'Postman',         category: 'Work',          isDistracting: false, baseMinutes: [10, 40]  },
    { app: 'Terminal',        category: 'Work',          isDistracting: false, baseMinutes: [15, 60]  },
    { app: 'Notion',          category: 'Work',          isDistracting: false, baseMinutes: [10, 45]  },
    { app: 'Microsoft Word',  category: 'Work',          isDistracting: false, baseMinutes: [20, 60]  },
    { app: 'Figma',           category: 'Work',          isDistracting: false, baseMinutes: [15, 50]  },
    { app: 'Zoom',            category: 'Communication', isDistracting: false, baseMinutes: [30, 90]  },
    // Social / Entertainment (distracting)
    { app: 'YouTube',         category: 'Entertainment', isDistracting: true,  baseMinutes: [20, 90]  },
    { app: 'Instagram',       category: 'Social',        isDistracting: true,  baseMinutes: [15, 60]  },
    { app: 'Twitter / X',     category: 'Social',        isDistracting: true,  baseMinutes: [10, 45]  },
    { app: 'Reddit',          category: 'Social',        isDistracting: true,  baseMinutes: [10, 50]  },
    { app: 'Netflix',         category: 'Entertainment', isDistracting: true,  baseMinutes: [30, 120] },
    { app: 'Spotify',         category: 'Entertainment', isDistracting: false, baseMinutes: [30, 120] },
    { app: 'Discord',         category: 'Social',        isDistracting: true,  baseMinutes: [15, 60]  },
    { app: 'WhatsApp',        category: 'Communication', isDistracting: false, baseMinutes: [10, 30]  },
    // News / Other
    { app: 'Google News',     category: 'News',          isDistracting: false, baseMinutes: [5, 20]   },
    { app: 'Stack Overflow',  category: 'Education',     isDistracting: false, baseMinutes: [10, 40]  },
    { app: 'GitHub',          category: 'Work',          isDistracting: false, baseMinutes: [10, 50]  },
];

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randInt(min, max) {
    return Math.floor(rand(min, max));
}

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅  Connected to database');

        const user = await User.findOne({ where: { email: TARGET_EMAIL } });
        if (!user) {
            console.error(`❌  User '${TARGET_EMAIL}' not found. Please register first at http://localhost:5173/signup`);
            process.exit(1);
        }
        console.log(`✅  Found user: ${user.name} (id=${user.id})`);

        // Delete existing dummy data if needed (optional — comment out to append)
        const deleted = await ScreenTimeEntry.destroy({ where: { userId: user.id } });
        console.log(`🗑️   Cleared ${deleted} existing entries`);

        const entries = [];
        const today = new Date();

        for (let d = DAYS; d >= 0; d--) {
            const date = new Date(today);
            date.setDate(date.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];

            // Weekend: less work, more distraction
            const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Pick 6–10 apps per day
            const shuffled = [...APP_POOL].sort(() => Math.random() - 0.5);
            const dayApps = shuffled.slice(0, randInt(6, 11));

            for (const appDef of dayApps) {
                // Adjust distraction on weekends
                let [minM, maxM] = appDef.baseMinutes;
                if (isWeekend) {
                    if (appDef.isDistracting) { minM *= 1.5; maxM *= 2; }
                    else { minM *= 0.5; maxM *= 0.7; }
                }

                const usageMinutes = parseFloat(rand(minM, maxM).toFixed(2));
                const hour = appDef.isDistracting
                    ? randInt(14, 23)   // distracting apps more likely in afternoon/evening
                    : randInt(9, 18);   // productive apps during work hours
                const timesOpened = randInt(1, 6);
                const now = date.toISOString();

                entries.push({
                    userId: user.id,
                    app: appDef.app,
                    category: appDef.category,
                    date: dateStr,
                    usageMinutes,
                    timesOpened,
                    isDistracting: appDef.isDistracting,
                    hour,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        await ScreenTimeEntry.bulkCreate(entries);
        console.log(`\n✅  Seeded ${entries.length} entries across ${DAYS + 1} days for '${TARGET_EMAIL}'`);
        console.log(`    Productive entries: ${entries.filter(e => !e.isDistracting).length}`);
        console.log(`    Distracting entries: ${entries.filter(e => e.isDistracting).length}`);
        console.log('\n🎉  Done! Refresh the dashboard to see your data.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌  Seed failed:', error);
        process.exit(1);
    }
}

seed();
