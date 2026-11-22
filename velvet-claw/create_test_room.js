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
if (!token) {
  console.error("Token Discord non trovato negli .env!");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("ready", async () => {
  try {
    for (const guild of client.guilds.cache.values()) {
      await guild.members.fetch().catch(() => {});
      const ownerMember = guild.members.cache.find(m =>
        /asapkali|highkali/i.test(m.user.username) || /asapkali|highkali/i.test(m.displayName)
      );

      let ch = guild.channels.cache.find(c => c.name === "claw-test-lab");
      if (!ch) {
        const overwrites = [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageChannels
            ]
          }
        ];

        if (ownerMember) {
          overwrites.push({
            id: ownerMember.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages
            ]
          });
        }

        ch = await guild.channels.create({
          name: "claw-test-lab",
          type: ChannelType.GuildText,
          topic: "Laboratorio Privato VELVET-CLAW // Solo Admin & Test AGI",
          permissionOverwrites: overwrites
        });
        console.log(`[OK] Creata stanza privata #${ch.name} (${ch.id}) su server "${guild.name}"`);
      } else {
        console.log(`[INFO] Stanza #${ch.name} (${ch.id}) già esistente su "${guild.name}"`);
      }

      await ch.send(`🧪 **[LABORATORIO PRIVATO VELVET-CLAW ATTIVO]**\nQuesta stanza è nascosta a \`@everyone\` ed è riservata esclusivamente ai tuoi test AGI (${ownerMember ? `<@${ownerMember.id}>` : "Admin"}).\n\nComandi pronti da testare qui dentro:\n• \`!sveglia-agi\`\n• \`!claw stato reale\`\n• \`!rubina <messaggio>\` | \`!zara <messaggio>\`\n• \`!stanza <nome> | <archetipo> | <tema>\`\n• \`!sala-privata <nome>\`\n• \`!sessione #canale | <tema>\`\n• \`!gioco\`\n• \`!broadcast <argomento>\``);
    }
  } catch (e) {
    console.error("Errore:", e);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(token);
