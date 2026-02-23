import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { getTodayQueue } from '../utils/engine';
import { Flame, PlayCircle, Settings, BarChart2 } from 'lucide-react';

export default function Home() {
    const { state, updateSettings } = useApp();
    const navigate = useNavigate();

    const { newCards, reviewCards } = useMemo(() => getTodayQueue(state), [state]);

    const totalCards = newCards.length + reviewCards.length;
    const estimatedMin = Math.max(1, Math.round(totalCards * 0.8));
    const estimatedMax = Math.max(3, Math.round(totalCards * 1.2));

    const learnedCount = Object.keys(state.progress).filter(pId => {
        const id = parseInt(pId);
        return state.activeCourse === 'Level 2' ? id >= 1000 : id < 1000;
    }).length;
    const totalCurrentCourse = state.activeCourse === 'Level 2' ? 2500 : 500;
    const progressPercent = Math.round((learnedCount / totalCurrentCourse) * 100);

    return (
        <div className="container animate-fade-in">
            <div className="header" style={{ padding: '24px 0' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>MaroEng Frames</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon" onClick={() => navigate('/progress')}><BarChart2 size={24} /></button>
                    <button className="btn-icon" onClick={() => navigate('/settings')}><Settings size={24} /></button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Course Selection Toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        onClick={() => updateSettings({ activeCourse: 'Core Challenge' })}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px',
                            background: state.activeCourse === 'Core Challenge' ? 'var(--accent)' : 'transparent',
                            color: state.activeCourse === 'Core Challenge' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Core (500)
                    </button>
                    <button
                        onClick={() => updateSettings({ activeCourse: 'Level 2' })}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px',
                            background: state.activeCourse === 'Level 2' ? 'var(--accent)' : 'transparent',
                            color: state.activeCourse === 'Level 2' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Level 2 (2500)
                    </button>
                </div>

                <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{state.streak}</div>
                        <div style={{ color: 'var(--text-muted)' }}>days in a row</div>
                    </div>
                    <div className="streak-badge">
                        <Flame size={20} fill="currentColor" />
                        Active
                    </div>
                </div>

                <div className="glass-card">
                    <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Today's Plan</h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>New frames</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{newCards.length}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Review (due)</span>
                        <span style={{ fontWeight: 600, color: 'var(--warning)' }}>{reviewCards.length}</span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <span>Estimated time:</span>
                        <span>{estimatedMin}–{estimatedMax} min</span>
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 600 }}>Total Progress ({state.activeCourse})</span>
                        <span style={{ color: 'var(--text-muted)' }}>{learnedCount} / {totalCurrentCourse}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '4px' }} />
                    </div>
                </div>

            </div>

            <div style={{ paddingTop: '24px' }}>
                <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                    onClick={() => navigate('/session')}
                    disabled={totalCards === 0}
                >
                    <PlayCircle size={24} />
                    {totalCards === 0 ? "All done for today!" : "Start Session"}
                </button>
            </div>
        </div>
    );
}
