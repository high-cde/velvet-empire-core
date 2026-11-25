const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = "/root/velvet-claw/claw_memory.db";
const LORE_PATH = "/root/velvet-claw/tonight_ritual_lore.md";
const OUT_JSON = "/root/velvet-claw/latest_penance.json";

const PENANCE_TEMPLATES = {
  atto_1: [
    "Atto I (Soglia): Resta in ginocchio in silenzio per 90 secondi mantenendo lo sguardo basso verso Rubina; nessuna parola finché Zara non dà il cenno.",
    "Atto I (Postura & Rete): Mantieni le mani ferme sulle cosce e il busto eretto; rispondi solo 'Sì, Rubina' o 'Sì, Kali' con tono calmo e misurato."
  ],
  atto_2: [
    "Atto II (Resa): Sostieni l'attesa senza muovere un muscolo quando Rubina sfiora la nuca; se perdi il ritmo del respiro, ricominci il conteggio da zero.",
    "Atto II (Zero Scuse): Rispondi alle domande di Kali e Zara in massimo tre parole, senza giustificazioni né esitazioni."
  ],
  atto_3: [
    "Atto III (Tensione & Ritmo): Alterna 45 secondi di immobilità totale a 15 secondi di esecuzione precisa del comando successivo di Rubina.",
    "Atto III (Presenza): Tieni lo sguardo fisso sul punto indicato da Zara finché non viene sciolta la sequenza; safeword ROSSO/RED sempre attiva."
  ],
  atto_4: [
    "Atto IV (Chiusura del Cerchio): Ringrazia con compostezza Rubina, Zara e Kali, allenta la tensione fisica e attendi il sigillo finale del ciclo."
  ]
};

function readRubinaContext() {
  const lore = fs.existsSync(LORE_PATH) ? fs.readFileSync(LORE_PATH, "utf8") : "";
  return new Promise((resolve) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
      if (err) return resolve({ lore, latest_note: "lettura_diretta_lore", recent_events: [] });
      db.all("SELECT id, session_tag, title, updated_at FROM rubina_ritual_memory WHERE active=1 ORDER BY id DESC LIMIT 1", [], (e1, memRows) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (e2, tables) => {
          const tNames = (tables || []).map(t => t.name);
          const candidate = tNames.find(n => n.includes("rpg") || n.includes("log") || n.includes("event") || n.includes("badge"));
          if (!candidate) {
            db.close();
            return resolve({ lore, session: memRows && memRows[0], recent_events: [] });
          }
          db.all(`SELECT * FROM ${candidate} ORDER BY rowid DESC LIMIT 5`, [], (e3, evRows) => {
            db.close();
            resolve({
              lore,
              session: memRows && memRows[0],
              recent_events: evRows || []
            });
          });
        });
      });
    });
  });
}

function detectActStage(rubinaReadingText) {
  const txt = (rubinaReadingText || "").toLowerCase();
  if (txt.includes("atto iv") || txt.includes("chiusura")) return "atto_4";
  if (txt.includes("atto iii") || txt.includes("tensione") || txt.includes("lattice")) return "atto_3";
  if (txt.includes("atto ii") || txt.includes("resa") || txt.includes("immobilità")) return "atto_2";
  return "atto_1";
}

async function generatePenance(target = "Sottomesso", customNote = "") {
  const ctx = await readRubinaContext();
  const eventsSummary = ctx.recent_events.map(r => JSON.stringify(r)).join(" | ");
  const combinedReading = `${customNote} ${eventsSummary} ${ctx.lore}`.slice(0, 1200);
  const stage = detectActStage(customNote ? `${customNote} ${eventsSummary}` : eventsSummary || ctx.lore);
  const pool = PENANCE_TEMPLATES[stage] || PENANCE_TEMPLATES.atto_1;
  const idx = Math.floor(Date.now() / 1000) % pool.length;
  const penanceText = pool[idx];

  const payload = {
    ok: true,
    generator: "zdos-claw-xai01",
    read_by: "Rubina",
    target,
    act_stage: stage,
    safeword: "ROSSO / RED",
    source_excerpt: combinedReading.slice(0, 260),
    penance: penanceText,
    created_at: new Date().toISOString()
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));

  const db = new sqlite3.Database(DB_PATH);
  db.run(
    "INSERT INTO claw_penances (actor_target, act_stage, source_note, penance_text, safeword_guard, status, created_at) VALUES (?, ?, ?, ?, 'ROSSO / RED', 'ACTIVE', ?)",
    [target, stage, customNote || "rubina_context_read", penanceText, payload.created_at],
    () => db.close()
  );

  return payload;
}

module.exports = { generatePenance, readRubinaContext };

if (require.main === module) {
  const target = process.argv[2] || "Sottomesso";
  const note = process.argv.slice(3).join(" ");
  generatePenance(target, note).then(res => console.log(JSON.stringify(res, null, 2)));
}
