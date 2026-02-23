const fs = require('fs');
const frames = require('./src/data/frames.json');
const translations = require('./translations.json');

for (const frame of frames) {
    // 1. Update hint_ru if there's a missing translation
    const oldHintRu = frame.hint_ru;
    if (translations[frame.text_en]) {
        frame.hint_ru = translations[frame.text_en];
    }

    // If hint_ru wasn't updated but it still contains English, log it
    if (frame.hint_ru === oldHintRu && /[a-zA-Z]/.test(frame.hint_ru)) {
        console.warn('Still has English:', frame.text_en);
    }

    // 2. We need to update distractors. 
    if (frame.distractors && Array.isArray(frame.distractors)) {
        frame.distractors = frame.distractors.map(opt => {
            if (opt === oldHintRu) {
                return frame.hint_ru; // replace broken option with the correct Russian text
            }
            return opt;
        });
    }

    // 3. Replace '____ing' and '____' with '...' in 
    const replaceBlanks = (str) => {
        if (!str) return str;
        return str.replace(/____ing/g, '...').replace(/____/g, '...');
    };

    frame.text_en = replaceBlanks(frame.text_en);
    frame.hint_ru = replaceBlanks(frame.hint_ru);
    if (frame.distractors && Array.isArray(frame.distractors)) {
        frame.distractors = frame.distractors.map(opt => replaceBlanks(opt));
    }
}

// Write the fixed array back to frames.json
fs.writeFileSync('./src/data/frames.json', JSON.stringify(frames, null, 2));
console.log('Fixed frames.json! Removed blanks and translated English distractors.');
