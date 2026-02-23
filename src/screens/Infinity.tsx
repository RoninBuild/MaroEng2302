import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { getInfinityQueue, generateQuizOptions } from '../utils/engine';
import type { Frame } from '../types';
import { X, Volume2, Infinity as InfinityIcon, RotateCcw } from 'lucide-react';
import { playAudio } from './Session';

export default function InfinitySession() {
    const { state } = useApp();
    const navigate = useNavigate();

    const buildQueue = useCallback(() => getInfinityQueue(state.activeCourse), [state.activeCourse]);

    const [queue, setQueue] = useState<Frame[]>(() => buildQueue());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });

    const currentFrame = queue[currentIndex];
    const options = currentFrame ? generateQuizOptions(currentFrame, 4) : [];

    const handleSelect = (idx: number) => {
        if (selectedIdx !== null) return;
        const correct = options[idx].id === currentFrame.id;
        setSelectedIdx(idx);
        setIsCorrect(correct);
        setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
        playAudio(currentFrame.text_en);

        setTimeout(() => {
            setSelectedIdx(null);
            setIsCorrect(null);
            if (currentIndex + 1 >= queue.length) {
                // Reshuffle and loop
                setQueue(buildQueue());
                setCurrentIndex(0);
            } else {
                setCurrentIndex(i => i + 1);
            }
        }, 700);
    };

    const handleRestart = () => {
        setQueue(buildQueue());
        setCurrentIndex(0);
        setSelectedIdx(null);
        setIsCorrect(null);
        setScore({ correct: 0, total: 0 });
    };

    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const roundsComplete = Math.floor(score.total / queue.length);

    if (!currentFrame) return null;

    return (
        <div className="session-container">
            {/* Top Bar */}
            <div className="session-topbar">
                <button className="btn-icon" onClick={() => navigate('/')}><X size={20} /></button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700 }}>
                        <InfinityIcon size={16} />
                        Infinity Mode
                    </div>
                </div>
                <button className="btn-icon" onClick={handleRestart} title="Restart"><RotateCcw size={18} /></button>
            </div>

            {/* Score Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>{score.correct}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Correct</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentIndex + 1} / {queue.length}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Card</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: accuracy >= 70 ? 'var(--success)' : 'var(--warning)' }}>{accuracy}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Accuracy</div>
                </div>
                {roundsComplete > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>{roundsComplete}×</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rounds</div>
                    </div>
                )}
            </div>

            {/* Question Card */}
            <div className="glass-card animate-slide-up" style={{ textAlign: 'center', marginBottom: '14px', padding: '18px', position: 'relative' }}>
                <button
                    onClick={() => playAudio(currentFrame.text_en)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: 'var(--accent)', padding: '6px' }}
                >
                    <Volume2 size={18} />
                </button>
                <h2 style={{ fontSize: '1.4rem', padding: '0 28px', lineHeight: 1.35 }}>{currentFrame.text_en}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Choose the correct meaning</p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {options.map((opt, idx) => {
                    let bg = 'var(--bg-card)';
                    let border = '2px solid rgba(255,255,255,0.08)';
                    let color = 'var(--text-main)';

                    if (selectedIdx !== null) {
                        if (opt.id === currentFrame.id) {
                            bg = 'rgba(16, 185, 129, 0.15)';
                            border = '2px solid var(--success)';
                            color = '#34d399';
                        } else if (selectedIdx === idx) {
                            bg = 'rgba(239, 68, 68, 0.15)';
                            border = '2px solid var(--error)';
                            color = '#f87171';
                        }
                    }

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleSelect(idx)}
                            style={{
                                background: bg, border,
                                padding: '14px 16px', borderRadius: '14px', color,
                                textAlign: 'left', transition: 'all 0.2s', fontSize: '0.95rem',
                                fontWeight: 500
                            }}
                        >
                            {opt.hint_ru}
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {selectedIdx !== null && (
                <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem', fontWeight: 700 }}>
                    <span style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                        {isCorrect ? '✓ Correct!' : `✗ It was: ${options.find(o => o.id === currentFrame.id)?.hint_ru}`}
                    </span>
                </div>
            )}
        </div>
    );
}
