export type BlockType =
    | 'Core'
    | 'Questions & Requests'
    | 'Clarify / I didn\'t understand'
    | 'Connectors / logic'
    | 'Modals'
    | 'Reactions / patterns'
    | 'Level 2';

export type CourseType = 'Core Challenge' | 'Level 2';

export interface Frame {
    id: number;
    block: BlockType;
    text_en: string;
    hint_ru: string;
    distractors?: string[]; // Pre-curated wrong answers from baza666.xlsx
}

export interface UserProgressFrame {
    id: number;
    ease: number; // 0=Again, 1=Hard, 2=Good, 3=Easy
    interval: number; // days till next review
    dueDate: string; // ISO string 
    lapses: number;
    lastSeen: string;
}

export interface AppState {
    progress: Record<number, UserProgressFrame>;
    streak: number;
    lastFinishedSessionDate: string | null;
    dailyNewCount: number;
    useTyping: boolean;
    activeCourse: CourseType;
}
