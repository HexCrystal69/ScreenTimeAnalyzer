// Distraction matcher - matches screen time entries against user's distraction list

/**
 * Check if an app name matches any entry in the user's distraction list
 * @param {string} appName - Name of the app to check
 * @param {Array} distractingApps - User's list of distracting apps
 * @returns {boolean}
 */
function isDistractingApp(appName, distractingApps) {
    const normalizedName = appName.toLowerCase().trim();

    return distractingApps.some(app => {
        const normalizedApp = app.appName.toLowerCase().trim();

        // Exact match
        if (normalizedName === normalizedApp) return true;

        // Partial/fuzzy match - app name contains or is contained by list entry
        if (normalizedName.includes(normalizedApp) || normalizedApp.includes(normalizedName)) return true;

        // URL match if provided
        if (app.url) {
            const normalizedUrl = app.url.toLowerCase().trim();
            if (normalizedName.includes(normalizedUrl) || normalizedUrl.includes(normalizedName)) return true;
        }

        return false;
    });
}

/**
 * Flag screen time entries as distracting based on user's list
 * @param {Array} entries - Screen time entries
 * @param {Array} distractingApps - User's distracting apps list
 * @returns {Array} - Entries with isDistracting flag set
 */
function flagDistractingEntries(entries, distractingApps) {
    return entries.map(entry => ({
        ...entry,
        isDistracting: isDistractingApp(entry.app, distractingApps)
    }));
}

// Default commonly distracting apps preset list
const DEFAULT_DISTRACTING_APPS = [
    { appName: 'Instagram', type: 'app', url: 'instagram.com', category: 'Social' },
    { appName: 'TikTok', type: 'app', url: 'tiktok.com', category: 'Social' },
    { appName: 'Facebook', type: 'app', url: 'facebook.com', category: 'Social' },
    { appName: 'Twitter', type: 'app', url: 'twitter.com', category: 'Social' },
    { appName: 'Reddit', type: 'app', url: 'reddit.com', category: 'Social' },
    { appName: 'YouTube', type: 'app', url: 'youtube.com', category: 'Entertainment' },
    { appName: 'Netflix', type: 'website', url: 'netflix.com', category: 'Entertainment' },
    { appName: 'Twitch', type: 'website', url: 'twitch.tv', category: 'Entertainment' },
    { appName: 'Snapchat', type: 'app', url: 'snapchat.com', category: 'Social' },
    { appName: 'Pinterest', type: 'website', url: 'pinterest.com', category: 'Social' }
];

module.exports = { isDistractingApp, flagDistractingEntries, DEFAULT_DISTRACTING_APPS };
