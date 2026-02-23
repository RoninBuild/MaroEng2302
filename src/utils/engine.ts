import type { AppState, Frame } from '../types';
import framesData from '../data/frames.json';
import frames2Data from '../data/frames2.json';

export const ALL_FRAMES = [...(framesData as Frame[]), ...(frames2Data as Frame[])];

export function getTodayQueue(state: AppState) {
    const now = new Date();

    const courseFrames = ALL_FRAMES.filter(f =>
        state.activeCourse === 'Level 2' ? f.id >= 1000 : f.id < 1000
    );

    const unseenFrames = courseFrames.filter(f => !state.progress[f.id]);
    const newCards = unseenFrames.slice(0, state.dailyNewCount);

    const reviewCards = courseFrames.filter(f => {
        const p = state.progress[f.id];
        if (!p) return false;
        // Due dates <= now are due
        return new Date(p.dueDate) <= now;
    });

    return { newCards, reviewCards };
}

export function generateQuizOptions(correctFrame: Frame, count: number = 4) {
    const options = [correctFrame];
    const others = ALL_FRAMES.filter(f => f.id !== correctFrame.id);
    // shuffle others
    for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
    }
    options.push(...others.slice(0, count - 1));
    // shuffle options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
}

export function getTotalLearned(state: AppState) {
    const courseIds = ALL_FRAMES.filter(f => state.activeCourse === 'Level 2' ? f.id >= 1000 : f.id < 1000).map(f => f.id);
    return Object.values(state.progress).filter(p => courseIds.includes(p.id) && p.lapses < 5 && p.interval > 0).length;
}

export function getTotalSeen(state: AppState) {
    const courseIds = ALL_FRAMES.filter(f => state.activeCourse === 'Level 2' ? f.id >= 1000 : f.id < 1000).map(f => f.id);
    return Object.values(state.progress).filter(p => courseIds.includes(p.id)).length;
}
