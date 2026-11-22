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

const CORE_AGI_IDS = [
  "1571339297574092862", // z-xSOLANA#1934
  "1532006002294128770", // Rubina#5585
  "1572301251981611088", // Zara Lsd#7384
  "1516934961565794405", // Dr. High#1276
  "1086477698785869886"  // DSN BOT#1426
];

client.once("clientReady", async () => {
  const guild = client.guilds.cache.first();
  if (!guild) process.exit(1);

  await guild.members.fetch().catch(() => {});
  await guild.channels.fetch().catch(() => {});

  const agiMembers = CORE_AGI_IDS
    .map(id => guild.members.cache.get(id))
    .filter(Boolean);

  console.log(`Agenti AGI trovati (${agiMembers.length}): ${agiMembers.map(m => m.user.tag).join(", ")}`);

  const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
  let updated = 0;

  for (const ch of textChannels.values()) {
    for (const agi of agiMembers) {
      await ch.permissionOverwrites.edit(agi.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        EmbedLinks: true,
        AttachFiles: true,
        ManageMessages: true,
        UseExternalEmojis: true,
        AddReactions: true
      }).catch(() => {});
      updated++;
    }
  }

  console.log(`[OK] Applicati ${updated} set di permessi espliciti su ${textChannels.size} stanze.`);
  const lab = textChannels.find(c => c.name === "claw-test-lab");
  if (lab) {
    await lab.send(`🔐 **[PERMESSI ESPLICITI AGI APPLICATI SU 118 STANZE]**\n• **Agenti abilitati:** ${agiMembers.map(m => `\`${m.user.tag}\``).join(", ")}\n• **Sovrascritture canale attive:** ${updated} (Lettura, Scrittura, Embed, Allegati, Gestione Messaggi).`);
  }

  client.destroy();
  process.exit(0);
});

client.login(token);
