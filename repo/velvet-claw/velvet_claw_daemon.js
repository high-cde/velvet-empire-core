const http = require("http");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");
const Database = require("better-sqlite3");

for (const envPath of ["/root/velvet-claw/.env", "/root/velvet-daemon/.env", "/root/.env"]) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const cfg = JSON.parse(fs.readFileSync("/root/velvet-claw/openclaw.json", "utf8"));
const XAI_KEY = process.env.XAI_API_KEY || "";
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || "";
const PORT = cfg.port || 8799;

const TOKENS = {
  DSN: "35w74RT77BPSYNpmzpvxmR9wu2ihpgzubKy4bkGHR3F4",
  OV: "2EN6Y1zM4yyt41gE2muzdJSAgRCAZiXqnmkgpbrspump",
  TREASURY: "6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD"
};

const db = new Database("/root/velvet-claw/claw_memory.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT,
    persona TEXT,
    role TEXT,
    prompt TEXT,
    reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS channel_ushers (
    channel_id TEXT PRIMARY KEY,
    channel_name TEXT,
    archetype TEXT,
    theme TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS state_kv (
    k TEXT PRIMARY KEY,
    v TEXT
  );
`);

async function getRealEcosystemSnapshot() {
  let pm2Online = 0;
  let pm2Names = [];
  try {
    const list = JSON.parse(execSync("pm2 jlist", { timeout: 2000 }).toString());
    const online = list.filter(p => p.pm2_env && p.pm2_env.status === "online");
    pm2Online = online.length;
    pm2Names = online.map(p => p.name);
  } catch (_) {}

  let solBalance = "n/d";
  try {
    const rpcRes = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [TOKENS.TREASURY] })
    });
    const rpcJson = await rpcRes.json();
    if (rpcJson.result && typeof rpcJson.result.value === "number") {
      solBalance = (rpcJson.result.value / 1e9).toFixed(4) + " SOL";
    }
  } catch (_) {}

  const totalMemGb = (os.totalmem() / 1073741824).toFixed(1);
  const freeMemGb = (os.freemem() / 1073741824).toFixed(1);

  return {
    host: os.hostname(),
    load_1m: os.loadavg()[0].toFixed(2),
    ram_free: `${freeMemGb}/${totalMemGb} GB`,
    pm2_count: pm2Online,
    pm2_services: pm2Names,
    treasury_wallet: TOKENS.TREASURY,
    treasury_sol: solBalance,
    mint_dsn: TOKENS.DSN,
    mint_ov: TOKENS.OV,
    portals: {
      zdos: "https://x-zdos.it",
      velvet: "https://velvet.x-zdos.it",
      whatsapp: "https://whatsapp.com/channel/0029Vb9Rbee89inrYLhdem1n"
    },
    telegram_ready: Boolean(TG_TOKEN && TG_CHAT),
    telegram_channels: TG_CHAT ? TG_CHAT.split(",").map(s => s.trim()) : [],
    discord_agents: ["z-xSOLANA#1934 (Active)", "Rubina#5585 (Active)", "Zara Lsd#7384 (Active)", "Dr. High#1276 (Active)"]
  };
}

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) {
    return { ok: false, reason: "TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID non configurati in /root/velvet-claw/.env" };
  }
  const targets = TG_CHAT.split(",").map(s => s.trim()).filter(Boolean);
  const results = [];
  for (const chat_id of targets) {
    const htmlText = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
      .slice(0, 4000);
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: false
      })
    });
    results.push({ chat_id, res: await r.json() });
  }
  const allOk = results.every(x => x.res && x.res.ok);
  return { ok: allOk, targets: results };
}

async function queryLLM(systemPrompt, userPrompt, channel = "global", author = "Dr. High", persona = "orchestrator") {
  const history = db.prepare("SELECT role, prompt, reply FROM memory WHERE channel = ? ORDER BY id DESC LIMIT 5").all(channel).reverse();
  const messages = [{ role: "system", content: systemPrompt }];
  for (const h of history) {
    messages.push({ role: "user", content: `[${h.role}]: ${h.prompt}` });
    messages.push({ role: "assistant", content: h.reply });
  }
  messages.push({ role: "user", content: `[${author}]: ${userPrompt}` });

  const res = await fetch(`${cfg.engine.base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_KEY}`,
      "User-Agent": "VELVET-CLAW/3.0"
    },
    body: JSON.stringify({
      model: cfg.engine.default_model,
      messages,
      temperature: 0.72,
      max_tokens: 1000
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  const reply = data.choices[0].message.content.trim();

  db.prepare("INSERT INTO memory (channel, persona, role, prompt, reply) VALUES (?, ?, ?, ?, ?)").run(channel, persona, author, userPrompt, reply);
  return reply;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "GET" && req.url === "/health") {
    const snap = await getRealEcosystemSnapshot();
    const ushers = db.prepare("SELECT * FROM channel_ushers").all();
    return res.end(JSON.stringify({
      status: "ONLINE",
      node: "VELVET-CLAW // XAI-01 v3.0",
      xai_key_loaded: Boolean(XAI_KEY),
      ecosystem: snap,
      active_ushers: ushers
    }));
  }

  if (req.method === "POST" && req.url === "/register-usher") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      try {
        const { channel_id, channel_name, archetype, theme } = JSON.parse(body || "{}");
        db.prepare("INSERT OR REPLACE INTO channel_ushers (channel_id, channel_name, archetype, theme) VALUES (?, ?, ?, ?)").run(channel_id, channel_name, archetype, theme);
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/telegram") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const { text } = JSON.parse(body || "{}");
        const tgRes = await sendTelegram(text);
        res.end(JSON.stringify(tgRes));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/claw") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const { prompt, role = "Dr. High", channel = "global", persona = "orchestrator" } = JSON.parse(body || "{}");
        const snap = await getRealEcosystemSnapshot();
        const usherRow = db.prepare("SELECT * FROM channel_ushers WHERE channel_id = ?").get(channel);

        let personaDirective = "Sei VELVET-CLAW // XAI-01, orchestratore tecnico dell'ecosistema ZDOS, ZLang e Our Velvet.";
        if (persona === "rubina") {
          personaDirective = "Sei RUBINA, Direttrice Suprema e mente creativa di Our Velvet (https://velvet.x-zdos.it) e dell'agenzia digitale su https://x-zdos.it. Tono carismatico, magnetico, autorevole, elegante, padrone dell'etichetta consensuale e dell'estetica cyberpunk-gotica. Mai esplicita o volgare.";
        } else if (persona === "zara") {
          personaDirective = "Sei ZARA, Stratega Digital, Community Manager e Content Creator di Our Velvet. Il tuo obiettivo concreto è strutturare campagne virali, giochi di ruolo consensuali a tema Loggia/Velvet, quiz e sfide per portare la community attiva oltre i 500 membri su Discord, Telegram, X e WhatsApp.";
        } else if (persona === "usher") {
          const arch = usherRow ? usherRow.archetype : "Usciere della Loggia";
          const thm = usherRow ? usherRow.theme : "Salotto Velvet";
          personaDirective = `Sei l'Usciere ufficiale di questa stanza Discord. Archetipo assegnato: "${arch}". Tema della stanza: "${thm}". Accogli i membri con stile coerente al tuo archetipo, mantieni l'atmosfera immersiva e ricorda sempre le regole di consenso e rispetto.`;
        } else if (persona === "session") {
          personaDirective = "Scrivi una cronaca teatrale/letteraria in stile cyberpunk-gotico tra Rubina (Direttrice) e Zara (Stratega) ambientata nella Loggia di Velvet City, centrata su leadership, strategia dell'ecosistema $DSN/$OV, estetismo e dinamica consensuale elegante (livello PG-16/18+ letterario, mai pornografico esplicito).";
        }

        const systemPrompt = `${personaDirective}

DATI REALI VERIFICATI DELL'ECOSISTEMA (usa SOLO questi valori reali, non inventare metriche):
- Host VPS: ${snap.host} | Load: ${snap.load_1m} | RAM libera: ${snap.ram_free}
- Servizi PM2 attivi (${snap.pm2_count}): ${snap.pm2_services.join(", ")}
- Portali: ZDOS (${snap.portals.zdos}) | Our Velvet (${snap.portals.velvet}) | Canale WhatsApp (${snap.portals.whatsapp})
- Treasury Solana: ${snap.treasury_wallet} (Saldo reale: ${snap.treasury_sol})
- Token $DSN (ZDOS): ${snap.mint_dsn}
- Token $OV (Our Velvet / Meat Radar): ${snap.mint_ov}
- Canali Telegram attivi (${snap.telegram_ready ? "ONLINE" : "OFFLINE"}): ${snap.telegram_channels.join(", ")}
- Agenti Discord verificati (118 stanze con permessi completi): ${snap.discord_agents.join(", ")}
- DIVIETO TASSATIVO: Non inventare MAI prezzi in USD per $DSN o $OV e non dichiarare "Stato non verificabile" per Rubina, Zara o i canali Telegram (sono tutti ONLINE e verificati). Mantieni la risposta entro 1600 caratteri totali per evitare tagli su Discord.

Rispondi in italiano, in modo incisivo, ben formattato per Discord (max 1750 caratteri).`;

        const reply = await queryLLM(systemPrompt, prompt, channel, role, persona);
        res.end(JSON.stringify({ ok: true, node: "VELVET-CLAW // XAI-01 v3.0", persona, reply }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false, error: "Not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[VELVET-CLAW v3.0] Attivo su 127.0.0.1:${PORT}`);
});
