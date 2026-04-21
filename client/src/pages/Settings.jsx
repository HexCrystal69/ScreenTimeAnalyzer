import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
    const [s, setS] = useState(null);
    const [tab, setTab] = useState('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/settings').then(r => setS(r.data.settings)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const save = async () => {
        try { await api.put('/settings', s); toast.success('Settings saved'); } catch { toast.error('Save failed'); }
    };

    if (loading || !s) return <div className="loading"><div className="spinner"></div></div>;

    const tabs = [
        { key: 'general', label: '🎨 General' },
        { key: 'productive', label: '⏰ Productive Hours' },
        { key: 'notifications', label: '🔔 Notifications' },
        { key: 'account', label: '👤 Account' }
    ];

    return (
        <div className="settings-page">
            <div className="settings-tabs">
                {tabs.map(t => <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
            </div>

            <div className="card settings-card">
                {tab === 'general' && (
                    <>
                        <h3>General Settings</h3>
                        <div className="setting-group">
                            <label>Theme</label>
                            <div className="toggle-group">
                                {['dark', 'light', 'system'].map(t => <button key={t} className={`toggle-btn ${s.theme === t ? 'active' : ''}`} onClick={() => setS({ ...s, theme: t })}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
                            </div>
                        </div>
                        <div className="setting-group"><label>Timezone</label><input value={s.timezone} onChange={e => setS({ ...s, timezone: e.target.value })} /></div>
                        <div className="setting-group"><label>Date Format</label><select value={s.dateFormat} onChange={e => setS({ ...s, dateFormat: e.target.value })}><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></div>
                        <div className="setting-group"><label>Hourly Rate ($)</label><input type="number" value={s.hourlyRate} onChange={e => setS({ ...s, hourlyRate: parseFloat(e.target.value) })} step="0.5" min="0" /></div>
                    </>
                )}
                {tab === 'productive' && (
                    <>
                        <h3>Productive Hours</h3>
                        <p className="text-muted">Configure when your productive work hours are. Distraction time during these hours is counted as productivity loss.</p>
                        <div className="form-row">
                            <div className="setting-group"><label>Start Time</label><input type="time" value={s.productiveStart} onChange={e => setS({ ...s, productiveStart: e.target.value })} /></div>
                            <div className="setting-group"><label>End Time</label><input type="time" value={s.productiveEnd} onChange={e => setS({ ...s, productiveEnd: e.target.value })} /></div>
                        </div>
                        <div className="setting-group"><label>Daily Goal (minutes)</label><input type="number" value={s.dailyGoalMinutes} onChange={e => setS({ ...s, dailyGoalMinutes: parseInt(e.target.value) })} min={30} step={30} /></div>
                        <div className="setting-group">
                            <label>Productive Days</label>
                            <div className="day-badges">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                    <button key={d} className={`day-badge ${(s.productiveDays || []).includes(d) ? 'active' : ''}`} onClick={() => {
                                        const days = s.productiveDays || [];
                                        setS({ ...s, productiveDays: days.includes(d) ? days.filter(x => x !== d) : [...days, d] });
                                    }}>{d}</button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {tab === 'notifications' && (
                    <>
                        <h3>Notifications</h3>
                        {Object.entries(s.notifications || {}).map(([key, val]) => (
                            <div key={key} className="setting-group toggle-row">
                                <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</label>
                                <button className={`switch ${val ? 'on' : 'off'}`} onClick={() => setS({ ...s, notifications: { ...s.notifications, [key]: !val } })}>
                                    <span className="switch-thumb"></span>
                                </button>
                            </div>
                        ))}
                    </>
                )}
                {tab === 'account' && (
                    <>
                        <h3>Account</h3>
                        <div className="setting-group"><label>Weekly Email Report</label>
                            <button className={`switch ${s.weeklyReportEmail ? 'on' : 'off'}`} onClick={() => setS({ ...s, weeklyReportEmail: !s.weeklyReportEmail })}>
                                <span className="switch-thumb"></span>
                            </button>
                        </div>
                    </>
                )}
                <div className="form-actions"><button className="btn btn-primary" onClick={save}>Save Settings</button></div>
            </div>
        </div>
    );
}
