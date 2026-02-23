import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ALL_FRAMES } from '../utils/engine';

import { ChevronLeft, Calendar } from 'lucide-react';

export default function Progress() {
    const { state } = useApp();
    const navigate = useNavigate();

    const stats = useMemo(() => {
        const s: Record<string, { total: number; learned: number }> = {};

        ALL_FRAMES.forEach(f => {
            // Filter out frames not in this course
            const isLevel2 = state.activeCourse === 'Level 2';
            if ((isLevel2 && f.id < 1000) || (!isLevel2 && f.id >= 1000)) return;

            const blockName = f.block || 'Core';
            if (!s[blockName]) s[blockName] = { total: 0, learned: 0 };

            s[blockName].total++;
            if (state.progress[f.id] && state.progress[f.id].interval > 0) {
                s[blockName].learned++;
            }
        });

        return s;
    }, [state]);

    const blockEntries = Object.entries(stats);
    const totalLearned = Object.values(stats).reduce((acc, curr) => acc + curr.learned, 0);

    // Generate 14-day calendar heuristic:
    // If streak is N, N days are active. 
    const calendarDays = Array.from({ length: 14 }).map((_, i) => ({
        day: i + 1,
        active: i < Math.min(14, state.streak)
    }));

    return (
        <div className="container animate-fade-in" style={{ padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button className="btn-icon" onClick={() => navigate('/')} style={{ marginRight: '16px' }}><ChevronLeft size={28} /></button>
                <h1 style={{ marginBottom: 0 }}>Progress</h1>
            </div>

            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} /> 14-Day Challenge
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                    {calendarDays.map(d => (
                        <div
                            key={d.day}
                            style={{
                                background: d.active ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                color: d.active ? '#fff' : 'var(--text-muted)',
                                padding: '12px 0',
                                borderRadius: '8px',
                                fontWeight: 600,
                                border: d.active ? 'none' : '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {d.day}
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                    {totalLearned} / {state.activeCourse === 'Level 2' ? 2500 : 500} frames learned
                </p>
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Categories</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {blockEntries.map(([name, data]) => {
                    const pct = data.total === 0 ? 0 : Math.round((data.learned / data.total) * 100);
                    return (
                        <div key={name} className="glass-card" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name.replace(' /', '')}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{data.learned}/{data.total}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: '3px' }} />
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    );
}
