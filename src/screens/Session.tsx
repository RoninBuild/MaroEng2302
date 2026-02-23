import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { getTodayQueue, generateQuizOptions } from '../utils/engine';
import type { Frame } from '../types';
import confetti from 'canvas-confetti';
import { X, Volume2 } from 'lucide-react';

export const playAudio = (text: string) => {
    if (!window.speechSynthesis) return;
    // If the text has a blank "____", pronounce it as "blank" 
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

        // basic shuffle
        return q.sort(() => Math.random() - 0.5);
    }, []); // Only compute once per session

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Specific states for current card
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizOptions, setQuizOptions] = useState<Frame[]>([]);
    const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);

    const [typeInput, setTypeInput] = useState('');
    const [typeSubmitted, setTypeSubmitted] = useState(false);

    const currentItem = queue[currentIndex];

    useEffect(() => {
        // initialize current card
        setIsFlipped(false);
        setSelectedQuizIndex(null);
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
        setTimeout(() => {
            navigate('/');
        }, 2500);
    };

    const nextCard = () => {
        if (currentIndex + 1 >= queue.length) {
            handleFinish();
        } else {
            setCurrentIndex(c => c + 1);
        }
    };

    const handleRate = (ease: number) => {
        if (!currentItem) return;
        recordAnswer(currentItem.frame.id, ease);
        nextCard();
    };

    const handleQuizSelect = (idx: number) => {
        if (selectedQuizIndex !== null) return;
        setSelectedQuizIndex(idx);
        setIsFlipped(true); // reveals standard rating buttons below
    };

    const handleTypeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!typeInput.trim()) return;
        setTypeSubmitted(true);
        setIsFlipped(true); // reveal standard rating
    };

    const handleTypeHint = () => {
        if (!currentItem) return;
        const words = currentItem.frame.text_en.split(' ');
        setTypeInput(words.slice(0, 2).join(' ') + ' ');
    };

    if (!currentItem) {
        if (!isFinished && queue.length === 0) {
            // user entered but 0 cards
            setTimeout(() => navigate('/'), 1000);
            return <div className="container" style={{ alignContent: 'center', textAlign: 'center' }}>No cards for today!</div>;
        }
        return (
            <div className="container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <h1 className="animate-fade-in" style={{ fontSize: '2.5rem', color: 'var(--success)' }}>Session Complete!</h1>
                <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>Great job on keeping up the streak.</p>
            </div>
        );
    }

    const progressPct = ((currentIndex) / Math.max(1, queue.length)) * 100;

    const renderRatingButtons = () => (
        <div className="animate-slide-up" style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            <button style={{ flex: 1, padding: '12px', background: 'var(--again)', color: '#fff' }} onClick={() => handleRate(0)}>Again</button>
            <button style={{ flex: 1, padding: '12px', background: 'var(--hard)', color: '#000' }} onClick={() => handleRate(1)}>Hard</button>
            <button style={{ flex: 1, padding: '12px', background: 'var(--good)', color: '#000' }} onClick={() => handleRate(2)}>Good</button>
            <button style={{ flex: 1, padding: '12px', background: 'var(--easy)', color: '#000' }} onClick={() => handleRate(3)}>Easy</button>
        </div>
    );

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
                <button className="btn-icon" onClick={() => navigate('/')}><X size={24} /></button>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{currentIndex + 1} / {queue.length}</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {currentItem.mode === 'quiz' && (
                    <div className="animate-slide-up">
                        <div className="glass-card" style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
                            <button
                                onClick={() => playAudio(currentItem.frame.text_en)}
                                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', color: 'var(--accent)', padding: '8px' }}
                            >
                                <Volume2 size={24} />
                            </button>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '8px', padding: '0 32px' }}>{currentItem.frame.text_en}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Choose the correct meaning</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {quizOptions.map((opt, idx) => {
                                let bg = 'var(--bg-card)';
                                let border = '1px solid rgba(255,255,255,0.1)';
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
                                            padding: '16px', borderRadius: '12px', color: 'var(--text-main)',
                                            textAlign: 'left', transition: 'all 0.2s'
                                        }}
                                    >
                                        {opt.hint_ru}
                                    </button>
                                )
                            })}
                        </div>
                        {isFlipped && renderRatingButtons()}
                    </div>
                )}

                {currentItem.mode === 'flip' && (
                    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div
                            className="glass-card"
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '300px', cursor: !isFlipped ? 'pointer' : 'default', position: 'relative' }}
                            onClick={() => !isFlipped && setIsFlipped(true)}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); playAudio(currentItem.frame.text_en); }}
                                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', color: 'var(--accent)', padding: '8px', zIndex: 10 }}
                            >
                                <Volume2 size={24} />
                            </button>

                            <h2 style={{ fontSize: '2rem', marginBottom: '16px', padding: '0 32px' }}>{currentItem.frame.text_en}</h2>

                            {!isFlipped ? (
                                <p style={{ color: 'var(--text-muted)' }}>Tap to reveal</p>
                            ) : (
                                <div className="animate-fade-in" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>{currentItem.frame.hint_ru}</p>
                                </div>
                            )}
                        </div>

                        {isFlipped && renderRatingButtons()}
                    </div>
                )}

                {currentItem.mode === 'type' && (
                    <div className="animate-slide-up">
                        <div className="glass-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Type the English frame for:</p>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{currentItem.frame.hint_ru}</h2>
                        </div>

                        <form onSubmit={handleTypeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input
                                type="text"
                                value={typeInput}
                                onChange={e => setTypeInput(e.target.value)}
                                disabled={typeSubmitted}
                                placeholder="type here..."
                                autoFocus
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px',
                                    background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white', fontSize: '1.25rem', textAlign: 'center'
                                }}
                            />

                            {!typeSubmitted ? (
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleTypeHint}>Hint</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2 }}>Check</button>
                                </div>
                            ) : null}
                        </form>

                        {typeSubmitted && (
                            <div className="animate-fade-in" style={{ marginTop: '24px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Correct answer:</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>{currentItem.frame.text_en}</div>
                                    <button
                                        onClick={(e) => { e.preventDefault(); playAudio(currentItem.frame.text_en); }}
                                        style={{ background: 'transparent', color: 'var(--accent)', padding: '4px' }}
                                    >
                                        <Volume2 size={24} />
                                    </button>
                                </div>
                                {renderRatingButtons()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
