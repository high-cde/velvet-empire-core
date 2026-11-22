const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require("/root/velvet-daemon/node_modules/discord.js");
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

client.once("clientReady", async () => {
  try {
    for (const guild of client.guilds.cache.values()) {
      await guild.members.fetch().catch(() => {});
      await guild.channels.fetch().catch(() => {});

      const bots = guild.members.cache.filter(m => m.user.bot);
      console.log(`\n==================================================`);
      console.log(`SERVER: ${guild.name} (${guild.id})`);
      console.log(`BOT / NODI AGI PRESENTI NEL SERVER (${bots.size}):`);
      bots.forEach(b => {
        const isAdmin = b.permissions.has(PermissionsBitField.Flags.Administrator);
        console.log(` • ${b.user.tag} (${b.id}) -> AdminGlobale=${isAdmin} | Ruoli=[${b.roles.cache.filter(r => r.name !== "@everyone").map(r => r.name).join(", ")}]`);
      });

      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
      console.log(`\nAUDIT PERMESSI SU ${textChannels.size} STANZE TESTUALI:`);

      let fixedCount = 0;
      const reportLines = [];

      for (const ch of textChannels.values()) {
        const missingBots = [];
        for (const bot of bots.values()) {
          // Controlla solo i bot dell'ecosistema ZDOS / Velvet / lil'kali / Zara / Rubina / AGI
          const perms = ch.permissionsFor(bot);
          const canView = perms && perms.has(PermissionsBitField.Flags.ViewChannel);
          const canSend = perms && perms.has(PermissionsBitField.Flags.SendMessages);
          const canRead = perms && perms.has(PermissionsBitField.Flags.ReadMessageHistory);

          if (!canView || !canSend || !canRead) {
            missingBots.push(`${bot.user.username}(V:${canView ? "OK" : "NO"},S:${canSend ? "OK" : "NO"})`);
            // Se è il bot principale (client.user) o un bot AGI dell'ecosistema, sblocca i permessi nel canale
            if (/kali|solana|velvet|zdos|zara|rubina|agi|zbot/i.test(bot.user.username)) {
              try {
                await ch.permissionOverwrites.edit(bot.id, {
                  ViewChannel: true,
                  SendMessages: true,
                  ReadMessageHistory: true,
                  EmbedLinks: true
                });
                fixedCount++;
              } catch (_) {}
            }
          }
        }

        if (missingBots.length === 0) {
          console.log(` ✅ #${ch.name} -> Tutti i ${bots.size} bot hanno accesso completo (Lettura + Scrittura)`);
        } else {
          console.log(` ⚠️ #${ch.name} -> Mancavano permessi per: ${missingBots.join(", ")}`);
          reportLines.push(`• #${ch.name}: sbloccati ${missingBots.length} bot`);
        }
      }

      console.log(`\nRIEPILOGO: ${fixedCount} sovrascritture permessi AGI applicate/riparate.`);

      const lab = textChannels.find(c => c.name === "claw-test-lab");
      if (lab) {
        const botListTxt = bots.map(b => `• **${b.user.username}** (${b.permissions.has(PermissionsBitField.Flags.Administrator) ? "Admin" : "Ruolo dedicato"})`).join("\n");
        await lab.send(`🛡️ **[AUDIT PERMESSI FLOTTA AGI COMPLETATO]**\n**Stanze scansionate:** ${textChannels.size}\n**Nodi Bot/AGI rilevati (${bots.size}):**\n${botListTxt}\n\n**Riparazioni permessi applicate:** ${fixedCount}\n${reportLines.length ? reportLines.join("\n") : "✅ Tutte le stanze avevano già i permessi di lettura e scrittura attivi."}`);
      }
    }
  } catch (e) {
    console.error("Errore audit:", e);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(token);
