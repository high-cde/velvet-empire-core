async function callClawSafe(payload, fallbackText) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (d && d.ok && d.reply) return String(d.reply).trim();
    } catch (_) {
      await new Promise(res => setTimeout(res, 1500));
    }
  }
  return fallbackText;
}

const fs = require("fs");
const { execFileSync } = require("child_process");
const { Client, GatewayIntentBits } = require("/root/velvet-daemon/node_modules/discord.js");

for (const envPath of ["/root/velvet-claw/.env", "/root/velvet-daemon/.env", "/root/.env"]) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.ZXSOLANA_TOKEN;
const webhookCache = new Map();
const cooldowns = new Map();

function getRoomPersonaAndHistory(channelId, userId, username) {
  const py = `
import sqlite3, json, sys
cid, uid, uname = sys.argv[1], sys.argv[2], sys.argv[3]
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
p = conn.execute("SELECT persona_name, role_title, sector, system_prompt FROM room_personas WHERE channel_id=?", (cid,)).fetchone()
vis = conn.execute("SELECT visits FROM user_room_visits WHERE user_id=? AND channel_id=?", (uid, cid)).fetchone()
is_first = vis is None
if is_first:
    conn.execute("INSERT INTO user_room_visits (user_id, channel_id, username, visits) VALUES (?, ?, ?, 1)", (uid, cid, uname))
else:
    conn.execute("UPDATE user_room_visits SET visits=visits+1, username=?, last_seen=CURRENT_TIMESTAMP WHERE user_id=? AND channel_id=?", (uname, uid, cid))
other_rooms = [r[0] for r in conn.execute("""
    SELECT rp.channel_name || ' (' || rp.persona_name || ')'
    FROM user_room_visits uv
    JOIN room_personas rp ON uv.channel_id = rp.channel_id
    WHERE uv.user_id=? AND uv.channel_id!=?
    ORDER BY uv.last_seen DESC LIMIT 4
""", (uid, cid)).fetchall()]
conn.commit()
print(json.dumps({
    "persona": p,
    "is_first": is_first,
    "other_rooms": other_rooms
}))
`;
  return JSON.parse(execFileSync("python3", ["-c", py, channelId, userId, username], { encoding: "utf8" }));
}

async function sendAsCharacter(channel, personaName, roleTitle, content) {
  try {
    let wh = webhookCache.get(channel.id);
    if (!wh) {
      const hooks = await channel.fetchWebhooks();
      wh = hooks.find(h => h.name === "VelvetLivingHost") || await channel.createWebhook({ name: "VelvetLivingHost" });
      webhookCache.set(channel.id, wh);
    }
    const displayName = `${personaName} • ${roleTitle}`.slice(0, 78);
    await wh.send({
      content: content.slice(0, 1950),
      username: displayName
    });
    return true;
  } catch {
    await channel.send(`**${personaName}** *(${roleTitle})*:\n${content.slice(0, 1900)}`).catch(() => {});
    return false;
  }
}

async function generateCharacterReply(userId, username, userMsg, state) {
  const [personaName, roleTitle, sector, sysPrompt] = state.persona;
  const memoryNote = state.other_rooms.length
    ? `L'utente ${username} ha già visitato: ${state.other_rooms.join(", ")}.`
    : `È la primissima volta che ${username} entra nel nostro ecosistema.`;
  const welcomeDirective = state.is_first
    ? `AZIONE PRIORITARIA: Accogli ${username} per la prima volta in questa stanza con una presentazione magnetica e coerente col tuo ruolo, poi rispondi al suo messaggio.`
    : `Continua il dialogo con ${username} mantenendo viva la tua personalità.`;
  const fullPrompt = `${sysPrompt}
[CONTESTO RETE NEURALE]: ${memoryNote} ${welcomeDirective}
[MESSAGGIO DI ${username}]: ${userMsg}`;

  return callClawSafe({
    prompt: fullPrompt,
    user_id: userId,
    role: `${personaName} (${roleTitle})`,
    channel: sector,
    persona: personaName
  }, null);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Accoglienza istantanea quando un nuovo membro entra nel server Discord
client.on("guildMemberAdd", async member => {
  if (member.user.bot) return;
  const guild = member.guild;
  const welcomeChan = guild.channels.cache.find(c => /welcome|benvenut|lobby|general|generale/i.test(c.name) && c.isTextBased());
  if (!welcomeChan) return;

  const state = getRoomPersonaAndHistory(welcomeChan.id, member.id, member.user.username);
  if (!state.persona) return;
  const reply = await generateCharacterReply(
    member.id,
    member.user.username,
    "Sono appena entrato nel server Discord di Our Velvet / ZDOS.",
    state
  );
  if (reply) {
    await sendAsCharacter(welcomeChan, state.persona[0], state.persona[1], `<@${member.id}> ${reply}`);
  }
});

// Accoglienza e dialogo vivo in ciascuna delle 118 stanze
client.on("messageCreate", async message => {
  if (message.author.bot || message.webhookId || !message.guild) return;
  const txt = (message.content || "").trim();
  if (!txt || txt.startsWith("!")) return; // I comandi !listino, !verifica, !cassa restano gestiti da zxsolana-bot

  const key = `${message.channel.id}:${message.author.id}`;
  const now = Date.now();
  if (now - (cooldowns.get(key) || 0) < 3500) return;
  cooldowns.set(key, now);

  const state = getRoomPersonaAndHistory(message.channel.id, message.author.id, message.author.username);
  if (!state.persona) return;

  await message.channel.sendTyping().catch(() => {});
  const reply = await generateCharacterReply(message.author.id, message.author.username, txt, state);
  if (reply) {
    await sendAsCharacter(message.channel, state.persona[0], state.persona[1], reply);
  }
});

client.once("clientReady", () => {
  console.log(`[LIVING-HOSTS] Attivo su ${client.user.tag} — 118 personaggi interconnessi pronti con Webhook nominali.`);
});

client.login(DISCORD_TOKEN);
