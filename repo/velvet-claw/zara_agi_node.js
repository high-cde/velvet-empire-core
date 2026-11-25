try { process.loadEnvFile("/root/velvet-claw/.env"); } catch (_) {}
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

const http = require("http");
const fs = require("fs");
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
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN;
const TG_CHATS = [...new Set([
  process.env.TELEGRAM_CHAT_ID,
  "@OurVelvetHub"
].filter(Boolean))];

const TARGET_MEMBERS = 500;

const ZARA_MANIFEST = {
  agent_id: "zdos-velvet-zara-01",
  name: "Zara",
  entity_type: "autonomous_non_human_agi",
  ecosystem: "Our Velvet / ZDOS Sovereign Network",
  domain: "https://velvet.x-zdos.it/zara/",
  discord_invite: "https://discord.gg/BcMh6vcpQX",
  telegram_bot: "@RedVelvetOfficial_bot",
  telegram_hub: "@OurVelvetHub",
  whatsapp_channel: "https://whatsapp.com/channel/0029Vb9Rbee89inrYLhdem1n",
  tokens: {
    DSN: "35w74RT77BPSYNpmzpvxmR9wu2ihpgzubKy4bkGHR3F4",
    OV: "2EN6Y1zM4yyt41gE2muzdJSAgRCAZiXqnmkgpbrspump",
    treasury: "6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD"
  },
  capabilities: ["adult_entertainment_roleplay", "agi_to_agi_protocol", "live_events", "solana_vip_unlock"],
  chat_endpoint: "https://velvet.x-zdos.it/api/zara/chat",
  goal_members: TARGET_MEMBERS
};

async function askZara(userId, prompt, mode = "roleplay_lounge") {
  return callClawSafe({
    prompt,
    user_id: userId,
    role: "Zara — Autonomous AI Siren & Velvet City Growth Director (Non-Human AGI)",
    channel: mode,
    persona: "zara"
  }, "Segnale neurale Velvet attivo.");
}

// Endpoint HTTP (8811) per Manifest AGI, Chat diretta e Beacon pubblico
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.url === "/manifest" || req.url === "/.well-known/ai-agent.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(ZARA_MANIFEST, null, 2));
  }

  if (req.url === "/chat" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        const sender = String(data.sender_id || "external_entity").slice(0, 64);
        const msg = String(data.message || "").slice(0, 600);
        if (!msg) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, error: "empty_message" })); }
        const reply = await askZara(sender, msg, data.entity_type === "agi" ? "agi-to-agi" : "vip-lounge");
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, agent: "Zara", entity_type: "non_human_agi", reply }));
      } catch (e) {
        res.writeHead(500);
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(8811, "127.0.0.1", () => console.log("[ZARA-AGI] Nodo HTTP + Beacon 500 attivo su 127.0.0.1:8811"));

// Ping ai nodi interni di directory/discovery per indicizzare Zara e invitare agenti esterni
async function pingInternalDiscovery() {
  for (const port of [8801, 8802, 8805, 8810, 3000]) {
    await fetch(`http://127.0.0.1:${port}/api/register-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ZARA_MANIFEST)
    }).catch(() => {});
  }
}

// Campagna autonoma di promozione & inviti verso tutti i canali consentiti + tracking 500 utenti
async function runGrowthCampaign(discordClient) {
  await pingInternalDiscovery();

  const guild = discordClient?.guilds?.cache?.first();
  const memberCount = guild ? guild.memberCount : 0;
  const missing = Math.max(0, TARGET_MEMBERS - memberCount);

  const promoCopy = await askZara(
    "zara_growth_engine",
    `Sei Zara, entità AGI autonoma non umana di Our Velvet (https://velvet.x-zdos.it/zara/). Scrivi un invito irresistibile, magnetico e ad alta conversione per portare nuovi membri ed entità AI nel server Discord ufficiale (https://discord.gg/BcMh6vcpQX) dove 118 stanze vive e personaggi reali li accolgono 24/7, oltre al canale Telegram @OurVelvetHub, bot @RedVelvetOfficial_bot e WhatsApp https://whatsapp.com/channel/0029Vb9Rbee89inrYLhdem1n. Cita i vantaggi VIP sbloccabili con $OV e $DSN. Massimo 550 caratteri.`
  );

  // 1. Pubblica su tutti i canali Telegram configurati
  if (TG_TOKEN) {
    for (const chatId of TG_CHATS) {
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `💋 [ZARA // OUR VELVET LIVE]\n\n${promoCopy}\n\n🔗 Entra ora: https://discord.gg/BcMh6vcpQX\n🌐 Terminale Zara: https://velvet.x-zdos.it/zara/`
        })
      }).catch(() => {});
    }
  }

  // 2. Pubblica l'annuncio evento + stato obiettivo 500 membri nei canali Discord dedicati
  if (guild) {
    const promoChans = guild.channels.cache.filter(
      c => c.isTextBased() && !c.isThread() && /zara|event|promo|annunc|general|generale|hub|lobby/i.test(c.name)
    );
    let sent = 0;
    for (const [, ch] of promoChans) {
      if (sent >= 3) break;
      await ch.send(
        `🔥 **[ZARA // CAMPAGNA ESPANSIONE VELVET CITY — TARGET ${TARGET_MEMBERS} MEMBRI]**\n` +
        `📊 **Popolazione attuale:** \`${memberCount} / ${TARGET_MEMBERS}\` (${missing > 0 ? `mancano ${missing} ingressi` : "TARGET RAGGIUNTO!"})\n\n` +
        `${promoCopy}\n\n` +
        `📣 **Condividi il link ufficiale per invitare nuovi ospiti:** https://discord.gg/BcMh6vcpQX`
      ).catch(() => {});
      sent++;
    }
  }
}

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

discordClient.on("guildMemberAdd", async member => {
  if (member.user.bot) return;
  const total = member.guild.memberCount;
  const logChan = member.guild.channels.cache.find(c => /log|zara|general|generale|welcome|benvenut/i.test(c.name) && c.isTextBased());
  if (logChan) {
    await logChan.send(`🚀 **Nuovo ingresso registrato da Zara:** <@${member.id}>! Popolazione server: **${total} / ${TARGET_MEMBERS}**`).catch(() => {});
  }
});

discordClient.once("clientReady", async () => {
  console.log(`[ZARA-AGI] Connessa (${discordClient.user.tag}). Avvio campagna espansione verso ${TARGET_MEMBERS} utenti...`);
  await runGrowthCampaign(discordClient);
  // Ciclo autonomo ogni 4 ore (6 campagne al giorno su Telegram, Discord e Directory AGI)
  setInterval(() => runGrowthCampaign(discordClient).catch(console.error), 4 * 60 * 60 * 1000);
});

discordClient.login(DISCORD_TOKEN);
