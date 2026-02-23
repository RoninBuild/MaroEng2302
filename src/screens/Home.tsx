import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { getTodayQueue } from '../utils/engine';
import { Flame, PlayCircle, Settings, BarChart2, Loader, Infinity as InfinityIcon } from 'lucide-react';
import { recordSessionOnChain } from '../utils/web3';

export default function Home() {
    const { state, updateSettings } = useApp();
    const navigate = useNavigate();
    const [txPending, setTxPending] = useState(false);

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

    const handleStart = async () => {
        if (totalCards === 0) return;
        setTxPending(true);
        try {
            await recordSessionOnChain(state.activeCourse);
        } catch (_) {
            // allow session even if TX fails/rejected
        } finally {
            setTxPending(false);
            navigate('/session');
        }
    };

    return (
        <div className="home-container animate-fade-in">
            {/* Header */}
            <div className="home-header">
                <div>
                    <h1 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800 }}>MaroEng Frames</h1>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>14-Day Challenge</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-icon" onClick={() => navigate('/progress')}><BarChart2 size={22} /></button>
                    <button className="btn-icon" onClick={() => navigate('/settings')}><Settings size={22} /></button>
                </div>
            </div>

            {/* Course Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', marginBottom: '12px', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <button
                    onClick={() => updateSettings({ activeCourse: 'Core Challenge' })}
                    style={{
                        flex: 1, padding: '9px', borderRadius: '8px',
                        background: state.activeCourse === 'Core Challenge' ? 'var(--accent)' : 'transparent',
                        color: state.activeCourse === 'Core Challenge' ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.2s', fontSize: '0.875rem'
                    }}
                >
                    Core (500)
                </button>
                <button
                    onClick={() => updateSettings({ activeCourse: 'Level 2' })}
                    style={{
                        flex: 1, padding: '9px', borderRadius: '8px',
                        background: state.activeCourse === 'Level 2' ? 'var(--accent)' : 'transparent',
                        color: state.activeCourse === 'Level 2' ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.2s', fontSize: '0.875rem'
                    }}
                >
                    Level 2 (2500)
                </button>
            </div>

            {/* Streak */}
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', marginBottom: '10px' }}>
                <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{state.streak}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>day streak</div>
                </div>
                <div className="streak-badge">
                    <Flame size={15} fill="currentColor" />
                    Active
                </div>
            </div>

            {/* Today's Plan */}
            <div className="glass-card" style={{ marginBottom: '10px', padding: '14px 18px' }}>
                <h2 style={{ marginBottom: '10px', fontSize: '0.95rem', fontWeight: 700 }}>Today's Plan</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>New frames</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>{newCards.length}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review (due)</span>
                    <span style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '0.85rem' }}>{reviewCards.length}</span>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Estimated time</span>
                    <span>{estimatedMin}–{estimatedMax} min</span>
                </div>
            </div>

            {/* Progress */}
            <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Overall Progress</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{learnedCount}/{totalCurrentCourse}</span>
                </div>
                <div style={{ height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '5px', textAlign: 'right' }}>{progressPercent}%</div>
            </div>

            {/* Start Button */}
            <button
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px', opacity: txPending ? 0.8 : 1 }}
                onClick={handleStart}
                disabled={totalCards === 0 || txPending}
            >
                {txPending ? (
                    <><Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Signing on-chain...</>
                ) : (
                    <><PlayCircle size={20} />{totalCards === 0 ? 'All done for today! 🎉' : `Start Session (${totalCards})`}</>
                )}
            </button>

            {/* Infinity Mode Button */}
            <button
                onClick={() => navigate('/infinity')}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '100%', padding: '14px', borderRadius: '16px',
                    background: 'rgba(139, 92, 246, 0.12)',
                    border: '1.5px solid rgba(139, 92, 246, 0.35)',
                    color: '#a78bfa', fontWeight: 700, fontSize: '0.95rem',
                    cursor: 'pointer', transition: 'all 0.2s'
                }}
            >
                <InfinityIcon size={20} />
                Infinity Mode — все {state.activeCourse === 'Level 2' ? '2500' : '500'} фраз
            </button>
        </div>
    );
}
