import { useState, useEffect } from 'react';
import api from '../services/api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const catColors = { Social: '#E74C3C', Entertainment: '#F39C12', Work: '#27AE60', Communication: '#3498DB', News: '#9B59B6', Education: '#1ABC9C', Other: '#95A5A6' };

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('daily');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get(`/analytics/dashboard?view=${view}`),
            api.get('/attention/score')
        ]).then(([dashRes, scoreRes]) => {
            setData(dashRes.data);
            setScore(scoreRes.data);
        }).catch(console.error).finally(() => setLoading(false));
    }, [view]);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!data) return <div className="empty-state">No data yet. Upload your screen time data!</div>;

    const t = data.today;

    // Build the main chart based on the selected view
    const renderMainChart = () => {
        if (view === 'hourly') {
            const hourly = data.hourlyBreakdown || [];
            // Create full 24-hour labels, fill missing hours with 0
            const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
            const productive = new Array(24).fill(0);
            const distracting = new Array(24).fill(0);
            hourly.forEach(h => {
                const hr = parseInt(h.hour);
                productive[hr] = Math.round((parseFloat(h.productiveMinutes) || 0) * 10) / 10;
                distracting[hr] = Math.round((parseFloat(h.distractingMinutes) || 0) * 10) / 10;
            });

            return (
                <div className="chart-card wide">
                    <h3>Today — Hourly Breakdown</h3>
                    <Bar data={{
                        labels,
                        datasets: [
                            { label: 'Productive', data: productive, backgroundColor: 'rgba(39,174,96,0.7)', borderRadius: 4 },
                            { label: 'Distracting', data: distracting, backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 4 }
                        ]
                    }} options={{
                        responsive: true,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            x: { stacked: true, title: { display: true, text: 'Hour' } },
                            y: { stacked: true, title: { display: true, text: 'Minutes' } }
                        }
                    }} />
                </div>
            );
        }

        if (view === 'weekly') {
            const weekLabels = (data.weeklyTrend || []).map(d => new Date(d.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }));
            return (
                <div className="chart-card wide">
                    <h3>Weekly Trend</h3>
                    <Line data={{
                        labels: weekLabels,
                        datasets: [
                            { label: 'Total', data: (data.weeklyTrend || []).map(d => Math.round(parseFloat(d.totalMinutes) / 60 * 10) / 10), borderColor: '#3B4A6B', backgroundColor: 'rgba(59,74,107,0.1)', fill: true, tension: 0.4 },
                            { label: 'Productive', data: (data.weeklyTrend || []).map(d => Math.round((parseFloat(d.productiveMinutes) || 0) / 60 * 10) / 10), borderColor: '#27AE60', backgroundColor: 'rgba(39,174,96,0.1)', fill: true, tension: 0.4 },
                            { label: 'Distracting', data: (data.weeklyTrend || []).map(d => Math.round((parseFloat(d.distractingMinutes) || 0) / 60 * 10) / 10), borderColor: '#E74C3C', backgroundColor: 'rgba(231,76,60,0.1)', fill: true, tension: 0.4 }
                        ]
                    }} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { title: { display: true, text: 'Hours' } } } }} />
                </div>
            );
        }

        // Daily view — bar chart of top apps
        const weekLabels = (data.weeklyTrend || []).map(d => new Date(d.date).toLocaleDateString('en', { weekday: 'short' }));
        return (
            <div className="chart-card wide">
                <h3>This Week</h3>
                <Line data={{
                    labels: weekLabels,
                    datasets: [
                        { label: 'Total', data: (data.weeklyTrend || []).map(d => Math.round(parseFloat(d.totalMinutes) / 60 * 10) / 10), borderColor: '#3B4A6B', backgroundColor: 'rgba(59,74,107,0.1)', fill: true, tension: 0.4 },
                        { label: 'Productive', data: (data.weeklyTrend || []).map(d => Math.round((parseFloat(d.productiveMinutes) || 0) / 60 * 10) / 10), borderColor: '#27AE60', backgroundColor: 'rgba(39,174,96,0.1)', fill: true, tension: 0.4 }
                    ]
                }} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { title: { display: true, text: 'Hours' } } } }} />
            </div>
        );
    };

    return (
        <div className="dashboard-page">
            {/* View Toggle */}
            <div className="view-toggle-container">
                <div className="view-toggle" id="dashboard-view-toggle">
                    {['hourly', 'daily', 'weekly'].map(v => (
                        <button
                            key={v}
                            className={`view-toggle-btn ${view === v ? 'active' : ''}`}
                            onClick={() => setView(v)}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                <div className="metric-card accent">
                    <div className="metric-header"><span className="metric-icon">🧠</span><span className="metric-title">Attention Score</span></div>
                    <div className="metric-value">{score?.score || 0}<span className="metric-unit">/100</span></div>
                    <div className="metric-label">{score?.label || 'N/A'}</div>
                    {score?.change !== null && <div className={`metric-change ${score.change >= 0 ? 'positive' : 'negative'}`}>{score.changeLabel}</div>}
                </div>
                <div className="metric-card">
                    <div className="metric-header"><span className="metric-icon">📱</span><span className="metric-title">Screen Time</span></div>
                    <div className="metric-value">{t.totalFormatted}</div>
                    <div className="metric-label">Today's total</div>
                </div>
                <div className="metric-card green">
                    <div className="metric-header"><span className="metric-icon">✅</span><span className="metric-title">Productive</span></div>
                    <div className="metric-value">{t.productiveFormatted}</div>
                    <div className="progress-bar"><div className="progress-fill green" style={{ width: `${t.goalPercent}%` }}></div></div>
                    <div className="metric-label">{t.goalPercent}% of goal</div>
                </div>
                <div className="metric-card red">
                    <div className="metric-header"><span className="metric-icon">🚫</span><span className="metric-title">Distractions</span></div>
                    <div className="metric-value">{t.distractingFormatted}</div>
                    <div className="metric-label">₹{t.productivityLossCost} lost value</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-grid">
                {renderMainChart()}

                <div className="chart-card">
                    <h3>Categories</h3>
                    {data.categories.length > 0 && (
                        <Doughnut data={{
                            labels: data.categories.map(c => c.category),
                            datasets: [{ data: data.categories.map(c => c.minutes), backgroundColor: data.categories.map(c => catColors[c.category] || '#95A5A6'), borderWidth: 0 }]
                        }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="bottom-grid">
                <div className="card">
                    <h3>Top Apps Today</h3>
                    <div className="app-list">
                        {data.topApps.map((app, i) => (
                            <div key={i} className="app-item">
                                <div className="app-info">
                                    <span className={`app-badge ${app.isDistracting ? 'distracting' : 'productive'}`}>{app.isDistracting ? '🚫' : '✅'}</span>
                                    <div><div className="app-name">{app.app}</div><div className="app-cat">{app.category}</div></div>
                                </div>
                                <div className="app-usage">
                                    <div className="app-time">{Math.floor(app.usageMinutes / 60)}h {Math.round(app.usageMinutes % 60)}m</div>
                                    <div className="mini-bar"><div className="mini-fill" style={{ width: `${(app.usageMinutes / (data.topApps[0]?.usageMinutes || 1)) * 100}%`, backgroundColor: app.isDistracting ? '#E74C3C' : '#27AE60' }}></div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3>Attention Breakdown</h3>
                    {score?.breakdown && Object.entries(score.breakdown).map(([key, val]) => (
                        <div key={key} className="breakdown-item">
                            <div className="breakdown-label">{val.description}</div>
                            <div className="breakdown-bar"><div className="breakdown-fill" style={{ width: `${(val.penalty / 40) * 100}%`, backgroundColor: val.penalty > 20 ? '#E74C3C' : val.penalty > 10 ? '#F39C12' : '#27AE60' }}></div></div>
                            <div className="breakdown-penalty">-{val.penalty}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
