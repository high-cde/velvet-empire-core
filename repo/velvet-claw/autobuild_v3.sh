#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Verifica dipendenze e variabili d'ambiente..."
cd /root/velvet-claw
npm install better-sqlite3 --no-audit --no-fund >/dev/null 2>&1 || true

# Recupera eventuale TELEGRAM_BOT_TOKEN dai .env esistenti sul VPS se non ancora presente
if ! grep -q "TELEGRAM_BOT_TOKEN=" /root/velvet-claw/.env 2>/dev/null; then
  TG_TOKEN=$(grep -hE "^(TELEGRAM_BOT_TOKEN|BOT_TOKEN)=" /root/velvet-daemon/.env /root/.env 2>/dev/null | head -n1 | cut -d'=' -f2- | tr -d '"' || true)
  TG_CHAT=$(grep -hE "^(TELEGRAM_CHAT_ID|CHAT_ID|CHANNEL_ID)=" /root/velvet-daemon/.env /root/.env 2>/dev/null | head -n1 | cut -d'=' -f2- | tr -d '"' || true)
  [ -n "${TG_TOKEN:-}" ] && echo "TELEGRAM_BOT_TOKEN=\"$TG_TOKEN\"" >> /root/velvet-claw/.env
  [ -n "${TG_CHAT:-}" ] && echo "TELEGRAM_CHAT_ID=\"$TG_CHAT\"" >> /root/velvet-claw/.env
fi

echo "[2/4] Scrittura demone sovrano VELVET-CLAW v3.0 (SQLite + Telemetria Reale + RPC Solana + Telegram)..."
cat << 'JS' > /root/velvet-claw/velvet_claw_daemon.js
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
    telegram_ready: Boolean(TG_TOKEN && TG_CHAT)
  };
}

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) {
    return { ok: false, reason: "TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID non configurati in /root/velvet-claw/.env" };
  }
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT,
      text: text.slice(0, 4000),
      parse_mode: "Markdown"
    })
  });
  return await r.json();
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
JS

echo "[3/4] Aggiornamento zxsolana_bot.js con tutti i comandi sovrani (!claw, !rubina, !zara, !usciere, !stanza, !sala-privata, !sessione, !gioco, !broadcast)..."
python3 -c '
p = "/root/velvet-daemon/zxsolana_bot.js"
t = open(p, encoding="utf-8").read()

if "ChannelType" not in t:
    t = t.replace("GatewayIntentBits,", "GatewayIntentBits,\n  ChannelType,\n  PermissionsBitField,")

# Rimuove eventuale vecchio blocco v2 se presente e inserisce v3 pulito
start_marker = "console.log(\"[MSG]\", message.author.username, JSON.stringify(message.content));"
end_marker = "  const cleaned = message.content"

v3_block = """console.log("[MSG]", message.author.username, JSON.stringify(message.content));
  const rawTxt = message.content.trim();

  // 1. !claw | !rubina | !zara | !usciere <prompt>
  const cmdMatch = rawTxt.match(/^!(claw|rubina|zara|usciere)\\b\\s*(.*)/is);
  if (cmdMatch) {
    const rawCmd = cmdMatch[1].toLowerCase();
    const persona = rawCmd === "claw" ? "orchestrator" : rawCmd === "usciere" ? "usher" : rawCmd;
    const q = cmdMatch[2].trim() || "Fornisci il bollettino reale dell'\''ecosistema ZDOS, $DSN, $OV e Our Velvet.";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, role: message.author.username, channel: message.channel.id, persona })
      });
      const d = await r.json();
      const badges = {
        rubina: "👑 **[RUBINA // DIREZIONE SUPREMA]**",
        zara: "⚡ **[ZARA // STRATEGIA & GROWTH 500+]**",
        usher: "🕯️ **[USCIERE DI SALA]**",
        orchestrator: "🦾 **[VELVET-CLAW // XAI-01]**"
      };
      const out = d.ok ? d.reply : d.error;
      return message.reply(`${badges[persona]}\\n${String(out).slice(0, 1850)}`);
    } catch (e) {
      return message.reply(`⚠️ Errore bridge VELVET-CLAW: ${e.message}`);
    }
  }

  // 2. !stanza <nome-canale> | <archetipo_usciere> | <tema>
  if (/^!stanza\\b/i.test(rawTxt) && message.guild) {
    const isAdmin = message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
    if (!isAdmin) return message.reply("⛔ Permesso negato: serve il privilegio Gestione Canali.");
    const parts = rawTxt.replace(/^!stanza\\s*/i, "").split("|");
    const chName = (parts[0] || "sala-velvet").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    const archetype = (parts[1] || "Usciere della Loggia").trim();
    const theme = (parts[2] || "Salotto cyberpunk gotico di Our Velvet").trim();
    try {
      const ch = await message.guild.channels.create({
        name: chName,
        type: ChannelType.GuildText,
        topic: `Our Velvet • Usciere: ${archetype} • Tema: ${theme}`
      });
      await fetch("http://127.0.0.1:8799/register-usher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: ch.id, channel_name: chName, archetype, theme })
      });
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Presentati come il nuovo Usciere assegnato alla stanza #${chName}. Archetipo: ${archetype}. Tema: ${theme}. Accogli i visitatori e spiega come interagire con te usando !usciere.`,
          role: message.author.username,
          channel: ch.id,
          persona: "usher"
        })
      });
      const d = await r.json();
      await ch.send(`🕯️ **[USCIERE // ${archetype.toUpperCase()}]**\n${d.reply || "Benvenuti nella sala."}`);
      return message.reply(`✅ Stanza <#${ch.id}> creata con usciere **${archetype}** registrato in memoria.`);
    } catch (e) {
      return message.reply(`⚠️ Errore creazione stanza: ${e.message}`);
    }
  }

  // 3. !sala-privata <nome-canale> (sola lettura per @everyone)
  if (/^!sala-privata\\b/i.test(rawTxt) && message.guild) {
    const isAdmin = message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
    if (!isAdmin) return message.reply("⛔ Permesso negato.");
    const chName = rawTxt.replace(/^!sala-privata\\s*/i, "").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") || "loggia-privata";
    try {
      const ch = await message.guild.channels.create({
        name: chName,
        type: ChannelType.GuildText,
        topic: "Sala di osservazione riservata — Solo lettura per i membri",
        permissionOverwrites: [
          { id: message.guild.id, deny: [PermissionsBitField.Flags.SendMessages], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] }
        ]
      });
      await ch.send(`🔒 **[SALA RISERVATA // SOLA LETTURA]**\nQuesto spazio è riservato alle cronache ufficiali e alle sessioni di Rubina e Zara. I membri possono osservare in silenzio.`);
      return message.reply(`✅ Sala privata in sola lettura <#${ch.id}> creata. Usa \`!sessione #${chName} | <tema>\` per pubblicare una cronaca.`);
    } catch (e) {
      return message.reply(`⚠️ Errore creazione sala privata: ${e.message}`);
    }
  }

  // 4. !sessione <tema> (pubblica nel canale corrente o nel canale menzionato una cronaca Rubina & Zara)
  if (/^!sessione\\b/i.test(rawTxt)) {
    const targetCh = message.mentions.channels.first() || message.channel;
    const theme = rawTxt.replace(/^!sessione\\s*/i, "").replace(/<#\\d+>/g, "").replace(/^\\|\\s*/, "").trim() || "Strategia della Loggia, ordine e dominio creativo su Velvet City";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Genera una cronaca di sessione tra Rubina e Zara sul tema: "${theme}".`,
          role: message.author.username,
          channel: targetCh.id,
          persona: "session"
        })
      });
      const d = await r.json();
      await targetCh.send(`🩸 **[CRONACA DELLA LOGGIA // RUBINA & ZARA]**\n${String(d.reply).slice(0, 1850)}`);
      if (targetCh.id !== message.channel.id) return message.reply(`✅ Sessione pubblicata in <#${targetCh.id}>.`);
      return;
    } catch (e) {
      return message.reply(`⚠️ Errore sessione: ${e.message}`);
    }
  }

  // 5. !gioco <tema> (lancia un mini-gioco/contest interattivo a tema Velvet/Loggia per coinvolgere gli utenti)
  if (/^!gioco\\b/i.test(rawTxt)) {
    const theme = rawTxt.replace(/^!gioco\\s*/i, "").trim() || "Sfida di etichetta, enigmi della Loggia e caccia al segnale Meat Radar ($OV)";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Crea un gioco interattivo immediato per i membri presenti in chat sul tema: "${theme}". Includi: 1) Regola lampo in 3 righe, 2) Prima domanda/prova a cui gli utenti devono rispondere subito in chat, 3) Premio simbolico o grado nella Loggia / punti $OV.`,
          role: message.author.username,
          channel: message.channel.id,
          persona: "zara"
        })
      });
      const d = await r.json();
      return message.reply(`🎲 **[ARENA VELVET // GIOCO ATTIVO]**\n${String(d.reply).slice(0, 1850)}`);
    } catch (e) {
      return message.reply(`⚠️ Errore avvio gioco: ${e.message}`);
    }
  }

  // 6. !broadcast <tema> (genera copy per Discord + Telegram, salva in outbox.json e tenta l'\''invio su Telegram se configurato)
  if (/^!broadcast\\b/i.test(rawTxt)) {
    const topic = rawTxt.replace(/^!broadcast\\s*/i, "").trim() || "Aggiornamento ufficiale ecosistema ZDOS, $DSN, $OV e Our Velvet";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Scrivi un comunicato ufficiale ad alto impatto per espandere la community verso 500 membri attivi sul tema: "${topic}". Includi i riferimenti reali a https://velvet.x-zdos.it, https://x-zdos.it e https://whatsapp.com/channel/0029Vb9Rbee89inrYLhdem1n.`,
          role: message.author.username,
          channel: "broadcast",
          persona: "zara"
        })
      });
      const d = await r.json();
      const fs = require("fs");
      const outboxPath = "/root/velvet-claw/outbox.json";
      const box = fs.existsSync(outboxPath) ? JSON.parse(fs.readFileSync(outboxPath, "utf8")) : [];
      box.push({ date: new Date().toISOString(), topic, content: d.reply });
      fs.writeFileSync(outboxPath, JSON.stringify(box, null, 2));

      const tgRes = await fetch("http://127.0.0.1:8799/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `⚡ *OUR VELVET // ZDOS UPDATE*\n\n${d.reply}` })
      }).then(x => x.json()).catch(e => ({ ok: false, reason: e.message }));

      const tgStatus = tgRes.ok ? "✅ Inviato anche su Telegram" : `ℹ️ Salvato in outbox.json (Telegram: ${tgRes.reason || "non attivo"})`;
      return message.reply(`📡 **[BROADCAST MULTICANALE]** (${tgStatus})\n${String(d.reply).slice(0, 1800)}`);
    } catch (e) {
      return message.reply(`⚠️ Errore broadcast: ${e.message}`);
    }
  }
"""

i1 = t.find(start_marker)
i2 = t.find(end_marker)
assert i1 != -1 and i2 != -1 and i2 > i1, "Marker non trovati in zxsolana_bot.js"
t = t[:i1] + v3_block + "\n" + t[i2:]
open(p, "w", encoding="utf-8").write(t)
'

echo "[4/4] Riavvio demoni PM2 e controllo salute ecosistema..."
pm2 restart velvet-claw-xai01 zxsolana-bot
pm2 save
sleep 2
curl -s http://127.0.0.1:8799/health
