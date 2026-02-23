import { createContext, useContext, useState, useEffect } from 'react';
import type { AppState, UserProgressFrame } from './types';

interface AppContextType {
    state: AppState;
    updateSettings: (settings: Partial<AppState>) => void;
    recordAnswer: (frameId: number, ease: number) => void;
    resetProgress: () => void;
    markSessionFinished: () => void;
}

const defaultState: AppState = {
    progress: {},
    streak: 0,
    lastFinishedSessionDate: null,
    dailyNewCount: 36,
    useTyping: true,
    activeCourse: 'Core Challenge',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(() => {
        const saved = localStorage.getItem('maroeng_state');
        if (saved) {
            try {
                return { ...defaultState, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Failed to parse state", e);
            }
        }
        return defaultState;
    });

    useEffect(() => {
        localStorage.setItem('maroeng_state', JSON.stringify(state));
    }, [state]);

    const updateSettings = (settings: Partial<AppState>) => {
        setState(s => ({ ...s, ...settings }));
    };

    const resetProgress = () => {
        setState(s => ({ ...s, progress: {}, streak: 0, lastFinishedSessionDate: null }));
    };

    const markSessionFinished = () => {
        const today = new Date().toISOString().split('T')[0];
        setState(s => {
            let newStreak = s.streak;
            if (s.lastFinishedSessionDate !== today) {
                // check streak
                if (s.lastFinishedSessionDate) {
                    const lastDate = new Date(s.lastFinishedSessionDate);
                    const currDate = new Date(today);
                    const diffDiff = currDate.getTime() - lastDate.getTime();
                    const daysDiff = Math.round(diffDiff / (1000 * 3600 * 24));
                    if (daysDiff === 1) {
                        newStreak += 1;
                    } else if (daysDiff > 1) {
                        newStreak = 1; // reset streak if missed
                    }
                } else {
                    newStreak = 1;
                }
            }
            return { ...s, streak: newStreak, lastFinishedSessionDate: today };
        });
    };

    const recordAnswer = (frameId: number, ease: number) => {
        // ease: 0=Again, 1=Hard, 2=Good, 3=Easy
        setState(s => {
            const now = new Date();
            const existing = s.progress[frameId];

            let newInterval = 0;
            let newLapses = existing ? existing.lapses : 0;

            if (!existing) {
                // First time seeing
                if (ease === 0) newInterval = 0;
                else if (ease === 1) newInterval = 1;
                else if (ease === 2) newInterval = 2;
                else newInterval = 4;
            } else {
                const prevInterval = existing.interval;
                if (ease === 0) {
                    newInterval = 0;
                    newLapses += 1;
                } else if (ease === 1) {
                    newInterval = prevInterval === 0 ? 1 : Math.max(1, Math.round(prevInterval * 1.2));
                } else if (ease === 2) {
                    newInterval = prevInterval === 0 ? 1 : Math.round(prevInterval * 2);
                } else {
                    newInterval = prevInterval === 0 ? 4 : Math.round(prevInterval * 2.5);
                }
            }

            // Calculate new due date
            const dueDate = new Date(now);
            dueDate.setDate(dueDate.getDate() + newInterval);

            const updatedFrame: UserProgressFrame = {
                id: frameId,
                ease,
                interval: newInterval,
                dueDate: dueDate.toISOString(),
                lapses: newLapses,
                lastSeen: now.toISOString()
            };

            return {
                ...s,
                progress: {
                    ...s.progress,
                    [frameId]: updatedFrame
                }
            };
        });
    };

    return (
        <AppContext.Provider value={{ state, updateSettings, recordAnswer, resetProgress, markSessionFinished }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
