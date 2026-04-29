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
    // Social Media
    { appName: 'Instagram',    type: 'app',     url: 'instagram.com',   category: 'Social' },
    { appName: 'Facebook',     type: 'app',     url: 'facebook.com',    category: 'Social' },
    { appName: 'Twitter / X',  type: 'app',     url: 'twitter.com',     category: 'Social' },
    { appName: 'Snapchat',     type: 'app',     url: 'snapchat.com',    category: 'Social' },
    { appName: 'TikTok',       type: 'app',     url: 'tiktok.com',      category: 'Social' },
    { appName: 'Pinterest',    type: 'website', url: 'pinterest.com',   category: 'Social' },
    { appName: 'LinkedIn',     type: 'app',     url: 'linkedin.com',    category: 'Social' },
    { appName: 'Threads',      type: 'app',     url: 'threads.net',     category: 'Social' },
    { appName: 'ShareChat',    type: 'app',     url: 'sharechat.com',   category: 'Social' },
    { appName: 'Moj',          type: 'app',     url: 'mojapp.in',       category: 'Social' },
    // Entertainment
    { appName: 'YouTube',      type: 'app',     url: 'youtube.com',     category: 'Entertainment' },
    { appName: 'Netflix',      type: 'website', url: 'netflix.com',     category: 'Entertainment' },
    { appName: 'Amazon Prime', type: 'website', url: 'primevideo.com',  category: 'Entertainment' },
    { appName: 'Disney+ Hotstar', type: 'website', url: 'hotstar.com',  category: 'Entertainment' },
    { appName: 'JioCinema',    type: 'website', url: 'jiocinema.com',   category: 'Entertainment' },
    { appName: 'Twitch',       type: 'website', url: 'twitch.tv',       category: 'Entertainment' },
    { appName: 'Spotify',      type: 'app',     url: 'spotify.com',     category: 'Entertainment' },
    { appName: 'SonyLIV',      type: 'website', url: 'sonyliv.com',     category: 'Entertainment' },
    // Gaming
    { appName: 'BGMI',         type: 'app',     url: '',                category: 'Entertainment' },
    { appName: 'Free Fire',    type: 'app',     url: '',                category: 'Entertainment' },
    { appName: 'Steam',        type: 'app',     url: 'store.steampowered.com', category: 'Entertainment' },
    { appName: 'Chess',        type: 'app',     url: 'chess.com',       category: 'Entertainment' },
    { appName: 'MPL',          type: 'app',     url: 'mpl.live',        category: 'Entertainment' },
    // News / Clickbait
    { appName: 'Reddit',       type: 'app',     url: 'reddit.com',      category: 'News' },
    { appName: 'Quora',        type: 'website', url: 'quora.com',       category: 'News' },
    { appName: 'Google News',  type: 'app',     url: 'news.google.com', category: 'News' },
    { appName: 'Inshorts',     type: 'app',     url: 'inshorts.com',    category: 'News' },
    // Messaging (can be distracting)
    { appName: 'WhatsApp',     type: 'app',     url: 'web.whatsapp.com', category: 'Communication' },
    { appName: 'Discord',      type: 'app',     url: 'discord.com',     category: 'Communication' },
    { appName: 'Telegram',     type: 'app',     url: 'telegram.org',    category: 'Communication' },
    // Shopping
    { appName: 'Amazon',       type: 'website', url: 'amazon.in',       category: 'Other' },
    { appName: 'Flipkart',     type: 'website', url: 'flipkart.com',    category: 'Other' },
    { appName: 'Myntra',       type: 'website', url: 'myntra.com',      category: 'Other' },
    { appName: 'Meesho',       type: 'app',     url: 'meesho.com',      category: 'Other' },
    // Food / Delivery
    { appName: 'Zomato',       type: 'app',     url: 'zomato.com',      category: 'Other' },
    { appName: 'Swiggy',       type: 'app',     url: 'swiggy.com',      category: 'Other' },
];

module.exports = { isDistractingApp, flagDistractingEntries, DEFAULT_DISTRACTING_APPS };
