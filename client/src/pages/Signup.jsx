import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const strength = (() => {
        let s = 0;
        if (password.length >= 6) s++;
        if (password.length >= 10) s++;
        if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) return toast.error('Passwords do not match');
        if (password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            await register(name, email, password);
            toast.success('Account created!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-hero">
                <div className="auth-hero-content">
                    <div className="brand-large"><span>⏱️</span> AttenTrack</div>
                    <h2>Start your productivity journey</h2>
                    <p>Join thousands of users who have improved their digital habits with AttenTrack.</p>
                    <div className="auth-features">
                        <div className="feature-item">🚫 Detect distracting apps automatically</div>
                        <div className="feature-item">📊 Visual analytics dashboard</div>
                        <div className="feature-item">💡 Smart productivity suggestions</div>
                        <div className="feature-item">📄 Export detailed reports</div>
                    </div>
                </div>
            </div>
            <div className="auth-form-section">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Create Account</h2>
                    <p className="text-muted">Get started with AttenTrack</p>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Morgan" required />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                        <div className="password-strength">
                            {[...Array(4)].map((_, i) => <div key={i} className={`strength-bar ${i < strength ? ['weak', 'fair', 'good', 'strong'][strength - 1] : ''}`} />)}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
                </form>
            </div>
        </div>
    );
}
