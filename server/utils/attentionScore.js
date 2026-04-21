// Attention Score Calculator — Rule-based (no ML)
// Score ranges from 0-100, where 100 = perfect focus health

/**
 * Calculate attention cost score based on usage data
 * @param {Object} data - { totalMinutes, distractingMinutes, appSwitches, notifications, productiveMinutes, productiveGoal }
 * @returns {Object} - { score, breakdown, label }
 */
function calculateAttentionScore(data) {
    const {
        totalMinutes = 0,
        distractingMinutes = 0,
        appSwitches = 0,
        notifications = 0,
        productiveMinutes = 0,
        productiveGoal = 360 // default 6h
    } = data;

    let score = 100;
    const breakdown = {};

    // 1. Distraction Ratio Penalty (0-40 points)
    // More distraction time relative to total = higher penalty
    const distractionRatio = totalMinutes > 0 ? distractingMinutes / totalMinutes : 0;
    const distractionPenalty = Math.min(40, Math.round(distractionRatio * 80));
    score -= distractionPenalty;
    breakdown.distractionRatio = {
        penalty: distractionPenalty,
        ratio: Math.round(distractionRatio * 100),
        description: `${Math.round(distractionRatio * 100)}% of screen time on distracting apps`
    };

    // 2. App Switching Penalty (0-20 points)
    // High frequency switching indicates fragmented attention
    // Baseline: ~20 switches/day is normal, >60 is excessive
    const switchPenalty = Math.min(20, Math.round((appSwitches / 60) * 20));
    score -= switchPenalty;
    breakdown.appSwitching = {
        penalty: switchPenalty,
        count: appSwitches,
        description: `${appSwitches} app switches (${appSwitches > 40 ? 'high' : appSwitches > 20 ? 'moderate' : 'low'} fragmentation)`
    };

    // 3. Notification Overload Penalty (0-20 points)
    // Baseline: ~30 notifications is normal, >100 is excessive
    const notifPenalty = Math.min(20, Math.round((notifications / 100) * 20));
    score -= notifPenalty;
    breakdown.notifications = {
        penalty: notifPenalty,
        count: notifications,
        description: `${notifications} notifications (${notifications > 80 ? 'overwhelming' : notifications > 40 ? 'moderate' : 'manageable'})`
    };

    // 4. Productive Hours Adherence (0-20 points)
    // How well did the user use their configured productive hours?
    const adherenceRatio = productiveGoal > 0 ? Math.min(1, productiveMinutes / productiveGoal) : 0.5;
    const adherencePenalty = Math.round((1 - adherenceRatio) * 20);
    score -= adherencePenalty;
    breakdown.productiveAdherence = {
        penalty: adherencePenalty,
        ratio: Math.round(adherenceRatio * 100),
        description: `${Math.round(adherenceRatio * 100)}% of productive hours goal achieved`
    };

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine label
    let label;
    if (score >= 85) label = 'Excellent focus health';
    else if (score >= 70) label = 'Good focus health';
    else if (score >= 50) label = 'Moderate focus health';
    else if (score >= 30) label = 'Poor focus health';
    else label = 'Critical — high distraction';

    return { score, breakdown, label };
}

module.exports = { calculateAttentionScore };
