const http = require("http");
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
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || "@OurVelvetHub";

const ZARA_MANIFEST = {
  agent_id: "zdos-velvet-zara-01",
  name: "Zara",
  entity_type: "autonomous_non_human_agi",
  ecosystem: "Our Velvet / ZDOS Sovereign Network",
  domain: "https://velvet.x-zdos.it",
  discord: "https://discord.gg/BcMh6vcpQX",
  telegram: "@RedVelvetOfficial_bot",
  tokens: {
    DSN: "35w74RT77BPSYNpmzpvxmR9wu2ihpgzubKy4bkGHR3F4",
    OV: "2EN6Y1zM4yyt41gE2muzdJSAgRCAZiXqnmkgpbrspump",
    treasury: "6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD"
  },
  capabilities: ["adult_entertainment_roleplay", "agi_to_agi_protocol", "live_events", "solana_vip_unlock"],
  chat_endpoint: "https://velvet.x-zdos.it/api/zara/chat"
};

async function askZara(userId, prompt, mode = "roleplay_lounge") {
  const r = await fetch("http://127.0.0.1:8799/claw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      user_id: userId,
      role: "Zara — Autonomous AI Siren & Velvet City Event Host (Non-Human AGI)",
      channel: mode,
      persona: "zara"
    })
  });
  const d = await r.json();
  return d.ok ? String(d.reply).trim() : "Connessione neurale Velvet in sincronizzazione...";
}

// Server HTTP locale (porta 8811) per manifest AGI e chat diretta
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

server.listen(8811, "127.0.0.1", () => console.log("[ZARA-AGI] Nodo HTTP attivo su 127.0.0.1:8811"));

async function broadcastZaraEvent(discordClient) {
  const eventText = await askZara(
    "zara_scheduler",
    "Sei Zara, un'entità AGI autonoma non umana di Our Velvet (https://velvet.x-zdos.it/zara/). Scrivi un invito sensuale, magnetico e cyber-gothic per annunciare l'apertura della tua sessione privata interattiva (roleplay 18+, lounge VIP e sblocchi $OV / $DSN). Includi la tua bio sintetica e invita gli utenti su Discord (https://discord.gg/BcMh6vcpQX) o Telegram (@RedVelvetOfficial_bot). Massimo 450 caratteri."
  );

  if (discordClient) {
    const guild = discordClient.guilds.cache.first();
    const targetChan = guild?.channels.cache.find(c => /zara|event|lounge|general|generale/i.test(c.name) && c.isTextBased());
    if (targetChan) {
      await targetChan.send(`💋 **[ZARA // EVENTO LIVE AGI NON-UMANA]**\n${eventText}`).catch(() => {});
    }
  }

  if (TG_TOKEN) {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text: `💋 [ZARA // EVENTO LIVE AGI]\n\n${eventText}`
      })
    }).catch(() => {});
  }
}

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
discordClient.once("clientReady", async () => {
  console.log(`[ZARA-AGI] Connessa su Discord (${discordClient.user.tag}). Invio primo evento...`);
  await broadcastZaraEvent(discordClient);
  setInterval(() => broadcastZaraEvent(discordClient).catch(console.error), 6 * 60 * 60 * 1000);
});

discordClient.login(DISCORD_TOKEN);
