import { useState, useEffect } from 'react';
import api from '../services/api';
import { Line, Bar } from 'react-chartjs-2';

export default function Trends() {
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('7');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/analytics/trends?period=${period}`).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, [period]);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!data) return <div className="empty-state">No trend data available.</div>;

    const labels = data.daily.map(d => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }));

    return (
        <div className="trends-page">
            <div className="page-header">
                <div className="period-selector">
                    {['7', '14', '30'].map(p => (
                        <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPeriod(p)}>{p} Days</button>
                    ))}
                </div>
            </div>

            <div className="summary-cards">
                <div className="summary-card"><span className="summary-icon">📊</span><div><div className="summary-val">{Math.floor((data.summary.avgDailyMinutes || 0) / 60)}h {(data.summary.avgDailyMinutes || 0) % 60}m</div><div className="summary-label">Avg Daily Screen Time</div></div></div>
                <div className="summary-card"><span className="summary-icon">🏆</span><div><div className="summary-val">{data.summary.bestDay ? new Date(data.summary.bestDay).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}</div><div className="summary-label">Best Day</div></div></div>
                <div className="summary-card"><span className="summary-icon">📅</span><div><div className="summary-val">{data.summary.totalDays}</div><div className="summary-label">Days Tracked</div></div></div>
            </div>

            <div className="chart-card wide">
                <h3>Daily Breakdown</h3>
                <Line data={{
                    labels,
                    datasets: [
                        { label: 'Total (hrs)', data: data.daily.map(d => (parseFloat(d.totalMinutes) / 60).toFixed(1)), borderColor: '#3B4A6B', backgroundColor: 'rgba(59,74,107,0.1)', fill: true, tension: 0.4 },
                        { label: 'Productive (hrs)', data: data.daily.map(d => (parseFloat(d.productiveMinutes || 0) / 60).toFixed(1)), borderColor: '#27AE60', backgroundColor: 'rgba(39,174,96,0.1)', fill: true, tension: 0.4 },
                        { label: 'Distracting (hrs)', data: data.daily.map(d => (parseFloat(d.distractingMinutes || 0) / 60).toFixed(1)), borderColor: '#E74C3C', backgroundColor: 'rgba(231,76,60,0.1)', fill: true, tension: 0.4 }
                    ]
                }} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </div>

            {data.hourly.length > 0 && (
                <div className="chart-card wide">
                    <h3>Hourly Breakdown (Average)</h3>
                    <Bar data={{
                        labels: data.hourly.map(h => `${h.hour}:00`),
                        datasets: [{
                            label: 'Avg Minutes',
                            data: data.hourly.map(h => parseFloat(h.avgMinutes).toFixed(1)),
                            backgroundColor: data.hourly.map(h => parseFloat(h.distractingMinutes) > parseFloat(h.avgMinutes) * 5 ? '#F39C12' : '#3B4A6B'),
                            borderRadius: 4
                        }]
                    }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
            )}
        </div>
    );
}
