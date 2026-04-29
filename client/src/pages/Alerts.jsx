import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { playAlertSound, playSuccessSound, playErrorSound } from '../utils/notificationSound';

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [triggered, setTriggered] = useState([]);
    const [newAlert, setNewAlert] = useState({ name: '', appOrCategory: '', thresholdMinutes: 60, triggerType: 'usage_limit', severity: 'warning', notificationMethod: 'in_app' });
    const [loading, setLoading] = useState(true);

    const fetchAlerts = () => {
        Promise.all([api.get('/alerts'), api.get('/alerts/check')])
            .then(([r, t]) => { setAlerts(r.data.alerts || []); setStats(r.data.stats || {}); setTriggered(t.data.triggered || []); })
            .catch(console.error).finally(() => setLoading(false));
    };
    const prevTriggeredRef = useRef([]);
    useEffect(() => { fetchAlerts(); }, []);

    // Play sound when new alerts get triggered
    useEffect(() => {
        if (triggered.length > 0 && triggered.length > prevTriggeredRef.current.length) {
            const severities = triggered.map(t => t.severity);
            const worst = severities.includes('critical') ? 'critical'
                : severities.includes('warning') ? 'warning' : 'info';
            playAlertSound(worst);
        }
        prevTriggeredRef.current = triggered;
    }, [triggered]);

    const createAlert = async (e) => {
        e.preventDefault();
        try { await api.post('/alerts', newAlert); playSuccessSound(); toast.success('Alert created'); setShowForm(false); fetchAlerts(); } catch (err) { playErrorSound(); toast.error(err.response?.data?.error || 'Failed'); }
    };

    const dismissAlert = async (id) => { await api.put(`/alerts/${id}`, { dismissed: true }); fetchAlerts(); };
    const deleteAlert = async (id) => { await api.delete(`/alerts/${id}`); playSuccessSound(); toast.success('Deleted'); fetchAlerts(); };

    const sevColors = { info: '#3498DB', warning: '#F39C12', critical: '#E74C3C' };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="alerts-page">
            <div className="page-header"><div></div><button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Create Alert</button></div>

            <div className="summary-cards">
                <div className="summary-card"><span className="summary-icon">🔔</span><div><div className="summary-val">{stats.totalActive || 0}</div><div className="summary-label">Active Alerts</div></div></div>
                <div className="summary-card"><span className="summary-icon">🔴</span><div><div className="summary-val">{stats.totalCritical || 0}</div><div className="summary-label">Critical</div></div></div>
                <div className="summary-card"><span className="summary-icon">⚡</span><div><div className="summary-val">{stats.totalTriggered || 0}</div><div className="summary-label">Total Triggers</div></div></div>
                <div className="summary-card"><span className="summary-icon">🎯</span><div><div className="summary-val">{triggered.length}</div><div className="summary-label">Triggered Now</div></div></div>
            </div>

            {triggered.length > 0 && (
                <div className="card triggered-card">
                    <h3>⚡ Currently Triggered</h3>
                    {triggered.map((t, i) => (
                        <div key={i} className="triggered-item" style={{ borderLeft: `4px solid ${sevColors[t.severity]}` }}>
                            <div><strong>{t.name}</strong><br /><span className="text-muted">{t.appOrCategory} — {t.currentUsage}min / {t.threshold}min limit (over by {t.overBy}min)</span></div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="card add-form-card">
                    <h3>Create Alert Rule</h3>
                    <form onSubmit={createAlert} className="add-form">
                        <div className="form-row">
                            <div className="form-group"><label>Alert Name *</label><input value={newAlert.name} onChange={e => setNewAlert({ ...newAlert, name: e.target.value })} placeholder="e.g. Instagram limit" required /></div>
                            <div className="form-group"><label>App or Category *</label><input value={newAlert.appOrCategory} onChange={e => setNewAlert({ ...newAlert, appOrCategory: e.target.value })} placeholder="e.g. Instagram or Social" required /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Threshold (min)</label><input type="number" value={newAlert.thresholdMinutes} onChange={e => setNewAlert({ ...newAlert, thresholdMinutes: parseInt(e.target.value) })} min={1} /></div>
                            <div className="form-group"><label>Severity</label><select value={newAlert.severity} onChange={e => setNewAlert({ ...newAlert, severity: e.target.value })}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select></div>
                        </div>
                        <div className="form-actions"><button type="submit" className="btn btn-primary">Create Alert</button><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button></div>
                    </form>
                </div>
            )}

            <div className="card">
                <h3>Alert Rules</h3>
                {alerts.length === 0 ? <div className="empty-state">No alerts configured</div> : (
                    <div className="alert-list">
                        {alerts.map(a => (
                            <div key={a.id} className={`alert-item ${a.dismissed ? 'dismissed' : ''}`} style={{ borderLeft: `4px solid ${sevColors[a.severity]}` }}>
                                <div className="alert-info">
                                    <div className="alert-name">{a.name}</div>
                                    <div className="alert-meta">{a.appOrCategory} • {a.thresholdMinutes}min limit • Triggered {a.triggerCount}x</div>
                                </div>
                                <div className="alert-actions">
                                    {!a.dismissed && <button className="btn btn-sm btn-outline" onClick={() => dismissAlert(a.id)}>Dismiss</button>}
                                    <button className="btn btn-sm btn-danger" onClick={() => deleteAlert(a.id)}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
