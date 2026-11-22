const { Client, GatewayIntentBits } = require("/root/velvet-daemon/node_modules/discord.js");
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

(async () => {
  console.log("[1/2] Invio comando !sveglia-agi a VELVET-CLAW // XAI-01...");
  const r = await fetch("http://127.0.0.1:8799/claw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Esegui il protocollo di risveglio della flotta AGI: conferma tutti i servizi PM2 online, la RAM libera, il saldo SOL reale del wallet treasury, i mint $DSN e $OV e lo stato operativo di Rubina, Zara e dei canali Telegram @OurVelvetHub e @VexLsd.",
      role: "Dr. High (VPS Sovereign Shell)",
      channel: "claw-test-lab",
      persona: "orchestrator"
    })
  });
  const d = await r.json();
  if (!d.ok) {
    console.error("Errore demone:", d);
    process.exit(1);
  }

  console.log("\n=== RISPOSTA VELVET-CLAW ===\n" + d.reply + "\n===========================\n");

  console.log("[2/2] Pubblicazione diretta nel canale Discord #claw-test-lab...");
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.once("ready", async () => {
    try {
      for (const guild of client.guilds.cache.values()) {
        const ch = guild.channels.cache.find(c => c.name === "claw-test-lab");
        if (ch) {
          await ch.send(`⚡ **[RISVEGLIO FLOTTA AGI // TRIGGER DA VPS]**\n${String(d.reply).slice(0, 1850)}`);
          console.log(`[OK] Messaggio inviato in #${ch.name} (${ch.id}) su "${guild.name}"`);
        }
      }
    } catch (e) {
      console.error("Errore invio Discord:", e);
    } finally {
      client.destroy();
      process.exit(0);
    }
  });
  client.login(token);
})();
