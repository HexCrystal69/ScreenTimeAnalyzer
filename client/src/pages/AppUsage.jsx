import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AppUsage() {
    const [apps, setApps] = useState([]);
    const [period, setPeriod] = useState('1');
    const [catFilter, setCatFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/analytics/app-usage?period=${period}${catFilter ? '&category=' + catFilter : ''}`)
            .then(r => setApps(r.data.apps || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [period, catFilter]);

    const categories = ['', 'Social', 'Work', 'Entertainment', 'Communication', 'News', 'Education', 'Other'];
    const maxMinutes = Math.max(...apps.map(a => parseFloat(a.totalMinutes) || 0), 1);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="app-usage-page">
            <div className="page-header">
                <div className="filter-row">
                    <div className="period-selector">
                        {[{ v: '1', l: 'Today' }, { v: '7', l: '7 Days' }, { v: '30', l: '30 Days' }].map(p => (
                            <button key={p.v} className={`btn btn-sm ${period === p.v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPeriod(p.v)}>{p.l}</button>
                        ))}
                    </div>
                    <div className="category-filters">
                        {categories.map(c => (
                            <button key={c || 'all'} className={`badge ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c || 'All'}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr><th>App</th><th>Category</th><th>Time</th><th>Usage Bar</th><th>Opens</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {apps.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">No data for this period</td></tr>
                        ) : apps.map((app, i) => (
                            <tr key={i}>
                                <td><strong>{app.app}</strong></td>
                                <td><span className="badge">{app.category}</span></td>
                                <td>{Math.floor(parseFloat(app.totalMinutes) / 60)}h {Math.round(parseFloat(app.totalMinutes) % 60)}m</td>
                                <td><div className="table-bar"><div className="table-bar-fill" style={{ width: `${(parseFloat(app.totalMinutes) / maxMinutes) * 100}%`, backgroundColor: app.isDistracting ? '#E74C3C' : '#27AE60' }}></div></div></td>
                                <td>{app.totalOpened || 0}</td>
                                <td><span className={`status-badge ${app.isDistracting ? 'distracting' : 'productive'}`}>{app.isDistracting ? '🚫 Distracting' : '✅ Productive'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
