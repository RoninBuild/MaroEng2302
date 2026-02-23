import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ChevronLeft, Save } from 'lucide-react';

export default function Settings() {
    const { state, updateSettings, resetProgress } = useApp();
    const navigate = useNavigate();

    const [localCount, setLocalCount] = useState(state.dailyNewCount);
    const [localTyping, setLocalTyping] = useState(state.useTyping);

    const handleSave = () => {
        updateSettings({ dailyNewCount: localCount, useTyping: localTyping });
        navigate('/');
    };

    const handleReset = () => {
        if (window.confirm("Are you sure? This action cannot be undone and will erase all progress.")) {
            resetProgress();
            navigate('/');
        }
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button className="btn-icon" onClick={() => navigate('/')} style={{ marginRight: '16px' }}><ChevronLeft size={28} /></button>
                <h1 style={{ marginBottom: 0 }}>Settings</h1>
            </div>

            <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Daily New Frames</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {[20, 30, 40].map(cnt => (
                            <button
                                key={cnt}
                                onClick={() => setLocalCount(cnt)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '8px',
                                    border: localCount === cnt ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                                    background: localCount === cnt ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-card)',
                                    color: 'white'
                                }}
                            >
                                {cnt}
                            </button>
                        ))}
                    </div>
                    <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Goal: Learn 500 frames in 14 days (approx. 36/day).
                    </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Typing Mode</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enable keyboard input logic.</p>
                    </div>
                    <button
                        onClick={() => setLocalTyping(!localTyping)}
                        style={{
                            width: '50px', height: '28px', borderRadius: '14px',
                            background: localTyping ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                            position: 'relative',
                            transition: 'all 0.3s'
                        }}
                    >
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '12px', background: '#fff',
                            position: 'absolute', top: '2px', left: localTyping ? '24px' : '2px',
                            transition: 'all 0.3s'
                        }} />
                    </button>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

                <div>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
                    >
                        <Save size={20} /> Save Settings
                    </button>

                    <button
                        onClick={handleReset}
                        className="btn-secondary"
                        style={{ color: 'var(--again)', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                    >
                        Reset All Progress
                    </button>
                </div>
            </div>
        </div>
    );
}
