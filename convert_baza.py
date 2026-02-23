import openpyxl
import json

wb = openpyxl.load_workbook('baza666.xlsx')
ws = wb.active

core_frames = []
level2_frames = []

for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
    text_en = row[0]
    hint_ru = row[1]
    
    if not text_en or not hint_ru:
        continue
    
    # Collect wrong answers (columns 3-8, indices 2-7)
    wrong_answers = []
    for j in range(2, 8):
        if j < len(row) and row[j] and str(row[j]).strip():
            wrong_answers.append(str(row[j]).strip())
    
    row_index = i  # 0-based
    
    if row_index < 500:
        # Core: IDs 1-500
        frame = {
            "id": row_index + 1,
            "block": "Core",
            "text_en": str(text_en).strip(),
            "hint_ru": str(hint_ru).strip(),
            "distractors": wrong_answers
        }
        core_frames.append(frame)
    else:
        # Level 2: IDs 1000-3499
        frame = {
            "id": 1000 + (row_index - 500),
            "block": "Level 2",
            "text_en": str(text_en).strip(),
            "hint_ru": str(hint_ru).strip(),
            "distractors": wrong_answers
        }
        level2_frames.append(frame)

print(f"Core frames: {len(core_frames)}")
print(f"Level 2 frames: {len(level2_frames)}")
print("\nCore sample:")
print(json.dumps(core_frames[0], ensure_ascii=False, indent=2))
print(json.dumps(core_frames[499], ensure_ascii=False, indent=2))
print("\nLevel 2 sample (first):")
print(json.dumps(level2_frames[0], ensure_ascii=False, indent=2))

# Save
with open('src/data/frames.json', 'w', encoding='utf-8') as f:
    json.dump(core_frames, f, ensure_ascii=False, indent=2)

with open('src/data/frames2.json', 'w', encoding='utf-8') as f:
    json.dump(level2_frames, f, ensure_ascii=False, indent=2)

print("\n✅ Done! Both files saved.")
