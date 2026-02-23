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
    // Shuffle unseen frames so daily new cards are random
    const shuffled = [...unseenFrames].sort(() => Math.random() - 0.5);
    const newCards = shuffled.slice(0, state.dailyNewCount);

    const reviewCards = courseFrames.filter(f => {
        const p = state.progress[f.id];
        if (!p) return false;
        return new Date(p.dueDate) <= now;
    });

    return { newCards, reviewCards };
}

// ─── Smart Distractor Generation ────────────────────────────────────────────
// Extract the "subject" (first word) from an English frame
function getSubject(text: string): string {
    return text.split(' ')[0].toLowerCase();
}

// Extract first 2 words (subject + first verb/auxiliary)
function getFirstTwo(text: string): string {
    return text.split(' ').slice(0, 2).join(' ').toLowerCase();
}

// Extract first 3 words
function getFirstThree(text: string): string {
    return text.split(' ').slice(0, 3).join(' ').toLowerCase();
}

// Score how "confusable" a candidate is with the target frame
// Higher = more similar = better distractor
function similarityScore(target: Frame, candidate: Frame): number {
    let score = 0;

    const tWords = target.text_en.toLowerCase().split(/\W+/).filter(Boolean);
    const cWords = candidate.text_en.toLowerCase().split(/\W+/).filter(Boolean);

    // Same first word (subject): "I", "You", "She", etc.
    if (getSubject(target.text_en) === getSubject(candidate.text_en)) score += 5;

    // Same first 2 words (e.g. "I am", "I want", "you are")
    if (getFirstTwo(target.text_en) === getFirstTwo(candidate.text_en)) score += 8;

    // Same first 3 words
    if (getFirstThree(target.text_en) === getFirstThree(candidate.text_en)) score += 12;

    // Same block
    if (target.block === candidate.block) score += 3;

    // Shared key words (not filler)
    const fillers = new Set(['i', 'to', 'a', 'an', 'the', 'is', 'are', 'was', 'be', 'of', 'in', 'and', 'it', 'not']);
    const targetKeyWords = tWords.filter(w => w.length > 2 && !fillers.has(w));
    const candidateKeyWords = new Set(cWords.filter(w => w.length > 2 && !fillers.has(w)));
    const shared = targetKeyWords.filter(w => candidateKeyWords.has(w));
    score += shared.length * 2;

    // Similar phrase length (±2 words)
    if (Math.abs(tWords.length - cWords.length) <= 2) score += 2;

    return score;
}

export function generateQuizOptions(correctFrame: Frame, count: number = 4): Frame[] {
    // CRITICAL: only pull distractors from the SAME course as the correct frame
    // Core frames have clean Russian in hint_ru; Level 2 may have mixed English/Russian
    const pool = correctFrame.id < 1000 ? CORE_FRAMES : LEVEL2_FRAMES;

    // Score all candidates (excluding the correct frame)
    const candidates = pool
        .filter(f => f.id !== correctFrame.id)
        .map(f => ({ frame: f, score: similarityScore(correctFrame, f) }));

    // Sort by similarity, descending
    candidates.sort((a, b) => b.score - a.score);

    // Take top (count-1) most similar, but add some randomness among the top tier
    // Take top 10 and pick randomly from them to avoid always same set
    const topTier = candidates.slice(0, Math.min(12, candidates.length));
    // Shuffle the top tier
    for (let i = topTier.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topTier[i], topTier[j]] = [topTier[j], topTier[i]];
    }

    const distractors = topTier.slice(0, count - 1).map(c => c.frame);
    const options = [correctFrame, ...distractors];

    // Shuffle final options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return options;
}

// ─── Infinity Mode ───────────────────────────────────────────────────────────
// Returns all Core frames in a random shuffled order (for endless practice)
export function getInfinityQueue(course: string): Frame[] {
    const frames = course === 'Level 2' ? LEVEL2_FRAMES : CORE_FRAMES;
    return [...frames].sort(() => Math.random() - 0.5);
}

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
