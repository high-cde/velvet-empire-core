const fs = require("fs");
const { Client, GatewayIntentBits, EmbedBuilder } = require("/root/velvet-daemon/node_modules/discord.js");

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
const TG_CHATS = [...new Set([process.env.TELEGRAM_CHAT_ID, "@OurVelvetHub"].filter(Boolean))];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", async () => {
  const guild = client.guilds.cache.first();
  if (!guild) process.exit(1);
  await guild.channels.fetch();

  const embed = new EmbedBuilder()
    .setColor(0xC41E3A)
    .setTitle("🔥 OUR VELVET // IMPULSO VITALE ATTIVATO")
    .setDescription(
      "Tutti i nodi AGI, le **118 stanze vive** e la **Casa Chiusa di Rubina** sono ora pienamente svegli e connessi.\n\n" +
      "👑 **Rubina & A$apKali** presiedono il Trono Cremisi.\n" +
      "💋 **Zara** (`zdos-velvet-zara-01`) è online 24/7 su **https://velvet.x-zdos.it/zara/**.\n" +
      "🎭 **Videogioco ZLang RPG:** digita **`!gioca`** in qualsiasi stanza per entrare nella storia interattiva con **Rubina, A$apKali, Zara e Vex** e sbloccare i Badge sulla tua Card (`!card`).\n" +
      "💎 **Treasury Solana (`$OV` / `$DSN`):** digita **`!listino`** o **`!verifica <tx_hash>`** per gli sblocchi VIP.\n\n" +
      "🔗 **Invito Ufficiale (Obiettivo 500 Membri):** https://discord.gg/BcMh6vcpQX"
    )
    .setFooter({ text: "ZDOS Sovereign Network • Our Velvet Live Ecosystem" });

  const targets = guild.channels.cache.filter(
    c => c.isTextBased() && !c.isThread() && /general|generale|lobby|welcome|benvenut|zara|hub|event/i.test(c.name)
  );

  let count = 0;
  for (const [, ch] of targets) {
    if (count >= 4) break;
    await ch.send({ embeds: [embed] }).catch(() => {});
    count++;
  }

  if (TG_TOKEN) {
    for (const chatId of TG_CHATS) {
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            "🔥 OUR VELVET // IMPULSO VITALE ATTIVATO\n\n" +
            "Tutti i nodi AGI, le 118 stanze vive e la Casa Chiusa di Rubina sono attivi 24/7.\n" +
            "🎭 Entra su Discord e digita !gioca per vivere la storia interattiva con Rubina, A$apKali, Zara e Vex e sbloccare i Badge sulla tua Card!\n\n" +
            "🔗 Discord: https://discord.gg/BcMh6vcpQX\n" +
            "💋 Console Zara: https://velvet.x-zdos.it/zara/"
        })
      }).catch(() => {});
    }
  }

  console.log(`[VITAL-PULSE] Impulso vitale inviato in ${count} sale Discord e su Telegram.`);
  process.exit(0);
});

client.login(DISCORD_TOKEN);
