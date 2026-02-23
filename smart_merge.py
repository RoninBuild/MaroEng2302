import json
import openpyxl

# Load old frames (for fallback)
with open('c:/100App/eng-app/src/data/frames.json', 'r', encoding='utf-8') as f:
    core_frames = json.load(f)

with open('c:/100App/eng-app/src/data/frames2.json', 'r', encoding='utf-8') as f:
    level2_frames = json.load(f)

# Load baza666
wb = openpyxl.load_workbook('c:/100App/eng-app/baza666.xlsx')
ws = wb.active

fixed_core = 0
fixed_level2 = 0

for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
    ru_baza = str(row[1]).strip() if row[1] else ""
    
    # We only overwrite hint_ru if baza has a valid translation
    if ru_baza and 'уточнить' not in ru_baza.lower():
        if i < 500:
            if i < len(core_frames):
                if core_frames[i]['hint_ru'] != ru_baza:
                    core_frames[i]['hint_ru'] = ru_baza
                    fixed_core += 1
        else:
            idx = i - 500
            if idx < len(level2_frames):
                if level2_frames[idx]['hint_ru'] != ru_baza:
                    level2_frames[idx]['hint_ru'] = ru_baza
                    fixed_level2 += 1

with open('c:/100App/eng-app/src/data/frames.json', 'w', encoding='utf-8') as f:
    json.dump(core_frames, f, ensure_ascii=False, indent=2)

with open('c:/100App/eng-app/src/data/frames2.json', 'w', encoding='utf-8') as f:
    json.dump(level2_frames, f, ensure_ascii=False, indent=2)

print(f"Fixed {fixed_core} Core frames and {fixed_level2} Level 2 frames using valid translations from baza.")
