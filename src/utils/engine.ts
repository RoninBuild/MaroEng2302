import type { AppState, Frame } from '../types';
import framesData from '../data/frames.json';
import frames2Data from '../data/frames2.json';

export const CORE_FRAMES = framesData as Frame[];
export const LEVEL2_FRAMES = frames2Data as Frame[];
export const ALL_FRAMES = [...CORE_FRAMES, ...LEVEL2_FRAMES];

export function getCourseFrames(state: AppState): Frame[] {
    return state.activeCourse === 'Level 2' ? LEVEL2_FRAMES : CORE_FRAMES;
}

export function getTodayQueue(state: AppState) {
    const now = new Date();
    const courseFrames = getCourseFrames(state);

    const unseenFrames = courseFrames.filter(f => !state.progress[f.id]);
    // Shuffle so daily new cards are random
    const shuffled = [...unseenFrames].sort(() => Math.random() - 0.5);
    const newCards = shuffled.slice(0, state.dailyNewCount);

    const reviewCards = courseFrames.filter(f => {
        const p = state.progress[f.id];
        if (!p) return false;
        return new Date(p.dueDate) <= now;
    });

    return { newCards, reviewCards };
}

// ─── Similarity Scoring (fallback when no pre-built distractors) ─────────────
function getFirstTwo(text: string) { return text.split(' ').slice(0, 2).join(' ').toLowerCase(); }
function getFirstThree(text: string) { return text.split(' ').slice(0, 3).join(' ').toLowerCase(); }

function similarityScore(target: Frame, candidate: Frame): number {
    let score = 0;
    const tWords = target.text_en.toLowerCase().split(/\W+/).filter(Boolean);
    const cWords = candidate.text_en.toLowerCase().split(/\W+/).filter(Boolean);

    if (target.text_en.split(' ')[0].toLowerCase() === candidate.text_en.split(' ')[0].toLowerCase()) score += 5;
    if (getFirstTwo(target.text_en) === getFirstTwo(candidate.text_en)) score += 8;
    if (getFirstThree(target.text_en) === getFirstThree(candidate.text_en)) score += 12;
    if (target.block === candidate.block) score += 3;

    const fillers = new Set(['i', 'to', 'a', 'an', 'the', 'is', 'are', 'was', 'be', 'of', 'in', 'and', 'it', 'not']);
    const targetKeys = tWords.filter(w => w.length > 2 && !fillers.has(w));
    const candidateKeys = new Set(cWords.filter(w => w.length > 2 && !fillers.has(w)));
    score += targetKeys.filter(w => candidateKeys.has(w)).length * 2;
    if (Math.abs(tWords.length - cWords.length) <= 2) score += 2;

    return score;
}

// ─── Smart Quiz Options ───────────────────────────────────────────────────────
export function generateQuizOptions(correctFrame: Frame, count: number = 4): Frame[] {

    // PRIORITY: Use pre-curated distractors from baza666.xlsx
    if (correctFrame.distractors && correctFrame.distractors.length >= 3) {
        const shuffled = [...correctFrame.distractors].sort(() => Math.random() - 0.5);
        const chosen = shuffled.slice(0, count - 1);

        // Build synthetic Frame objects for each distractor string
        const distractorFrames: Frame[] = chosen.map((text, i) => ({
            id: -(correctFrame.id * 100 + i + 1), // negative = never matches correct answer
            block: correctFrame.block,
            text_en: '',
            hint_ru: text,
        }));

        const options = [correctFrame, ...distractorFrames];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return options;
    }

    // FALLBACK: algorithmic similarity (for any frames without pre-built distractors)
    const pool = correctFrame.id < 1000 ? CORE_FRAMES : LEVEL2_FRAMES;
    const candidates = pool
        .filter(f => f.id !== correctFrame.id)
        .map(f => ({ frame: f, score: similarityScore(correctFrame, f) }));
    candidates.sort((a, b) => b.score - a.score);

    const topTier = candidates.slice(0, Math.min(12, candidates.length));
    for (let i = topTier.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topTier[i], topTier[j]] = [topTier[j], topTier[i]];
    }
    const distractors = topTier.slice(0, count - 1).map(c => c.frame);
    const options = [correctFrame, ...distractors];
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
}

// ─── Infinity Mode ────────────────────────────────────────────────────────────
export function getInfinityQueue(course: string): Frame[] {
    const frames = course === 'Level 2' ? LEVEL2_FRAMES : CORE_FRAMES;
    return [...frames].sort(() => Math.random() - 0.5);
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function getTotalLearned(state: AppState) {
    const courseFrames = getCourseFrames(state);
    const courseIds = new Set(courseFrames.map(f => f.id));
    return Object.values(state.progress).filter(p => courseIds.has(p.id) && p.lapses < 5 && p.interval > 0).length;
}

export function getTotalSeen(state: AppState) {
    const courseFrames = getCourseFrames(state);
    const courseIds = new Set(courseFrames.map(f => f.id));
    return Object.values(state.progress).filter(p => courseIds.has(p.id)).length;
}
