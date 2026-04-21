import { useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { playAlertSound } from '../utils/sound';

// Periodically checks the active browser tab and reports to the backend
export default function BrowserTracker() {
    const intervalRef = useRef(null);

    useEffect(() => {
        const checkTab = async () => {
            try {
                if (document.visibilityState === 'hidden') return; // Only track when tab is active
                const tabTitle = document.title;
                const tabUrl = window.location.href;
                const res = await api.post('/distracting-apps/detect', { tabTitle, tabUrl });
                if (res.data.isDistracting) {
                    playAlertSound();
                    toast.error(`⚠️ ${res.data.message}`, { duration: 5000, id: 'distraction-alert' });
                }
            } catch (err) {
                // Silently fail — tracking is best-effort
            }
        };

        intervalRef.current = setInterval(checkTab, 30000); // Every 30 seconds
        return () => clearInterval(intervalRef.current);
    }, []);

    return null; // Invisible component
}
