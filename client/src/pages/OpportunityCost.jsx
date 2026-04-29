import { useState, useEffect } from 'react';
import api from '../services/api';
import { Bar } from 'react-chartjs-2';

export default function OpportunityCost() {
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('30');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/opportunity/cost?period=${period}`).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, [period]);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!data) return <div className="empty-state">No data available.</div>;

    return (
        <div className="opportunity-page">
            <div className="page-header">
                <div className="period-selector">
                    {[{ v: '7', l: '7 Days' }, { v: '14', l: '14 Days' }, { v: '30', l: '30 Days' }].map(p => (
                        <button key={p.v} className={`btn btn-sm ${period === p.v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPeriod(p.v)}>{p.l}</button>
                    ))}
                </div>
            </div>

            {/* Hero Card */}
            <div className="cost-hero">
                <div className="cost-hero-inner">
                    <div className="cost-stat large"><span className="cost-val">₹{data.totalCost}</span><span className="cost-label">Productive Value Lost</span></div>
                    <div className="cost-stat"><span className="cost-val">{data.distractionHours}h</span><span className="cost-label">Distraction Hours</span></div>
                    <div className="cost-stat"><span className="cost-val">₹{data.hourlyRate}/hr</span><span className="cost-label">Your Rate</span></div>
                </div>
            </div>

            <div className="charts-grid">
                {/* App Breakdown */}
                <div className="chart-card">
                    <h3>Cost by App</h3>
                    {data.appBreakdown?.length > 0 && (
                        <Bar data={{
                            labels: data.appBreakdown.slice(0, 8).map(a => a.app),
                            datasets: [{ label: 'Cost (₹)', data: data.appBreakdown.slice(0, 8).map(a => a.cost), backgroundColor: '#E74C3C88', borderColor: '#E74C3C', borderWidth: 1, borderRadius: 4 }]
                        }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    )}
                </div>

                {/* Suggestions */}
                <div className="card">
                    <h3>💡 What You Could've Done Instead</h3>
                    <div className="suggestions-list">
                        {data.suggestions?.map((s, i) => (
                            <div key={i} className="suggestion-item">
                                <span className="suggestion-icon">{s.icon}</span>
                                <div><div className="suggestion-title">{s.title}</div><div className="suggestion-desc">{s.description}</div></div>
                            </div>
                        ))}
                        {(!data.suggestions || data.suggestions.length === 0) && <p className="text-muted">Keep distracting time low — great job!</p>}
                    </div>
                </div>
            </div>

            {/* Task Impact */}
            {data.taskImpact?.length > 0 && (
                <div className="card">
                    <h3>📋 Task Impact</h3>
                    <p className="text-muted">How distractions affected your pending tasks</p>
                    <div className="task-impact-list">
                        {data.taskImpact.map((t, i) => (
                            <div key={i} className="task-impact-item">
                                <div className="task-impact-info"><strong>{t.title}</strong><span>{t.message}</span></div>
                                <div className="task-impact-bar"><div className="progress-bar"><div className="progress-fill" style={{ width: `${t.currentPercent}%` }}></div><div className="progress-fill potential" style={{ left: `${t.currentPercent}%`, width: `${t.potentialPercent - t.currentPercent}%`, backgroundColor: '#27AE6066' }}></div></div><span>{t.currentPercent}% → {t.potentialPercent}%</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* App Table */}
            {data.appBreakdown?.length > 0 && (
                <div className="card">
                    <h3>App Cost Breakdown</h3>
                    <table className="data-table">
                        <thead><tr><th>App</th><th>Hours</th><th>Sessions</th><th>Cost</th><th>Action</th></tr></thead>
                        <tbody>
                            {data.appBreakdown.map((a, i) => (
                                <tr key={i}><td><strong>{a.app}</strong></td><td>{a.hours}h</td><td>{a.sessions}</td><td className="cost-cell">₹{a.cost}</td><td><span className={`rec-badge ${a.recommendation.toLowerCase().replace(' ', '-')}`}>{a.recommendation}</span></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
