import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [form, setForm] = useState({ type: 'daily', dateFrom: new Date().toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0], format: 'pdf', sections: ['attention_score', 'screen_time', 'app_usage', 'categories'] });
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchReports = () => { api.get('/reports').then(r => setReports(r.data.reports || [])).catch(console.error).finally(() => setLoading(false)); };
    useEffect(() => { fetchReports(); }, []);

    const generate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            await api.post('/reports/generate', form);
            toast.success('Report generated!');
            fetchReports();
        } catch (err) { toast.error('Generation failed'); }
        finally { setGenerating(false); }
    };

    const download = async (report) => {
        try {
            const res = await api.get(`/reports/download/${report.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${report.name || 'report'}.${report.format || 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Download failed');
        }
    };

    const sectionOptions = ['attention_score', 'screen_time', 'app_usage', 'categories', 'trends', 'distractions', 'opportunity_cost'];

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="reports-page">
            <div className="reports-grid">
                {/* Report Builder */}
                <div className="card report-builder">
                    <h3>📄 Generate Report</h3>
                    <form onSubmit={generate}>
                        <div className="form-group">
                            <label>Report Type</label>
                            <div className="type-selector">
                                {['daily', 'weekly', 'monthly', 'distraction'].map(t => (
                                    <button key={t} type="button" className={`type-btn ${form.type === t ? 'active' : ''}`} onClick={() => setForm({ ...form, type: t })}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>From</label><input type="date" value={form.dateFrom} onChange={e => setForm({ ...form, dateFrom: e.target.value })} /></div>
                            <div className="form-group"><label>To</label><input type="date" value={form.dateTo} onChange={e => setForm({ ...form, dateTo: e.target.value })} /></div>
                        </div>
                        <div className="form-group">
                            <label>Sections</label>
                            <div className="section-checks">
                                {sectionOptions.map(s => (
                                    <label key={s} className="checkbox-label">
                                        <input type="checkbox" checked={form.sections.includes(s)} onChange={() => {
                                            const secs = form.sections.includes(s) ? form.sections.filter(x => x !== s) : [...form.sections, s];
                                            setForm({ ...form, sections: secs });
                                        }} />
                                        {s.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Format</label>
                            <div className="toggle-group">
                                {['pdf', 'csv'].map(f => <button key={f} type="button" className={`toggle-btn ${form.format === f ? 'active' : ''}`} onClick={() => setForm({ ...form, format: f })}>{f.toUpperCase()}</button>)}
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={generating}>{generating ? 'Generating...' : '📄 Generate Report'}</button>
                    </form>
                </div>

                {/* Reports History */}
                <div className="card">
                    <h3>📁 Report History</h3>
                    {reports.length === 0 ? <div className="empty-state">No reports generated yet</div> : (
                        <div className="reports-list">
                            {reports.map(r => (
                                <div key={r.id} className="report-item">
                                    <div className="report-info">
                                        <div className="report-name">{r.name}</div>
                                        <div className="report-meta">{r.format.toUpperCase()} • {new Date(r.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <button className="btn btn-sm btn-primary" onClick={() => download(r)} disabled={r.status !== 'generated'}>⬇️ Download</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
