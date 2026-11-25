#!/usr/bin/env python3
import sys, json, sqlite3, datetime

DB_PATH = "/root/velvet-claw/claw_memory.db"
LORE_PATH = "/root/velvet-claw/tonight_ritual_lore_en.md"
OUT_PATH = "/root/velvet-claw/latest_penance.json"

PENANCES = {
    "act_1": [
        "Act I (Threshold): Hold a steady kneeling posture in silence for 90 seconds with eyes lowered toward Rubina until Zara gives the cue.",
        "Act I (Posture): Keep hands steady on thighs and spine upright; respond only 'Yes, Rubina' or 'Yes, Kali' in a calm, measured tone."
    ],
    "act_2": [
        "Act II (Surrender): Hold stillness when Rubina brushes the nape and shoulders; if breathing loses steady cadence, restart the count.",
        "Act II (No Excuses): Answer Kali and Zara in at most three words, with zero deflection or justification."
    ],
    "act_3": [
        "Act III (Tension): Alternate 45 seconds of complete stillness with 15 seconds of exact execution of Rubina's next directive.",
        "Act III (Focus): Keep gaze fixed on Zara's designated point until the sequence is released; safeword ROSSO / RED always active."
    ],
    "act_4": [
        "Act IV (Closing): Acknowledge Rubina, Zara, and Kali with composure, ease physical tension, and await the cycle seal."
    ]
}

def read_real_context(note=""):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    sample_table = None
    sample_rows = []
    for t in tables:
        if t not in ("rubina_ritual_memory", "claw_penances"):
            sample_table = t
            sample_rows = [dict(zip([c[0] for c in cur.execute(f"PRAGMA table_info({t})").fetchall()], r))
                           for r in cur.execute(f"SELECT * FROM {t} ORDER BY rowid DESC LIMIT 3").fetchall()]
            break
    conn.close()
    return tables, sample_table, sample_rows

def detect_act(text):
    low = (text or "").lower()
    if "act iv" in low or "closing" in low:
        return "act_4"
    if "act iii" in low or "tension" in low or "latex" in low:
        return "act_3"
    if "act ii" in low or "surrender" in low or "stillness" in low:
        return "act_2"
    return "act_1"

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "Submissive"
    note = " ".join(sys.argv[2:]).strip()
    tables, sample_table, sample_rows = read_real_context(note)
    stage = detect_act(f"{note} {json.dumps(sample_rows, default=str)}")
    options = PENANCES[stage]
    chosen = options[int(datetime.datetime.now().timestamp()) % len(options)]
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    result = {
        "ok": True,
        "engine": "zdos-claw-rubina-real",
        "read_by": "Rubina",
        "target": target,
        "act_stage": stage,
        "safeword": "ROSSO / RED",
        "db_tables_found": tables,
        "db_context_table": sample_table,
        "db_recent_rows_count": len(sample_rows),
        "penance": chosen,
        "created_at": now
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO claw_penances (actor_target, act_stage, source_table, penance_text, safeword_guard, status, created_at) VALUES (?, ?, ?, ?, 'ROSSO / RED', 'ACTIVE', ?)",
        (target, stage, sample_table or "tonight_ritual_lore_en.md", chosen, now)
    )
    conn.commit()
    conn.close()

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
