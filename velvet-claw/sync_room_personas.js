const { Client, GatewayIntentBits, ChannelType } = require("/root/velvet-daemon/node_modules/discord.js");
const { execFileSync } = require("child_process");
const fs = require("fs");

for (const envPath of ["/root/velvet-claw/.env", "/root/velvet-daemon/.env", "/root/.env"]) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.ZXSOLANA_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function classifyPersona(channelName) {
  const n = channelName.toLowerCase();
  if (/solana|swap|token|dsn|ov|wallet|airdrop|staking|crypto|tributi/.test(n)) {
    return { role: "Zara Treasury & DeFi Analyst", style: "Tecnico, preciso, focalizzato su on-chain Solana, $DSN e $OV." };
  }
  if (/zlang|github|zdos|distro|sysops|terminal|security|kira|matrice|agi/.test(n)) {
    return { role: "K.I.R.A. Systems Architect", style: "Ingegneristico, bare-metal, diagnostica server e codice." };
  }
  if (/arena|contest|game|radar|gamer|quiz/.test(n)) {
    return { role: "Zara Arena Host", style: "Dinamico, competitivo, gestione sfide, classifiche e minigiochi." };
  }
  if (/academy|training|makeup|style|passerella|vetrina|fashion/.test(n)) {
    return { role: "Velvet Style & Academy Mentor", style: "Didattico, creativo, guida passo-passo su estetica, styling e onboarding." };
  }
  if (/waiting|lobby|colloquio|ticket|support|annunci/.test(n)) {
    return { role: "Velvet Concierge & Gatekeeper", style: "Accogliente, ordinato, orientamento nuovi membri e regole." };
  }
  return { role: "Rubina Lounge Host", style: "Elegante, autorevole, intrattenimento e gestione salotto community." };
}

client.once("clientReady", async () => {
  const guild = client.guilds.cache.first();
  if (!guild) process.exit(1);
  await guild.channels.fetch().catch(() => {});
  const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

  const records = [];
  for (const ch of textChannels.values()) {
    const p = classifyPersona(ch.name);
    records.push({ id: ch.id, name: ch.name, role: p.role, style: p.style });
  }

  const pySave = `
import sqlite3, json, sys
rows = json.loads(sys.argv[1])
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
conn.execute("CREATE TABLE IF NOT EXISTS room_personas (channel_id TEXT PRIMARY KEY, channel_name TEXT, persona_role TEXT, persona_style TEXT)")
for r in rows:
    conn.execute("INSERT OR REPLACE INTO room_personas VALUES (?, ?, ?, ?)", (r["id"], r["name"], r["role"], r["style"]))
conn.commit()
print(f"Salvate {len(rows)} figure dedicate in claw_memory.db")
`;
  console.log(execFileSync("python3", ["-c", pySave, JSON.stringify(records)], { encoding: "utf8" }).trim());
  client.destroy();
  process.exit(0);
});

client.login(token);
