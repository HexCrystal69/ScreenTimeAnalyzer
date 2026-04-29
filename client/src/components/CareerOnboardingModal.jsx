import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { playSuccessSound } from '../utils/notificationSound';

const STORAGE_KEY = 'attentrack_career_asked';

export default function CareerOnboardingModal() {
    const [show, setShow] = useState(false);
    const [career, setCareer] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1); // 1 = career, 2 = hourly rate

    useEffect(() => {
        // Only show once per browser session + check if user already has settings
        const alreadyAsked = localStorage.getItem(STORAGE_KEY);
        if (alreadyAsked) return;

        api.get('/settings').then(r => {
            const s = r.data.settings;
            // Show modal if career or hourlyRate is not set
            if (!s.career || s.hourlyRate == null) {
                setShow(true);
            }
        }).catch(() => {});
    }, []);

    const handleSkip = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setShow(false);
    };

    const handleNext = () => {
        if (!career.trim()) {
            toast.error('Please enter your career / profession');
            return;
        }
        setStep(2);
    };

    const handleSave = async () => {
        const rate = parseFloat(hourlyRate);
        if (!hourlyRate || isNaN(rate) || rate <= 0) {
            toast.error('Please enter a valid hourly rate (₹)');
            return;
        }
        setSaving(true);
        try {
            await api.put('/settings', { career: career.trim(), hourlyRate: rate });
            localStorage.setItem(STORAGE_KEY, '1');
            playSuccessSound();
            toast.success('Profile saved! Your opportunity cost will now be in ₹.');
            setShow(false);
        } catch {
            toast.error('Could not save — please try again');
        } finally {
            setSaving(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-backdrop" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(6px)'
        }}>
            <div className="modal-box" style={{
                background: 'var(--surface)', borderRadius: '20px',
                padding: '40px', maxWidth: '480px', width: '90%',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                border: '1px solid var(--border)',
                animation: 'fadeInUp 0.3s ease'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {step === 1 ? '💼' : '₹'}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)' }}>
                        {step === 1 ? 'What do you do?' : 'What is your time worth?'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                        {step === 1
                            ? 'Tell us your profession so we can personalise your productivity insights.'
                            : 'Enter your hourly rate in ₹. We\'ll use this to show how much time you\'re losing to distracting apps.'}
                    </p>
                </div>

                {/* Step indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
                    {[1, 2].map(s => (
                        <div key={s} style={{
                            width: '32px', height: '4px', borderRadius: '2px',
                            background: step >= s ? 'var(--accent)' : 'var(--border)',
                            transition: 'background 0.3s'
                        }} />
                    ))}
                </div>

                {/* Step 1: Career */}
                {step === 1 && (
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                            Career / Profession
                        </label>
                        <input
                            id="onboarding-career"
                            type="text"
                            value={career}
                            onChange={e => setCareer(e.target.value)}
                            placeholder="e.g. Software Engineer, Student, Freelancer..."
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                            autoFocus
                        />
                    </div>
                )}

                {/* Step 2: Hourly Rate */}
                {step === 2 && (
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                            Your Hourly Rate (₹)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute', left: '14px', top: '50%',
                                transform: 'translateY(-50%)', fontSize: '1.1rem',
                                color: 'var(--text-muted)', pointerEvents: 'none'
                            }}>₹</span>
                            <input
                                id="onboarding-hourly-rate"
                                type="number"
                                value={hourlyRate}
                                onChange={e => setHourlyRate(e.target.value)}
                                placeholder="e.g. 800"
                                min="1"
                                step="50"
                                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '32px' }}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                autoFocus
                            />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Think: monthly salary ÷ working hours/month
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    {step === 1 ? (
                        <>
                            <button className="btn btn-outline" onClick={handleSkip} style={{ flex: 1 }}>
                                Skip for now
                            </button>
                            <button className="btn btn-primary" onClick={handleNext} style={{ flex: 2 }}>
                                Next →
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: 1 }}>
                                ← Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                                style={{ flex: 2 }}
                            >
                                {saving ? 'Saving...' : '🎯 Save & Continue'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
