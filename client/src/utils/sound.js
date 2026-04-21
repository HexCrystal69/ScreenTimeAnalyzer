/**
 * Plays a short, non-intrusive ping sound to alert the user.
 * Uses the native Web Audio API to avoid needing external audio files.
 */
export const playAlertSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return; // Not supported by the browser
        
        const audioCtx = new AudioContext();
        
        // Master gain for the whole sound
        const masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        masterGain.gain.setValueAtTime(0.4, audioCtx.currentTime); // 40% volume
        
        // Create an oscillator for the "ping"
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine'; // Smooth tone
        
        // Frequency sweep down slightly for a "notification" feel
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
        
        // Volume envelope: sharp attack, quick decay
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
        console.error("Failed to play alert sound via Web Audio API:", err);
    }
};
