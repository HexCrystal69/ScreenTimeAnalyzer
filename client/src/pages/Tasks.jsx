import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', estimatedMinutes: 60, deadline: '' });
    const [impact, setImpact] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTasks = () => { api.get('/tasks').then(r => setTasks(r.data.tasks || [])).catch(console.error).finally(() => setLoading(false)); };
    useEffect(() => { fetchTasks(); }, []);

    const addTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', newTask);
            toast.success('Task created');
            setNewTask({ title: '', description: '', estimatedMinutes: 60, deadline: '' });
            setShowForm(false);
            fetchTasks();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/tasks/${id}`, { status });
            fetchTasks();
        } catch (err) { toast.error('Update failed'); }
    };

    const viewImpact = async (id) => {
        try {
            setSelectedId(id);
            const r = await api.get(`/tasks/${id}/impact`);
            setImpact(r.data);
        } catch (err) { toast.error('Failed to load impact'); }
    };

    const deleteTask = async (id) => {
        await api.delete(`/tasks/${id}`);
        toast.success('Task deleted');
        setImpact(null);
        setSelectedId(null);
        fetchTasks();
    };

    const statusColors = { pending: '#F39C12', in_progress: '#3498DB', completed: '#27AE60', overdue: '#E74C3C' };
    const statusLabels = { pending: '⏳ Pending', in_progress: '🔄 In Progress', completed: '✅ Completed', overdue: '❌ Overdue' };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="tasks-page">
            <div className="page-header">
                <p className="text-muted">Track tasks and see how distractions impact your work completion</p>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ New Task</button>
            </div>

            {showForm && (
                <div className="card add-form-card">
                    <h3>Create Task</h3>
                    <form onSubmit={addTask} className="add-form">
                        <div className="form-group"><label>Task Title *</label><input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Complete project report" required /></div>
                        <div className="form-group"><label>Description</label><textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Optional details..." rows={2} /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Estimated Time (min) *</label><input type="number" value={newTask.estimatedMinutes} onChange={e => setNewTask({ ...newTask, estimatedMinutes: parseInt(e.target.value) })} min={1} required /></div>
                            <div className="form-group"><label>Deadline</label><input type="date" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} /></div>
                        </div>
                        <div className="form-actions"><button type="submit" className="btn btn-primary">Create Task</button><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button></div>
                    </form>
                </div>
            )}

            <div className="tasks-grid">
                <div className="tasks-list">
                    {tasks.length === 0 && <div className="empty-state">No tasks yet. Create a task to track distraction impact!</div>}
                    {tasks.map(task => (
                        <div key={task.id} className={`task-card ${selectedId === task.id ? 'selected' : ''}`} onClick={() => viewImpact(task.id)}>
                            <div className="task-header">
                                <h4>{task.title}</h4>
                                <span className="status-badge" style={{ backgroundColor: statusColors[task.status] + '22', color: statusColors[task.status] }}>{statusLabels[task.status]}</span>
                            </div>
                            {task.description && <p className="task-desc">{task.description}</p>}
                            <div className="task-meta">
                                <span>⏱️ {task.estimatedMinutes}min estimated</span>
                                {task.deadline && <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>}
                            </div>
                            <div className="task-progress">
                                <div className="progress-bar"><div className="progress-fill" style={{ width: `${task.completionPercent}%`, backgroundColor: statusColors[task.status] }}></div></div>
                                <span>{task.completionPercent}% complete</span>
                            </div>
                            {task.distractionMinutes > 0 && (
                                <div className="task-distraction-warn">🚫 {Math.round(task.distractionMinutes)}min lost to distractions</div>
                            )}
                            <div className="task-actions" onClick={e => e.stopPropagation()}>
                                {task.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(task.id, 'in_progress')}>Start</button>}
                                {task.status === 'in_progress' && <button className="btn btn-sm btn-green" onClick={() => updateStatus(task.id, 'completed')}>Complete</button>}
                                <button className="btn btn-sm btn-danger" onClick={() => deleteTask(task.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>

                {impact && (
                    <div className="impact-panel card">
                        <h3>Distraction Impact</h3>
                        <div className="impact-hero">
                            <div className="impact-stat large"><span className="impact-val">{impact.impact.distractionFormatted}</span><span className="impact-label">Time Wasted</span></div>
                            <div className="impact-stat"><span className="impact-val">₹{impact.impact.costLost}</span><span className="impact-label">Value Lost</span></div>
                        </div>
                        <div className="impact-progress">
                            <div className="impact-compare">
                                <div><span>Current Progress</span><strong>{impact.impact.currentPercent}%</strong></div>
                                <div><span>Without Distractions</span><strong className="green">{impact.impact.potentialPercent}%</strong></div>
                            </div>
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${impact.impact.currentPercent}%`, backgroundColor: '#3498DB' }}></div><div className="progress-fill potential" style={{ left: `${impact.impact.currentPercent}%`, width: `${impact.impact.additionalPercent}%`, backgroundColor: '#27AE6088' }}></div></div>
                        </div>
                        <p className="impact-message">{impact.impact.message}</p>
                        {impact.impact.topDistractors?.length > 0 && (
                            <div className="top-distractors">
                                <h4>Top Distractors</h4>
                                {impact.impact.topDistractors.map((d, i) => (
                                    <div key={i} className="distractor-item"><span>{d.app}</span><span>{Math.round(d.minutes)}min</span></div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
