import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { getTodayQueue, generateQuizOptions } from '../utils/engine';
import type { Frame } from '../types';
import confetti from 'canvas-confetti';
import { X, Volume2, Check } from 'lucide-react';

export const playAudio = (text: string) => {
    if (!window.speechSynthesis) return;
    const spokenText = text.replace(/_+/g, 'blank');
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
};

type CardMode = 'quiz' | 'flip' | 'type';
interface SessionItem {
    frame: Frame;
    mode: CardMode;
}

export default function Session() {
    const { state, recordAnswer, markSessionFinished } = useApp();
    const navigate = useNavigate();

    const queue = useMemo(() => {
        const { newCards, reviewCards } = getTodayQueue(state);
        const q: SessionItem[] = [];

        newCards.forEach(f => q.push({ frame: f, mode: 'quiz' }));
        reviewCards.forEach(f => {
            const r = Math.random();
            if (state.useTyping && r > 0.7) {
                q.push({ frame: f, mode: 'type' });
            } else if (r > 0.5) {
                q.push({ frame: f, mode: 'quiz' });
            } else {
                q.push({ frame: f, mode: 'flip' });
            }
        });

        return q.sort(() => Math.random() - 0.5);
    }, []);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const [isFlipped, setIsFlipped] = useState(false);
    const [quizOptions, setQuizOptions] = useState<Frame[]>([]);
    const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const [typeInput, setTypeInput] = useState('');
    const [typeSubmitted, setTypeSubmitted] = useState(false);

    const currentItem = queue[currentIndex];

    useEffect(() => {
        setIsFlipped(false);
        setSelectedQuizIndex(null);
        setIsCorrect(null);
        setTypeInput('');
        setTypeSubmitted(false);

        if (currentItem?.mode === 'quiz') {
            setQuizOptions(generateQuizOptions(currentItem.frame, 4));
        }
    }, [currentIndex, currentItem]);

    const handleFinish = () => {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setIsFinished(true);
        markSessionFinished();
        setTimeout(() => { navigate('/'); }, 2500);
    };

    // Auto-advance: pick random ease (1=hard, 2=good, 3=easy) — skews toward "good"
    const autoAdvance = (wasCorrect: boolean) => {
        if (!currentItem) return;
        const ease = wasCorrect ? (Math.random() > 0.6 ? 3 : 2) : 1;
        recordAnswer(currentItem.frame.id, ease);
        setTimeout(() => {
            if (currentIndex + 1 >= queue.length) handleFinish();
            else setCurrentIndex(c => c + 1);
        }, 700);
    };

    const handleQuizSelect = (idx: number) => {
        if (selectedQuizIndex !== null) return;
        const correct = quizOptions[idx].id === currentItem.frame.id;
        setSelectedQuizIndex(idx);
        setIsFlipped(true);
        setIsCorrect(correct);
        playAudio(currentItem.frame.text_en);
        autoAdvance(correct);
    };

    const handleFlipReveal = () => {
        setIsFlipped(true);
        playAudio(currentItem.frame.text_en);
    };

    const handleFlipNext = (wasCorrect: boolean) => {
        autoAdvance(wasCorrect);
    };

    const handleTypeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!typeInput.trim()) return;
        setTypeSubmitted(true);
        setIsFlipped(true);
        const correct = typeInput.trim().toLowerCase() === currentItem.frame.text_en.trim().toLowerCase();
        setIsCorrect(correct);
        playAudio(currentItem.frame.text_en);
        autoAdvance(correct);
    };

    const handleTypeHint = () => {
        if (!currentItem) return;
        const words = currentItem.frame.text_en.split(' ');
        setTypeInput(words.slice(0, 2).join(' ') + ' ');
    };

    if (!currentItem) {
        if (!isFinished && queue.length === 0) {
            setTimeout(() => navigate('/'), 1000);
            return <div className="session-container" style={{ justifyContent: 'center', textAlign: 'center' }}>No cards for today!</div>;
        }
        return (
            <div className="session-container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                <h1 className="animate-fade-in" style={{ fontSize: '2rem', color: 'var(--success)', marginBottom: '8px' }}>Session Done!</h1>
                <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>Great job keeping the streak alive.</p>
            </div>
        );
    }

    const progressPct = (currentIndex / Math.max(1, queue.length)) * 100;

    return (
        <div className="session-container">
            {/* Top Bar */}
            <div className="session-topbar">
                <button className="btn-icon" onClick={() => navigate('/')}><X size={20} /></button>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'right' }}>
                    {currentIndex + 1}/{queue.length}
                </span>
            </div>

            {/* Card Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>

                {/* QUIZ MODE */}
                {currentItem.mode === 'quiz' && (
                    <div className="animate-slide-up">
                        <div className="glass-card" style={{ textAlign: 'center', marginBottom: '16px', position: 'relative', padding: '20px' }}>
                            <button
                                onClick={() => playAudio(currentItem.frame.text_en)}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', color: 'var(--accent)', padding: '6px' }}
                            >
                                <Volume2 size={20} />
                            </button>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px', padding: '0 28px' }}>{currentItem.frame.text_en}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose the correct meaning</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {quizOptions.map((opt, idx) => {
                                let bg = 'var(--bg-card)';
                                let border = '1px solid rgba(255,255,255,0.08)';
                                if (selectedQuizIndex !== null) {
                                    if (opt.id === currentItem.frame.id) {
                                        bg = 'rgba(16, 185, 129, 0.2)';
                                        border = '1px solid var(--success)';
                                    } else if (selectedQuizIndex === idx) {
                                        bg = 'rgba(239, 68, 68, 0.2)';
                                        border = '1px solid var(--error)';
                                    }
                                }
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleQuizSelect(idx)}
                                        style={{
                                            background: bg, border,
                                            padding: '14px 16px', borderRadius: '14px', color: 'var(--text-main)',
                                            textAlign: 'left', transition: 'all 0.2s', fontSize: '0.95rem'
                                        }}
                                    >
                                        {opt.hint_ru}
                                    </button>
                                );
                            })}
                        </div>
                        {isFlipped && (
                            <div className="animate-fade-in" style={{ marginTop: '12px', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: isCorrect ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                                    {isCorrect ? '✓ Correct!' : '✗ Wrong'}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* FLIP MODE */}
                {currentItem.mode === 'flip' && (
                    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                            className="glass-card"
                            style={{
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                textAlign: 'center', minHeight: '220px', cursor: !isFlipped ? 'pointer' : 'default',
                                position: 'relative', padding: '24px', marginBottom: '16px'
                            }}
                            onClick={() => !isFlipped && handleFlipReveal()}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); playAudio(currentItem.frame.text_en); }}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', color: 'var(--accent)', padding: '6px', zIndex: 10 }}
                            >
                                <Volume2 size={20} />
                            </button>

                            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px', padding: '0 28px' }}>{currentItem.frame.text_en}</h2>

                            {!isFlipped ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tap to reveal translation</p>
                            ) : (
                                <div className="animate-fade-in" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                                    <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)' }}>{currentItem.frame.hint_ru}</p>
                                </div>
                            )}
                        </div>

                        {isFlipped && (
                            <div className="animate-slide-up" style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleFlipNext(false)}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '14px',
                                        background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                        color: '#f87171', fontWeight: 600, fontSize: '0.9rem'
                                    }}
                                >
                                    ✗ Didn't know
                                </button>
                                <button
                                    onClick={() => handleFlipNext(true)}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '14px',
                                        background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16,185,129,0.3)',
                                        color: '#34d399', fontWeight: 600, fontSize: '0.9rem'
                                    }}
                                >
                                    ✓ Got it!
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* TYPE MODE */}
                {currentItem.mode === 'type' && (
                    <div className="animate-slide-up">
                        <div className="glass-card" style={{ textAlign: 'center', marginBottom: '16px', padding: '20px' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.85rem' }}>Type the English frame for:</p>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>{currentItem.frame.hint_ru}</h2>
                        </div>

                        <form onSubmit={handleTypeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                type="text"
                                value={typeInput}
                                onChange={e => setTypeInput(e.target.value)}
                                disabled={typeSubmitted}
                                placeholder="type here..."
                                autoFocus
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '14px',
                                    background: 'var(--bg-card)', border: typeSubmitted
                                        ? `1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`
                                        : '1px solid rgba(255,255,255,0.15)',
                                    color: 'white', fontSize: '1.1rem', textAlign: 'center',
                                    outline: 'none', transition: 'border 0.2s'
                                }}
                            />

                            {!typeSubmitted ? (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={handleTypeHint}>Hint</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Check <Check size={18} />
                                    </button>
                                </div>
                            ) : null}
                        </form>

                        {typeSubmitted && (
                            <div className="animate-fade-in" style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
                                <p style={{ color: isCorrect ? 'var(--success)' : 'var(--error)', fontWeight: 700, marginBottom: '6px' }}>
                                    {isCorrect ? '✓ Correct!' : '✗ Wrong'}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent)' }}>{currentItem.frame.text_en}</div>
                                    <button
                                        onClick={(e) => { e.preventDefault(); playAudio(currentItem.frame.text_en); }}
                                        style={{ background: 'transparent', color: 'var(--accent)', padding: '4px' }}
                                    >
                                        <Volume2 size={20} />
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Moving to next card...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
