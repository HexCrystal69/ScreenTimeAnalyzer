import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DistractingApps() {
    const [apps, setApps] = useState([]);
    const [newApp, setNewApp] = useState({ appName: '', type: 'app', url: '', category: 'Social' });
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchApps = () => {
        api.get('/distracting-apps').then(r => setApps(r.data.apps || [])).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { fetchApps(); }, []);

    const addApp = async (e) => {
        e.preventDefault();
        try {
            await api.post('/distracting-apps', newApp);
            toast.success(`${newApp.appName} added to distraction list`);
            setNewApp({ appName: '', type: 'app', url: '', category: 'Social' });
            setShowForm(false);
            fetchApps();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to add'); }
    };

    const removeApp = async (id, name) => {
        try {
            await api.delete(`/distracting-apps/${id}`);
            toast.success(`${name} removed`);
            fetchApps();
        } catch (err) { toast.error('Failed to remove'); }
    };

    const toggleBlock = async (app) => {
        try {
            await api.put(`/distracting-apps/${app.id}`, { isBlocked: !app.isBlocked });
            fetchApps();
        } catch (err) { toast.error('Failed to update'); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const catGroups = apps.reduce((acc, a) => { (acc[a.category] = acc[a.category] || []).push(a); return acc; }, {});

    return (
        <div className="distracting-apps-page">
            <div className="page-header">
                <div>
                    <p className="text-muted">Manage apps and websites that distract you. New screen time entries will be auto-flagged.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add App/Website</button>
            </div>

            <div className="summary-cards">
                <div className="summary-card"><span className="summary-icon">🚫</span><div><div className="summary-val">{apps.length}</div><div className="summary-label">Tracked Distractions</div></div></div>
                <div className="summary-card"><span className="summary-icon">🔒</span><div><div className="summary-val">{apps.filter(a => a.isBlocked).length}</div><div className="summary-label">Blocked</div></div></div>
                <div className="summary-card"><span className="summary-icon">🌐</span><div><div className="summary-val">{apps.filter(a => a.type === 'website').length}</div><div className="summary-label">Websites</div></div></div>
                <div className="summary-card"><span className="summary-icon">📱</span><div><div className="summary-val">{apps.filter(a => a.type === 'app').length}</div><div className="summary-label">Apps</div></div></div>
            </div>

            {showForm && (
                <div className="card add-form-card">
                    <h3>Add Distracting App/Website</h3>
                    <form onSubmit={addApp} className="add-form">
                        <div className="form-row">
                            <div className="form-group"><label>Name *</label><input value={newApp.appName} onChange={e => setNewApp({ ...newApp, appName: e.target.value })} placeholder="e.g. Instagram" required /></div>
                            <div className="form-group"><label>Type</label><select value={newApp.type} onChange={e => setNewApp({ ...newApp, type: e.target.value })}><option value="app">App</option><option value="website">Website</option></select></div>
                            <div className="form-group"><label>Category</label><select value={newApp.category} onChange={e => setNewApp({ ...newApp, category: e.target.value })}><option>Social</option><option>Entertainment</option><option>News</option><option>Communication</option><option>Other</option></select></div>
                        </div>
                        <div className="form-group"><label>URL (optional)</label><input value={newApp.url} onChange={e => setNewApp({ ...newApp, url: e.target.value })} placeholder="e.g. instagram.com" /></div>
                        <div className="form-actions"><button type="submit" className="btn btn-primary">Add to List</button><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button></div>
                    </form>
                </div>
            )}

            {Object.entries(catGroups).map(([cat, catApps]) => (
                <div key={cat} className="card">
                    <h3>{cat} ({catApps.length})</h3>
                    <div className="distraction-list">
                        {catApps.map(app => (
                            <div key={app.id} className="distraction-item">
                                <div className="distraction-info">
                                    <span className={`type-badge ${app.type}`}>{app.type === 'website' ? '🌐' : '📱'}</span>
                                    <div>
                                        <div className="distraction-name">{app.appName}</div>
                                        {app.url && <div className="distraction-url">{app.url}</div>}
                                    </div>
                                </div>
                                <div className="distraction-actions">
                                    <button className={`toggle-btn ${app.isBlocked ? 'blocked' : ''}`} onClick={() => toggleBlock(app)} title={app.isBlocked ? 'Unblock' : 'Block'}>
                                        {app.isBlocked ? '🔒 Blocked' : '👁️ Tracking'}
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => removeApp(app.id, app.appName)}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {apps.length === 0 && <div className="empty-state">No distracting apps added yet. Add apps to start tracking!</div>}
        </div>
    );
}
