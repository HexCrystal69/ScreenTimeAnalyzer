import { useState, useEffect } from 'react';
import api from '../services/api';
import { Doughnut, Bar } from 'react-chartjs-2';

const catColors = { Social: '#E74C3C', Entertainment: '#F39C12', Work: '#27AE60', Communication: '#3498DB', News: '#9B59B6', Education: '#1ABC9C', Other: '#95A5A6' };
const catIcons = { Social: '💬', Entertainment: '🎮', Work: '💼', Communication: '📞', News: '📰', Education: '📚', Other: '📦' };

export default function Categories() {
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('7');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/analytics/categories?period=${period}`).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, [period]);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!data) return <div className="empty-state">No category data available.</div>;

    return (
        <div className="categories-page">
            <div className="page-header">
                <div className="period-selector">
                    {[{ v: '1', l: 'Today' }, { v: '7', l: '7 Days' }, { v: '30', l: '30 Days' }].map(p => (
                        <button key={p.v} className={`btn btn-sm ${period === p.v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPeriod(p.v)}>{p.l}</button>
                    ))}
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Category Breakdown</h3>
                    {data.categories.length > 0 && (
                        <Doughnut data={{
                            labels: data.categories.map(c => c.category),
                            datasets: [{ data: data.categories.map(c => parseFloat(c.totalMinutes)), backgroundColor: data.categories.map(c => catColors[c.category] || '#95A5A6'), borderWidth: 2, borderColor: '#1a1d2e' }]
                        }} options={{ responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom' } } }} />
                    )}
                </div>
                <div className="chart-card">
                    <h3>Time by Category</h3>
                    {data.categories.length > 0 && (
                        <Bar data={{
                            labels: data.categories.map(c => c.category),
                            datasets: [{ label: 'Hours', data: data.categories.map(c => (parseFloat(c.totalMinutes) / 60).toFixed(1)), backgroundColor: data.categories.map(c => catColors[c.category] || '#95A5A6'), borderRadius: 6 }]
                        }} options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }} />
                    )}
                </div>
            </div>

            <div className="category-cards">
                {data.categories.map(cat => (
                    <div className="category-card" key={cat.category} style={{ borderLeft: `4px solid ${catColors[cat.category] || '#95A5A6'}` }}>
                        <div className="cat-header">
                            <span className="cat-icon">{catIcons[cat.category] || '📦'}</span>
                            <h4>{cat.category}</h4>
                        </div>
                        <div className="cat-stats">
                            <div className="cat-time">{Math.floor(parseFloat(cat.totalMinutes) / 60)}h {Math.round(parseFloat(cat.totalMinutes) % 60)}m</div>
                            <div className="cat-meta">{cat.percent}% of total • {cat.appCount} apps</div>
                        </div>
                        <div className="cat-apps">
                            {(data.topAppsPerCategory || []).filter(a => a.category === cat.category).slice(0, 3).map((a, i) => (
                                <span key={i} className="cat-app-tag">{a.app}: {Math.round(parseFloat(a.totalMinutes))}m</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
