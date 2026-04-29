/**
 * AttenTrack — Notification Sound Utility
 * Uses the Web Audio API to synthesize tones — no audio files needed.
 */

let audioCtx = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

/**
 * Play a short synthesized chime.
 * @param {number[]} freqs     - Array of frequencies to play in sequence
 * @param {'sine'|'triangle'} type  - Oscillator wave type
 * @param {number} duration    - Duration of each tone in seconds
 * @param {number} volume      - Gain (0–1)
 */
function playTone(freqs, type = 'sine', duration = 0.12, volume = 0.3) {
    try {
        const ctx = getCtx();
        let startTime = ctx.currentTime;

        freqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.01);

            startTime += duration * 0.8;
        });
    } catch (e) {
        // Silently fail if browser blocks audio (e.g., no user interaction yet)
        console.debug('[Sound] Audio blocked:', e.message);
    }
}

/** Soft ascending ding for success */
export function playSuccessSound() {
    playTone([523, 659, 784], 'sine', 0.1, 0.25);
}

/** Descending tone for errors */
export function playErrorSound() {
    playTone([440, 330], 'sine', 0.14, 0.3);
}

/** Alert sounds — severity determines tone */
export function playAlertSound(severity = 'info') {
    switch (severity) {
        case 'critical':
            // Harsh triple beep
            playTone([880, 880, 880], 'square', 0.12, 0.35);
            break;
        case 'warning':
            // Double descending tone
            playTone([660, 440], 'triangle', 0.15, 0.3);
            break;
        case 'info':
        default:
            // Single soft ping
            playTone([523], 'sine', 0.18, 0.2);
            break;
    }
}
