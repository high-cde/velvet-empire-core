const { Client, GatewayIntentBits, ChannelType } = require("/root/velvet-daemon/node_modules/discord.js");
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
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

async function askClaw(persona, channel, prompt) {
  const r = await fetch("http://127.0.0.1:8799/claw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, role: "Velvet Empire Executive", channel, persona })
  });
  return await r.json();
}

async function postTelegram(text) {
  const r = await fetch("http://127.0.0.1:8799/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  return await r.json();
}

async function sendChunked(ch, text) {
  if (!ch || !text) return;
  if (text.length <= 1900) return ch.send(text);
  await ch.send(text.slice(0, 1900));
  await ch.send(text.slice(1900, 3800));
}

// DIVISIONE 1: RUBINA - Direzione Suprema, Ordini & Retention VIP (ogni 3 ore)
async function rubinaExecutiveCycle(guild) {
  const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
  const target = channels.find(c => /trono-delle-padrone|rubina-e-companion/i.test(c.name)) || channels.find(c => c.name === "claw-test-lab");
  const d = await askClaw("rubina", target ? target.id : "rubina", "Impartisci una direttiva seducente e autorevole per i membri della Loggia Velvet 18+, invitandoli a dimostrare devozione tramite !listino e a prenotare una sala privata con te.");
  if (d.ok && target) {
    await sendChunked(target, `👑 **[RUBINA // DIREZIONE SUPREMA]**\n${d.reply}`);
    console.log(`[RUBINA-EXEC] Pubblicato in #${target.name}`);
  }
}

// DIVISIONE 2: ZARA - Growth, Funnel & Monetizzazione (ogni 2 ore)
async function zaraGrowthCycle(guild) {
  const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
  const dropCh = channels.find(c => /last-minute-drops|arena-contest/i.test(c.name)) || channels.find(c => c.name === "claw-test-lab");
  const d = await askClaw("zara", dropCh ? dropCh.id : "zara", "Lancia un drop esclusivo e una sfida di reclutamento per Velvet City (https://velvet.x-zdos.it): invita gli utenti a scalare i ranghi, usare !listino per sbloccare le stanze 18+ e portare nuovi membri.");
  if (d.ok && dropCh) {
    await sendChunked(dropCh, `🩸 **[ZARA // DROP & GROWTH ENGINE]**\n${d.reply}`);
    console.log(`[ZARA-GROWTH] Pubblicato in #${dropCh.name}`);
  }
}

// DIVISIONE 3: BROADCAST MULTICANALE (ogni 6 ore su Discord + Telegram @OurVelvetHub)
async function empireBroadcastCycle(guild) {
  const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
  const annCh = channels.find(c => /annunci-globali/i.test(c.name)) || channels.find(c => c.name === "claw-test-lab");
  const d = await askClaw("zara", "broadcast", "Scrivi un comunicato ad alta conversione per l'ecosistema AI 18+ Our Velvet (https://velvet.x-zdos.it) e ZDOS (https://x-zdos.it): presenta l'esperienza immersiva 24/7 con Rubina e Zara, l'economia on-chain Solana ($OV e $DSN) e l'accesso immediato ai pass VIP.");
  if (d.ok) {
    if (annCh) await sendChunked(annCh, `📡 **[VELVET EMPIRE // COMUNICATO UFFICIALE]**\n${d.reply}`);
    const tg = await postTelegram(`🩸 **VELVET CITY // AI 18+ EMPIRE**\n\n${d.reply}\n\n🔗 **Accedi al Portale:** https://velvet.x-zdos.it`);
    console.log(`[EMPIRE-BROADCAST] Discord=#${annCh ? annCh.name : "n/d"} | Telegram=${JSON.stringify(tg)}`);
  }
}

// DIVISIONE 4: ACCOGLIENZA AUTOMATICA NUOVI MEMBRI IN LOBBY
client.on("guildMemberAdd", async member => {
  const lobby = member.guild.channels.cache.find(c => /waiting-room-lobby|colloquio-iniziazione/i.test(c.name));
  if (!lobby) return;
  const d = await askClaw("usher", lobby.id, `Dai il benvenuto ufficiale e seducente a ${member.user.username} nella Lobby di Velvet City, spiegandogli in 4 righe come esplorare le stanze e usare !listino per accedere ai livelli VIP 18+.`);
  if (d.ok) await sendChunked(lobby, `🕯️ <@${member.id}> ${d.reply}`);
});

client.once("clientReady", async () => {
  console.log(`[VELVET-EMPIRE] Motore Esecutivo Avviato su ${client.user.tag}`);
  const guild = client.guilds.cache.first();
  if (!guild) return;
  await guild.channels.fetch().catch(() => {});
  const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

  // Pubblica subito il Listino Ufficiale nelle stanze Cassa e VIP
  const cassaCh = channels.find(c => /cassa-tributi-dom/i.test(c.name));
  const vipCh = channels.find(c => /vip-membership-and-passes/i.test(c.name));
  const officialMenu = [
    "🩸 **[SISTEMA PAGAMENTI & SBLOCCHI AUTOMATICI ATTIVO 24/7]**",
    "• **Pass VIP 18+ (30gg):** `0.05 SOL`",
    "• **Tributo Loggia & Registro:** `0.10 SOL`",
    "• **Sala Privata Riservata con Rubina:** `0.25 SOL`",
    "",
    "💳 **Treasury Solana:** `6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD`",
    "⚡ Scrivi `!listino` per i dettagli o `!verifica <TX_HASH>` per sbloccare istantaneamente i tuoi ruoli."
  ].join("\n");

  if (cassaCh) await cassaCh.send(officialMenu).catch(() => {});
  if (vipCh) await vipCh.send(officialMenu).catch(() => {});

  // Avvio immediato di tutte le divisioni
  await rubinaExecutiveCycle(guild);
  await zaraGrowthCycle(guild);
  await empireBroadcastCycle(guild);

  const lab = channels.find(c => c.name === "claw-test-lab");
  if (lab) {
    await lab.send("👑 **[VELVET EMPIRE // FULL AUTONOMOUS MODE ATTIVO]**\n• **Cassa On-Chain:** `!listino` e `!verifica <tx_hash>` attivi con verifica RPC Solana reale + anti-replay SQLite (`tributes.db`).\n• **Rubina:** Direzione VIP & Sale Private attiva (ciclo 3h + sessioni on-demand).\n• **Zara:** Growth, Drops & Telegram `@OurVelvetHub` attivi (ciclo 2h / 6h).\n• **Lobby:** Accoglienza automatica nuovi ingressi attiva.");
  }

  setInterval(() => rubinaExecutiveCycle(guild).catch(console.error), 3 * 60 * 60 * 1000);
  setInterval(() => zaraGrowthCycle(guild).catch(console.error), 2 * 60 * 60 * 1000);
  setInterval(() => empireBroadcastCycle(guild).catch(console.error), 6 * 60 * 60 * 1000);
});

client.login(token);
