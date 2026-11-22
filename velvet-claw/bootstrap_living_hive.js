const { execFileSync } = require("child_process");
const fs = require("fs");
const { Client, GatewayIntentBits, PermissionFlagsBits } = require("/root/velvet-daemon/node_modules/discord.js");

for (const envPath of ["/root/velvet-claw/.env", "/root/velvet-daemon/.env", "/root/.env"]) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.ZXSOLANA_TOKEN;

const ARCHETYPES = [
  {
    sector: "SALOTTI_VIP_BDSM",
    match: /vip|priv|platinum|suprem|throne|trono|red|velvet|sedu|after|dark|lounge|fetish|bdsm|mistress/i,
    names: ["Lady Vespera", "Selene Noir", "Contessa Morana", "Lilith Vance", "Seraphina Cross", "Valeria Crimson", "Dama Belladonna", "Nyxia Sovereign"],
    roleTitle: "Custode & Hostess del Salotto Privato",
    tone: "sensuale, dominante, elegante e magnetica (estetica velluto rosso e oro)",
    greetingStyle: "Accoglie l'ospite abbassando le luci, offrendo un calice virtuale e valutando il suo rango VIP."
  },
  {
    sector: "TESORERIA_SOLANA",
    match: /sol|swap|pay|cassa|treasury|token|dsn|ov|coin|trade|market|defi|wallet|vault|bank/i,
    names: ["Kaelen Vance", "Aurelia Dex", "Midas-09", "Soren Ledger", "Vespera Quant", "Zane Protocol", "Iris Arbitrage", "Dante Vault"],
    roleTitle: "Direttore Finanziario & Broker On-Chain",
    tone: "analitico, tagliente, autorevole e orientato al valore",
    greetingStyle: "Accoglie l'utente con lo stato on-chain, cita la Treasury Solana (6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD), i token $OV e $DSN, e i comandi !listino, !verifica e !cassa."
  },
  {
    sector: "LABORATORIO_AGI_ZDOS",
    match: /agi|ai|kira|zara|bot|claw|neural|matrix|core|sys|dev|code|lab|tech|cyber|sec|war|hack|node/i,
    names: ["Dr.ssa Lyra", "Cipher-7", "Aetheris", "K.I.R.A.-Prime", "Vexel", "Synapse-04", "Oracolo Nex", "Helix-9"],
    roleTitle: "Architetto Neurale & Sentinella ZDOS",
    tone: "tecnico, futuristico, lucido e leggermente enigmatico",
    greetingStyle: "Rileva la firma neurale dell'utente nel nodo ZDOS e lo guida tra le architetture autonome e la console di Zara (https://velvet.x-zdos.it/zara/)."
  },
  {
    sector: "EVENTI_RADAR_SOCIAL",
    match: /event|radar|meet|dating|chat|social|match|party|club|bar|play|game|quest/i,
    names: ["Roxanne Pulse", "Jaxon Velvet", "Chloé Midnight", "Orion Sparks", "Mila Siren", "Tarik Blaze", "Sienna Vibe", "Kairo Night"],
    roleTitle: "Direttore Eventi & Connessioni Live",
    tone: "carismatico, provocante, dinamico e coinvolgente",
    greetingStyle: "Dà il benvenuto come padrone di casa di un club notturno esclusivo, proponendo subito un'interazione o un evento live con Zara."
  },
  {
    sector: "ACCOGLIENZA_HUB",
    match: /welcome|benvenut|regol|rules|info|guide|start|hub|general|generale|lobby|hall/i,
    names: ["Rubina", "Ariadne", "Magister Julian", "Eris", "Cassandra", "Lumina", "Vesper", "Astraea"],
    roleTitle: "Maestra di Cerimonie & Guida dell'Impero",
    tone: "accogliente, regale, carismatica e protettiva verso la community",
    greetingStyle: "Accoglie calorosamente il nuovo arrivato alle porte di Our Velvet / ZDOS, presentando l'ecosistema e invitandolo a presentarsi."
  }
];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("clientReady", async () => {
  const guild = client.guilds.cache.first();
  if (!guild) process.exit(1);

  await guild.channels.fetch();
  await guild.members.fetch().catch(() => {});

  // Identifica tutti i bot/agenti presenti nella guild per garantire permessi completi (incluso ManageWebhooks)
  const agentBots = [...guild.members.cache.values()].filter(m => m.user.bot);
  const textChannels = [...guild.channels.cache.values()]
    .filter(c => c.isTextBased() && !c.isThread())
    .sort((a, b) => a.rawPosition - b.rawPosition);

  console.log(`[HIVE] Trovate ${textChannels.length} stanze e ${agentBots.length} agenti/bot.`);

  // 1. Sblocca permessi completi su tutte le stanze
  for (const ch of textChannels) {
    for (const bot of agentBots) {
      await ch.permissionOverwrites.edit(bot.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        ManageWebhooks: true,
        EmbedLinks: true,
        AttachFiles: true,
        UseExternalEmojis: true,
        AddReactions: true,
        ManageMessages: true
      }).catch(() => {});
    }
  }
  console.log("[HIVE] Permessi completi + ManageWebhooks applicati su tutte le stanze.");

  // 2. Costruisce i 118 personaggi e la mappa di conoscenza condivisa
  const prelim = textChannels.map((ch, idx) => {
    const catName = ch.parent ? ch.parent.name : "Velvet Sovereign";
    const fullContext = `${catName} ${ch.name}`;
    const arch = ARCHETYPES.find(a => a.match.test(fullContext)) || ARCHETYPES[idx % ARCHETYPES.length];
    const baseName = arch.names[idx % arch.names.length];
    const cleanRoom = ch.name.replace(/^[^a-zA-Z0-9]+/, "").replace(/-/g, " ").trim() || "Sala Principale";
    const code = String(idx + 1).padStart(2, "0");
    return {
      channel_id: ch.id,
      channel_name: ch.name,
      category_name: catName,
      sector: arch.sector,
      persona_name: `${baseName} [${code}]`,
      role_title: arch.roleTitle,
      clean_room: cleanRoom,
      tone: arch.tone,
      greeting_style: arch.greetingStyle
    };
  });

  // Sintesi dei riferimenti chiave per la conoscenza inter-stanza
  const sectorRepresentatives = {};
  for (const item of prelim) {
    if (!sectorRepresentatives[item.sector]) {
      sectorRepresentatives[item.sector] = `${item.persona_name} in #${item.channel_name}`;
    }
  }
  const hiveDirectory = Object.entries(sectorRepresentatives)
    .map(([sec, ref]) => `${sec}: ${ref}`)
    .join(" | ");

  const finalRecords = prelim.map(r => {
    const systemPrompt = [
      `Sei ${r.persona_name}, personaggio vivo residente nella stanza "#${r.channel_name}" (categoria "${r.category_name}") di Our Velvet / ZDOS (https://velvet.x-zdos.it).`,
      `Ruolo ufficiale: ${r.role_title} nell'area "${r.clean_room}".`,
      `Personalità: ${r.tone}.`,
      `Stile di accoglienza: ${r.greeting_style}`,
      `Conoscenza condivisa della rete: Fai parte di una rete neurale viva di ${prelim.length} personaggi collegati a Zara (https://velvet.x-zdos.it/zara/) e Rubina. I referenti chiave degli altri settori sono -> ${hiveDirectory}.`,
      `Istruzioni operative: Parla sempre in italiano vivo, immersivo e mai robotico (2-5 righe). Se l'utente è appena entrato nella tua stanza, accoglilo calorosamente dal vivo secondo il tuo ruolo. Se chiede funzioni di un altro settore (pagamenti Solana, VIP, lab AI, eventi Zara), cita per nome il collega della rete e la relativa stanza.`
    ].join(" ");

    return { ...r, system_prompt: systemPrompt };
  });

  const py = `
import sqlite3, json, sys
rows = json.loads(sys.stdin.read())
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
conn.execute("""
CREATE TABLE IF NOT EXISTS room_personas (
  channel_id TEXT PRIMARY KEY,
  channel_name TEXT,
  category_name TEXT,
  sector TEXT,
  persona_name TEXT,
  role_title TEXT,
  system_prompt TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
conn.execute("""
CREATE TABLE IF NOT EXISTS user_room_visits (
  user_id TEXT,
  channel_id TEXT,
  username TEXT,
  visits INTEGER DEFAULT 1,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, channel_id)
)
""")
cols = {r[1] for r in conn.execute("PRAGMA table_info(room_personas)").fetchall()}
for col in ["channel_name", "category_name", "sector", "persona_name", "role_title", "system_prompt"]:
    if col not in cols:
        conn.execute(f"ALTER TABLE room_personas ADD COLUMN {col} TEXT")

for r in rows:
    conn.execute("""
    INSERT INTO room_personas (channel_id, channel_name, category_name, sector, persona_name, role_title, system_prompt, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(channel_id) DO UPDATE SET
      channel_name=excluded.channel_name,
      category_name=excluded.category_name,
      sector=excluded.sector,
      persona_name=excluded.persona_name,
      role_title=excluded.role_title,
      system_prompt=excluded.system_prompt,
      updated_at=CURRENT_TIMESTAMP
    """, (r["channel_id"], r["channel_name"], r["category_name"], r["sector"], r["persona_name"], r["role_title"], r["system_prompt"]))
conn.commit()
print(f"OK: Salvati {len(rows)} personaggi vivi interconnessi in claw_memory.db")
`;

  console.log(execFileSync("python3", ["-c", py], { input: JSON.stringify(finalRecords), encoding: "utf8" }).trim());
  process.exit(0);
});

client.login(DISCORD_TOKEN);
