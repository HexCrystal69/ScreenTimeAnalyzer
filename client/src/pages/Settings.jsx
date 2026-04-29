import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { playSuccessSound } from '../utils/notificationSound';

export default function Settings() {
    const [s, setS] = useState(null);
    const [tab, setTab] = useState('profile');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/settings').then(r => setS(r.data.settings)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const save = async () => {
        try {
            await api.put('/settings', s);
            playSuccessSound();
            toast.success('Settings saved!');
        } catch {
            toast.error('Save failed');
        }
    };

    if (loading || !s) return <div className="loading"><div className="spinner"></div></div>;

    const tabs = [
        { key: 'profile',       label: '💼 My Profile' },
        { key: 'general',       label: '🎨 General' },
        { key: 'productive',    label: '⏰ Productive Hours' },
        { key: 'notifications', label: '🔔 Notifications' },
        { key: 'account',       label: '👤 Account' },
    ];

    return (
        <div className="settings-page">
            <div className="settings-tabs">
                {tabs.map(t => <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
            </div>

            <div className="card settings-card">

                {/* ─── MY PROFILE TAB ─────────────────────────────── */}
                {tab === 'profile' && (
                    <>
                        <h3>My Profile</h3>
                        <p className="text-muted" style={{ marginBottom: '24px' }}>
                            Tell us about yourself so we can calculate the real ₹ value of time you lose to distractions.
                        </p>

                        {/* Career card */}
                        <div style={{
                            background: 'var(--bg-primary)', borderRadius: '12px',
                            padding: '20px', marginBottom: '16px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '1.8rem' }}>💼</span>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>Career / Profession</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>What do you do for a living?</div>
                                </div>
                            </div>
                            <input
                                id="settings-career"
                                type="text"
                                value={s.career || ''}
                                onChange={e => setS({ ...s, career: e.target.value })}
                                placeholder="e.g. Software Engineer, Student, Freelancer, Doctor..."
                                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Hourly rate card */}
                        <div style={{
                            background: 'var(--bg-primary)', borderRadius: '12px',
                            padding: '20px', marginBottom: '20px',
                            border: s.hourlyRate ? '1px solid rgba(39,174,96,0.4)' : '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '1.8rem' }}>₹</span>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>Your Time's Worth (₹/hr)</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        Only you know what your time is worth. This is used to calculate opportunity cost.
                                    </div>
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute', left: '14px', top: '50%',
                                    transform: 'translateY(-50%)', fontSize: '1.1rem',
                                    color: 'var(--text-muted)', pointerEvents: 'none', fontWeight: '600'
                                }}>₹</span>
                                <input
                                    id="settings-hourly-rate"
                                    type="number"
                                    value={s.hourlyRate ?? ''}
                                    onChange={e => setS({ ...s, hourlyRate: e.target.value ? parseFloat(e.target.value) : null })}
                                    placeholder="e.g. 800"
                                    min="1"
                                    step="50"
                                    style={{
                                        width: '100%', padding: '12px 14px 12px 36px',
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        borderRadius: '8px', color: 'var(--text-primary)',
                                        fontSize: '1.1rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                                💡 Tip: Monthly salary ÷ working hours/month gives your effective hourly rate.
                                {s.hourlyRate && <span style={{ color: 'var(--green)', marginLeft: '6px' }}>
                                    ✓ Set to ₹{s.hourlyRate}/hr
                                </span>}
                            </p>
                        </div>

                        {/* Live preview */}
                        {s.hourlyRate > 0 && (
                            <div style={{
                                background: 'rgba(91,106,191,0.08)', border: '1px solid rgba(91,106,191,0.25)',
                                borderRadius: '10px', padding: '16px', marginBottom: '16px'
                            }}>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>📊 What this means for you</div>
                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-light)' }}>₹{(s.hourlyRate / 60).toFixed(1)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per minute</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#E74C3C' }}>₹{(s.hourlyRate / 12).toFixed(0)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>lost per 5min distraction</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#F39C12' }}>₹{(s.hourlyRate * 8).toFixed(0)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>daily value (8h day)</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ─── GENERAL TAB ─────────────────────────────────── */}
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
                    </>
                )}

                {/* ─── PRODUCTIVE HOURS TAB ────────────────────────── */}
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

                {/* ─── NOTIFICATIONS TAB ───────────────────────────── */}
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

                {/* ─── ACCOUNT TAB ─────────────────────────────────── */}
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
