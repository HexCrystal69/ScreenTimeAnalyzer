import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-hero">
                <div className="auth-hero-content">
                    <div className="brand-large"><span>⏱️</span> AttenTrack</div>
                    <h2>Take control of your digital wellbeing</h2>
                    <p>Track screen time, identify distractions, and boost your productivity with intelligent insights.</p>
                    <div className="auth-stats">
                        <div className="auth-stat"><span className="stat-val">73%</span><span className="stat-label">Avg Focus Score</span></div>
                        <div className="auth-stat"><span className="stat-val">2.5h</span><span className="stat-label">Time Saved/Day</span></div>
                        <div className="auth-stat"><span className="stat-val">10k+</span><span className="stat-label">Active Users</span></div>
                    </div>
                </div>
            </div>
            <div className="auth-form-section">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Welcome Back</h2>
                    <p className="text-muted">Sign in to your AttenTrack account</p>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>
                </form>
            </div>
        </div>
    );
}
