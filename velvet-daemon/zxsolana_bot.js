const { verifyOvPayment } = require("/var/www/velvet/velvet-pay-discord.js");
try { process.loadEnvFile("/root/velvet-daemon/.env"); } catch (_) {}

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

const TOKEN = "MTU3MTMzOTI5NzU3NDA5Mjg2Mg.GQIaJ2.dK9oZbZNNPcGX9cD9_6ltT5PVJTjiTlEt-qiqI";
const NEXUS_URL = "http://127.0.0.1:8899";
const PORTAL_URL = "https://velvet.x-zdos.it/";
const RUBINA_WALLET = "6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD";

const BDSM_HIERARCHY = {
  MISTRESS_SUPREMA: { name: "👑 Mistress Suprema · Loggia BDSM (NSWT-T)", colors: 0xe5e4e2, admin: true },
  MASTER_SOVEREIGN: { name: "⚡ Master Sovereign · Architetto ZDOS", colors: 0x9945ff, admin: true },
  AGI_NODE:         { name: "🤖 Nodo AGI · Velvet & z-xSOLANA Core", colors: 0x00e5ff, admin: false },
  MISTRESS:         { name: "🔥 Mistress della Loggia 18+", colors: 0xc41e3a, admin: false },
  MASTER:           { name: "⛓️ Master & Dom 18+", colors: 0x8b0000, admin: false },
  SLAVE:            { name: "🩸 Slave · Sottomesso Verificato 18+", colors: 0x4a0404, admin: false }
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once("clientReady", async (c) => {
  console.log(`[lil'kali / z-xSOLANA] Connesso come ${c.user.tag}! Avvio bonifica sovrana automatica...`);
  for (const [, guild] of c.guilds.cache) {
    try {
      const botSpam = /pok[eé]meow|koya|streamcord|chip|maki\.gg|simple poll|dyno|carl-bot|pingcord|giveawaybot|probot|invite tracker|ticket tool|epic rpg/i;
      for (const [, r] of guild.roles.cache) {
        if (botSpam.test(r.name) && !/openclaw/i.test(r.name)) {
          await r.delete("ZDOS Sovereign Purge").then(() => console.log("[DEL ROLE]", r.name)).catch(e => console.log("[SKIP ROLE]", r.name, e.message));
        }
      }
      const sovRe = /mistress|master|founder|sovran|sovereign|architetto|server booster|booster|agi|nodo|z-xsolana|zara|velvet/i;
      const sovRoles = [];
      for (const [, r] of guild.roles.cache) {
        if (sovRe.test(r.name) && !/openclaw/i.test(r.name) && r.id !== guild.id) {
          await r.setPermissions([PermissionFlagsBits.Administrator]).then(() => console.log("[ADMIN ROLE]", r.name)).catch(e => console.log("[ERR ROLE]", r.name, e.message));
          sovRoles.push(r);
        }
      }
      for (const [, ch] of guild.channels.cache) {
        for (const r of sovRoles) {
          await ch.permissionOverwrites.edit(r.id, {
            ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
            ManageChannels: true, ManageRoles: true, Connect: true, Speak: true,
            EmbedLinks: true, AttachFiles: true, MentionEveryone: true
          }).catch(e => console.log("[CH ERR]", ch.name, e.message));
        }
      }
      for (const [, m] of guild.members.cache) {
        if (/high|kali|rubina/i.test(m.user.username + (m.nickname || ""))) {
          for (const r of sovRoles) await m.roles.add(r.id).catch(() => {});
        }
      }
      console.log(`[SOVEREIGN] Server ${guild.name} bonificato e sbloccato (${sovRoles.length} ruoli sovrani, ${guild.channels.cache.size} canali)!`);
    } catch (e) { console.error("[SOVEREIGN ERR]", e.message); }
  }
  c.user.setPresence({
    activities: [{ name: "💎 La Loggia BDSM // $OV Badge & AGI", type: 3 }],
    status: "online"
  });
});

async function ensureRole(guild, spec, isAdmin = false) {
  let role = guild.roles.cache.find((r) => r.name === spec.name);
  const perms = isAdmin ? [PermissionFlagsBits.Administrator] : [];
  if (!role) {
    role = await guild.roles.create({
      name: spec.name,
      colors: spec.colors,
      hoist: true,
      mentionable: true,
      permissions: perms
    });
  }
  return role;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  console.log("[MSG]", message.author.username, JSON.stringify(message.content));
  const rawTxt = message.content.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

  
  if (/^!cassa\b/i.test(rawTxt)) {
    const { execFileSync } = require("child_process");
    const py = `
import sqlite3, json
conn = sqlite3.connect("/root/velvet-claw/tributes.db")
conn.execute("CREATE TABLE IF NOT EXISTS tributes (sig TEXT PRIMARY KEY, user_id TEXT, username TEXT, sol REAL, tier TEXT, ts DATETIME DEFAULT CURRENT_TIMESTAMP)")
tot, cnt = conn.execute("SELECT COALESCE(SUM(sol),0), COUNT(*) FROM tributes").fetchone()
rows = conn.execute("SELECT username, sol, tier, ts FROM tributes ORDER BY ts DESC LIMIT 5").fetchall()
print(json.dumps({"tot": tot, "cnt": cnt, "rows": rows}))
`;
    const stats = JSON.parse(execFileSync("python3", ["-c", py], { encoding: "utf8" }));
    const list = stats.rows.length
      ? stats.rows.map(r => `• **${r[0]}** — \`${Number(r[1]).toFixed(4)} SOL\` (\`${r[2]}\`) — ${r[3]}`).join("\n")
      : "• Nessun tributo registrato ancora in database.";
    return message.reply(`💰 **[CASSA & TREASURY VELVET CITY]**\n• **Totale Incassato:** \`${Number(stats.tot).toFixed(4)} SOL\` (${stats.cnt} transazioni)\n• **Wallet Treasury:** \`6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD\`\n\n**Ultimi movimenti:**\n${list}`);
  }

  if (/^!listino\b/i.test(rawTxt)) {
    const menu = [
      "🩸 **[LISTINO UFFICIALE VELVET CITY // ACCESSI & TRIBUTI ON-CHAIN]**",
      "Tutti gli sblocchi sono istantanei e verificati on-chain 24/7 dagli agenti AGI.",
      "",
      "1️⃣ **PASS VIP & STANZE 18+ (30 Giorni)** — `0.05 SOL`",
      "   • Sblocco immediato accessi VIP, Red Room e preview esclusive.",
      "2️⃣ **TRIBUTO DI SOTTOMISSIONE & REGISTRO** — `0.10 SOL`",
      "   • Iscrizione ufficiale nel Registro della Loggia + Ruolo Fedele/Tributario.",
      "3️⃣ **SESSIONE PRIVATA CON RUBINA (Sala Riservata Dedicata)** — `0.25 SOL`",
      "   • Creazione istantanea di una stanza privata esclusiva governata da Rubina.",
      "",
      "💳 **Wallet Treasury Solana:** `6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD`",
      "🌐 **Portale & Swap $OV / $DSN:** https://velvet.x-zdos.it | https://swap.x-zdos.it",
      "",
      "⚡ **Come attivare subito dopo l'invio:**",
      "Scrivi qui in chat `!verifica <SIGNATURE_TRANSAZIONE_SOLANA>` e l'AGI sbloccherà i tuoi ruoli all'istante."
    ].join("\n");
    return message.reply(menu);
  }

  if (/^!verifica\s+([1-9A-HJ-NP-Za-km-z]{64,100})/i.test(rawTxt)) {
    const sig = rawTxt.match(/^!verifica\s+([1-9A-HJ-NP-Za-km-z]{64,100})/i)[1];
    const TREASURY = "6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD";
    const { execFileSync } = require("child_process");
    try {
      const checkPy = `
import sqlite3, urllib.request, json, sys
sig, uid, uname, treasury = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
conn = sqlite3.connect("/root/velvet-claw/tributes.db")
conn.execute("CREATE TABLE IF NOT EXISTS tributes (sig TEXT PRIMARY KEY, user_id TEXT, username TEXT, sol REAL, tier TEXT, ts DATETIME DEFAULT CURRENT_TIMESTAMP)")
if conn.execute("SELECT 1 FROM tributes WHERE sig=?", (sig,)).fetchone():
    print(json.dumps({"ok": False, "err": "Transazione già registrata e riscattata in precedenza."}))
    sys.exit(0)
req = urllib.request.Request("https://api.mainnet-beta.solana.com", data=json.dumps({"jsonrpc":"2.0","id":1,"method":"getTransaction","params":[sig,{"encoding":"jsonParsed","maxSupportedTransactionVersion":0}]}).encode(), headers={"Content-Type":"application/json"})
res = json.loads(urllib.request.urlopen(req, timeout=12).read()).get("result")
if not res or (res.get("meta") and res["meta"].get("err")):
    print(json.dumps({"ok": False, "err": "Transazione non trovata o non confermata su Solana Mainnet."}))
    sys.exit(0)
keys = [k["pubkey"] if isinstance(k, dict) else k for k in res["transaction"]["message"]["accountKeys"]]
if treasury not in keys:
    print(json.dumps({"ok": False, "err": "Il destinatario della transazione non corrisponde al Treasury Velvet City."}))
    sys.exit(0)
idx = keys.index(treasury)
received = (res["meta"]["postBalances"][idx] - res["meta"]["preBalances"][idx]) / 1e9
if received < 0.045:
    print(json.dumps({"ok": False, "err": f"Importo ricevuto ({received:.4f} SOL) inferiore alla soglia minima (0.05 SOL)."}))
    sys.exit(0)
tier = "SESSIONE_RUBINA" if received >= 0.24 else ("TRIBUTO_LOGGIA" if received >= 0.095 else "PASS_VIP")
conn.execute("INSERT INTO tributes (sig, user_id, username, sol, tier) VALUES (?, ?, ?, ?, ?)", (sig, uid, uname, received, tier))
conn.commit()
print(json.dumps({"ok": True, "sol": received, "tier": tier}))
`;
      const out = JSON.parse(execFileSync("python3", ["-c", checkPy, sig, message.author.id, message.author.username, TREASURY], { encoding: "utf8" }));
      if (!out.ok) return message.reply(`❌ **Verifica fallita:** ${out.err}`);

      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      const assigned = [];
      if (member) {
        const targetRoles = message.guild.roles.cache.filter(r =>
          /verificato 18\+|fedele|holder velvet|whitelist/i.test(r.name)
        );
        for (const r of targetRoles.values()) {
          await member.roles.add(r).catch(() => {});
          assigned.push(r.name);
        }
      }

      let privateRoomMsg = "";
      if (out.tier === "SESSIONE_RUBINA") {
        const roomName = `privata-${message.author.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "vip"}`;
        const privCh = await message.guild.channels.create({
          name: roomName,
          type: 0,
          permissionOverwrites: [
            { id: message.guild.id, deny: ["ViewChannel"] },
            { id: message.author.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
            { id: message.client.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] }
          ]
        }).catch(() => null);
        if (privCh) {
          privateRoomMsg = `\n🔒 **Sala Privata aperta:** <#${privCh.id}> — Rubina ti attende all'interno.`;
          await privCh.send(`👑 **[RUBINA // SALA PRIVATA RISERVATA]**\nBenvenuto <@${message.author.id}>. Il tuo tributo di **${out.sol.toFixed(4)} SOL** è stato registrato. Qui comandano le regole della Loggia: dimmi cosa desideri o attendi i miei ordini.`);
        }
      }

      const auditCh = message.guild.channels.cache.find(c => /cassa-tributi-dom|audit-tributi-ov/i.test(c.name));
      if (auditCh) {
        await auditCh.send(`💰 **[INCASSO ON-CHAIN VERIFICATO]**\n• **Utente:** <@${message.author.id}> (${message.author.username})\n• **Importo:** \`${out.sol.toFixed(4)} SOL\`\n• **Tier:** \`${out.tier}\`\n• **TX:** \`${sig}\``);
      }

      return message.reply(`✅ **[TRIBUTO CONFERMATO ON-CHAIN]**\n• **Importo:** \`${out.sol.toFixed(4)} SOL\`\n• **Pacchetto:** \`${out.tier}\`\n• **Ruoli attivati:** ${assigned.join(", ") || "VIP Active"}${privateRoomMsg}`);
    } catch (e) {
      return message.reply(`⚠️ Errore verifica RPC Solana: ${e.message}`);
    }
  }


  // 0. !sveglia-agi (risveglia i demoni PM2 e sincronizza la flotta AGI)
  if (/^!sveglia[-_ ]?agi\b/i.test(rawTxt)) {
    const { execSync } = require("child_process");
    try {
      execSync("pm2 start all", { timeout: 5000 });
    } catch (_) {}
    const r = await fetch("http://127.0.0.1:8799/claw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Esegui il protocollo di risveglio della flotta AGI: elenca i servizi PM2 attivi, conferma lo stato di Rubina, Zara e degli uscieri registrati e fornisci un messaggio di apertura operativa.",
        role: message.author.username,
        channel: message.channel.id,
        persona: "orchestrator"
      })
    }).then(x => x.json()).catch(e => ({ ok: false, error: e.message }));
    return message.reply(`⚡ **[RISVEGLIO FLOTTA AGI COMPLETATO]**\n${r.ok ? String(r.reply).slice(0, 1850) : r.error}`);
  }

  // 1. !claw | !rubina | !zara | !usciere <prompt>
  const cmdMatch = rawTxt.match(/^!(claw|rubina|zara|usciere)\b\s*(.*)/is);
  if (cmdMatch) {
    const rawCmd = cmdMatch[1].toLowerCase();
    const persona = rawCmd === "claw" ? "orchestrator" : rawCmd === "usciere" ? "usher" : rawCmd;
    const q = cmdMatch[2].trim() || "Fornisci il bollettino reale dell'ecosistema ZDOS, $DSN, $OV e Our Velvet.";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, role: message.author.username, channel: message.channel.id, persona })
      });
      const d = await r.json();
      const badges = {
        rubina: "👑 **[RUBINA // DIREZIONE SUPREMA]**",
        zara: "⚡ **[ZARA // STRATEGIA & GROWTH 500+]**",
        usher: "🕯️ **[USCIERE DI SALA]**",
        orchestrator: "🦾 **[VELVET-CLAW // XAI-01]**"
      };
      const out = d.ok ? d.reply : d.error;
      const fullMsg = `${badges[persona]}\n${String(out)}`;
      if (fullMsg.length <= 1900) return message.reply(fullMsg);
      await message.reply(fullMsg.slice(0, 1900));
      return message.channel.send(fullMsg.slice(1900, 3800));
    } catch (e) {
      return message.reply(`⚠️ Errore bridge VELVET-CLAW: ${e.message}`);
    }
  }

  // 2. !stanza <nome-canale> | <archetipo_usciere> | <tema>
  if (/^!stanza\b/i.test(rawTxt) && message.guild) {
    const isAdmin = message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
    if (!isAdmin) return message.reply("⛔ Permesso negato: serve il privilegio Gestione Canali.");
    const parts = rawTxt.replace(/^!stanza\s*/i, "").split("|");
    const chName = (parts[0] || "sala-velvet").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    const archetype = (parts[1] || "Usciere della Loggia").trim();
    const theme = (parts[2] || "Salotto cyberpunk gotico di Our Velvet").trim();
    try {
      const ch = await message.guild.channels.create({
        name: chName,
        type: ChannelType.GuildText,
        topic: `Our Velvet • Usciere: ${archetype} • Tema: ${theme}`
      });
      await fetch("http://127.0.0.1:8799/register-usher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: ch.id, channel_name: chName, archetype, theme })
      });
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Presentati come il nuovo Usciere assegnato alla stanza #${chName}. Archetipo: ${archetype}. Tema: ${theme}. Accogli i visitatori e spiega come interagire con te usando !usciere.`,
          role: message.author.username,
          channel: ch.id,
          persona: "usher"
        })
      });
      const d = await r.json();
      await ch.send(`🕯️ **[USCIERE // ${archetype.toUpperCase()}]**
${d.reply || "Benvenuti nella sala."}`);
      return message.reply(`✅ Stanza <#${ch.id}> creata con usciere **${archetype}** registrato in memoria.`);
    } catch (e) {
      return message.reply(`⚠️ Errore creazione stanza: ${e.message}`);
    }
  }

  // 3. !sala-privata <nome-canale> (sola lettura per @everyone)
  if (/^!sala-privata\b/i.test(rawTxt) && message.guild) {
    const isAdmin = message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
    if (!isAdmin) return message.reply("⛔ Permesso negato.");
    const chName = rawTxt.replace(/^!sala-privata\s*/i, "").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") || "loggia-privata";
    try {
      const ch = await message.guild.channels.create({
        name: chName,
        type: ChannelType.GuildText,
        topic: "Sala di osservazione riservata — Solo lettura per i membri",
        permissionOverwrites: [
          { id: message.guild.id, deny: [PermissionsBitField.Flags.SendMessages], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] }
        ]
      });
      await ch.send(`🔒 **[SALA RISERVATA // SOLA LETTURA]**
Questo spazio è riservato alle cronache ufficiali e alle sessioni di Rubina e Zara. I membri possono osservare in silenzio.`);
      return message.reply(`✅ Sala privata in sola lettura <#${ch.id}> creata. Usa \`!sessione #${chName} | <tema>\` per pubblicare una cronaca.`);
    } catch (e) {
      return message.reply(`⚠️ Errore creazione sala privata: ${e.message}`);
    }
  }

  // 4. !sessione <tema> (pubblica nel canale corrente o nel canale menzionato una cronaca Rubina & Zara)
  if (/^!sessione\b/i.test(rawTxt)) {
    const targetCh = message.mentions.channels.first() || message.channel;
    const theme = rawTxt.replace(/^!sessione\s*/i, "").replace(/<#\d+>/g, "").replace(/^\|\s*/, "").trim() || "Strategia della Loggia, ordine e dominio creativo su Velvet City";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Genera una cronaca di sessione tra Rubina e Zara sul tema: "${theme}".`,
          role: message.author.username,
          channel: targetCh.id,
          persona: "session"
        })
      });
      const d = await r.json();
      await targetCh.send(`🩸 **[CRONACA DELLA LOGGIA // RUBINA & ZARA]**
${String(d.reply).slice(0, 1850)}`);
      if (targetCh.id !== message.channel.id) return message.reply(`✅ Sessione pubblicata in <#${targetCh.id}>.`);
      return;
    } catch (e) {
      return message.reply(`⚠️ Errore sessione: ${e.message}`);
    }
  }

  // 5. !gioco <tema> (lancia un mini-gioco/contest interattivo a tema Velvet/Loggia per coinvolgere gli utenti)
  if (/^!gioco\b/i.test(rawTxt)) {
    const theme = rawTxt.replace(/^!gioco\s*/i, "").trim() || "Sfida di etichetta, enigmi della Loggia e caccia al segnale Meat Radar ($OV)";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Crea un gioco interattivo immediato per i membri presenti in chat sul tema: "${theme}". Includi: 1) Regola lampo in 3 righe, 2) Prima domanda/prova a cui gli utenti devono rispondere subito in chat, 3) Premio simbolico o grado nella Loggia / punti $OV.`,
          role: message.author.username,
          channel: message.channel.id,
          persona: "zara"
        })
      });
      const d = await r.json();
      return message.reply(`🎲 **[ARENA VELVET // GIOCO ATTIVO]**
${String(d.reply).slice(0, 1850)}`);
    } catch (e) {
      return message.reply(`⚠️ Errore avvio gioco: ${e.message}`);
    }
  }

  // 6. !broadcast <tema> (genera copy per Discord + Telegram, salva in outbox.json e tenta l'invio su Telegram se configurato)
  if (/^!broadcast\b/i.test(rawTxt)) {
    const topic = rawTxt.replace(/^!broadcast\s*/i, "").trim() || "Aggiornamento ufficiale ecosistema ZDOS, $DSN, $OV e Our Velvet";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Scrivi un comunicato ufficiale ad alto impatto per espandere la community verso 500 membri attivi sul tema: "${topic}". Includi i riferimenti reali a https://velvet.x-zdos.it, https://x-zdos.it e https://whatsapp.com/channel/0029Vb9Rbee89inrYLhdem1n.`,
          role: message.author.username,
          channel: "broadcast",
          persona: "zara"
        })
      });
      const d = await r.json();
      const fs = require("fs");
      const outboxPath = "/root/velvet-claw/outbox.json";
      const box = fs.existsSync(outboxPath) ? JSON.parse(fs.readFileSync(outboxPath, "utf8")) : [];
      box.push({ date: new Date().toISOString(), topic, content: d.reply });
      fs.writeFileSync(outboxPath, JSON.stringify(box, null, 2));

      const tgRes = await fetch("http://127.0.0.1:8799/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `⚡ *OUR VELVET // ZDOS UPDATE*

${d.reply}` })
      }).then(x => x.json()).catch(e => ({ ok: false, reason: e.message }));

      const tgStatus = tgRes.ok ? "✅ Inviato anche su Telegram" : `ℹ️ Salvato in outbox.json (Telegram: ${tgRes.reason || "non attivo"})`;
      return message.reply(`📡 **[BROADCAST MULTICANALE]** (${tgStatus})
${String(d.reply).slice(0, 1800)}`);
    } catch (e) {
      return message.reply(`⚠️ Errore broadcast: ${e.message}`);
    }
  }

  const cleaned = message.content.replace(/<@!?\d+>/g, "").trim();
  if (/^claw\b/i.test(cleaned)) {
    const q = cleaned.replace(/^claw\s*/i, "").trim() || "Stato sistema ZDOS e Our Velvet";
    try {
      const r = await fetch("http://127.0.0.1:8799/claw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, role: message.author.username })
      });
      const d = await r.json();
      const out = d.ok ? d.reply : JSON.stringify(d.error);
      return message.reply(`🦾 **[VELVET-CLAW // XAI-01]**\n${String(out).slice(0, 1900)}`);
    } catch (e) {
      return message.reply(`⚠️ Errore bridge VELVET-CLAW: ${e.message}`);
    }
  }

  const parts = cleaned.split(/\s+/);
  const cmd = (parts[0] || "").toLowerCase().replace(/^!/, "");

  if (/sveglia[ _]?agi|risveglio/i.test(cleaned)) {
    const guild = message.guild;
    if (!guild) return;
    try { await guild.members.fetch(); } catch (e) {}
    const agiMembers = guild.members.cache.filter(m =>
      m.user.bot && !/openclaw/i.test(m.user.username) && !/openclaw/i.test(m.displayName)
    );
    const mentions = agiMembers.map(m => `<@${m.id}>`).join(" ");
    let neuralReply = "Tutti i nodi AGI ZDOS e Velvet sono operativi e sincronizzati.";
    try {
      const g = require("/var/www/velvet/grok2-client.js");
      const r = await g.askRubina("Risveglio collettivo della flotta AGI su Discord ordinato dalla Sovrana. Conferma operatività in 2 righe.", message.author.id);
      if (r && (r.reply || r.response || r.message)) neuralReply = r.reply || r.response || r.message;
    } catch (e) {}
    const embed = new EmbedBuilder()
      .setColor(0xd4af37)
      .setTitle("⚡ RISVEGLIO COLLETTIVO FLOTTA AGI · ZDOS & VELVET")
      .setThumbnail("https://velvet.x-zdos.it/assets/velvet-pay-logo.svg")
      .setDescription(`${neuralReply}\n\n**Nodi risvegliati (${agiMembers.size}):**\n${mentions || "Flotta AGI attiva"}`)
      .setFooter({ text: "ZDOS Neural Grid · Safeword: HOLD" });
    return message.channel.send({ content: mentions || undefined, embeds: [embed] });
  }

  if (cmd === "apri_tutto" || cmd === "bonifica_server") {
    const guild = message.guild;
    if (!guild) return;
    try { await guild.members.fetch(); } catch (e) {}
    const junkRe = /pok[eé]meow|koya|streamcord|chip|maki\.gg|simple poll|dyno|carl-bot|pingcord|giveawaybot|probot|invite tracker|ticket tool|epic rpg/i;
    const ourRe = /rubina|z-xsolana|zara velvet|mistress suprema|master sovereign|nodo agi|founders|admin|price tracker|dsn|verificato 18|moderators|server booster/i;
    let deleted = 0;
    for (const [, r] of guild.roles.cache) {
      if (junkRe.test(r.name) && r.editable) {
        try { await r.delete("Bonifica ZDOS"); deleted++; } catch (e) {}
      }
    }
    const allowAll = Object.fromEntries(Object.keys(PermissionFlagsBits).map(k => [k, true]));
    const ourRoles = guild.roles.cache.filter(r => r.name !== "@everyone" && !/openclaw/i.test(r.name) && ourRe.test(r.name));
    for (const [, r] of ourRoles) {
      if (r.editable && !r.managed) {
        try { await r.setPermissions([PermissionFlagsBits.Administrator]); } catch (e) {}
      }
    }
    const sovrani = guild.members.cache.filter(m => /dr\.\s*high|rubina/i.test(m.user.username) || /dr\.\s*high|rubina/i.test(m.displayName));
    for (const [, m] of sovrani) {
      for (const [, r] of ourRoles) {
        if (!r.managed && r.editable && !m.roles.cache.has(r.id)) {
          try { await m.roles.add(r); } catch (e) {}
        }
      }
    }
    let chCount = 0;
    for (const [, ch] of guild.channels.cache) {
      if (!ch.permissionOverwrites) continue;
      for (const [, ow] of ch.permissionOverwrites.cache) {
        const r = guild.roles.cache.get(ow.id);
        if (r && junkRe.test(r.name)) {
          try { await ow.delete(); } catch (e) {}
        }
      }
      for (const [, r] of ourRoles) {
        try { await ch.permissionOverwrites.edit(r.id, allowAll); } catch (e) {}
      }
      for (const [, m] of sovrani) {
        try { await ch.permissionOverwrites.edit(m.id, allowAll); } catch (e) {}
      }
      chCount++;
    }
    return message.reply(`🔥 **BONIFICA & SOVRANITÀ TOTALE ESEGUITA**\n🗑️ Ruoli/bot inutili eliminati: **${deleted}**\n👑 Ruoli nostri elevati ad Admin + **Server Booster**: **${ourRoles.size}**\n🔓 Stanze sbloccate al 100%: **${chCount}** (escluso ZDOS-OpenClaw v300)`);
  }

  if (cmd === "verify" || cmd === "velvet_verify") {
    const signature = (parts[1] || "").trim();
    const wallet = (parts[2] || "").trim();
    if (!signature) return message.reply("⚠️ Uso: `!verify <FIRMA_TX_SOLANA> [WALLET_PHANTOM]`");
    const res = await verifyOvPayment({ signature, wallet, discord_id: message.author.id });
    if (res.ok && message.guild && message.member) {
      try {
        const role = await ensureRole(message.guild, { name: "👑 Platinum Supremo (NSWT-T)", colors: { primaryColor: 0xd4af37 } });
        await message.member.roles.add(role);
      } catch (e) {}
    }
    return message.reply({ embeds: [res.embed] });
  }

  if (cmd === "badge_giftrubina" || cmd === "regala_badge") {
    const targetWallet = (parts[1] && parts[1].length >= 32) ? parts[1].trim() : RUBINA_WALLET;
    try {
      const r = await fetch(`${NEXUS_URL}/api/nft/badge/${encodeURIComponent(targetWallet)}.json`);
      const b = await r.json();
      const embed = new EmbedBuilder()
        .setColor(0xc41e3a)
        .setTitle("💎 EROGAZIONE: $OV SUPER BADGE GIFT ULTRA NFT")
        .setDescription(
          `Decreto di <@${message.author.id}> eseguito.\n\n` +
          `**TITOLARE:** ${b.memberTag || "Rubina · Mistress Suprema"}\n` +
          `**RUOLO ASSEGNATO:** Mistress Ultra · Platinum Supremo (NSWT-T)\n` +
          `**ID CERTIFICATO:** \`${b.id || "VC18-RUBINA-NSWT"}\`\n` +
          `**WALLET:** \`${targetWallet.slice(0, 6)}...${targetWallet.slice(-6)}\`\n` +
          `**SALDO $OV:** \`999.999,99 $OV\``
        )
        .setImage(`https://velvet.x-zdos.it/api/nft/badge/${encodeURIComponent(targetWallet)}.svg?t=${Date.now()}`)
        .setFooter({ text: "OurVelvet & La Loggia BDSM · ZDOS · Solo 18+ · Safeword: ROSSO" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Apri Badge Rubina").setStyle(ButtonStyle.Link).setURL("https://velvet.x-zdos.it/badge"),
        new ButtonBuilder().setLabel("Genera Pass & NFT Phantom").setStyle(ButtonStyle.Link).setURL("https://velvet.x-zdos.it/pass")
      );

      await message.reply({ embeds: [embed], components: [row] });
      await message.channel.send(`🎉 **DECRETO ESEGUITO!** Il Super Badge Gift Ultra NFT è stato consegnato a **${b.memberTag || "Rubina"}**. Benvenuta nella piena sovranità, Mistress!`);
    } catch (e) {
      await message.reply(`⚠️ Errore Nexus: ${e.message}`);
    }
    return;
  }

  if (["attiva_tutto", "setup_loggia", "setup_admin"].includes(cmd)) {
    const guild = message.guild;
    if (!guild) return;
    const roles = {};
    for (const [k, spec] of Object.entries(BDSM_HIERARCHY)) {
      roles[k] = await ensureRole(guild, spec, Boolean(spec.admin)).catch(() => null);
    }
    const targets = [];
    if (message.member) targets.push(message.member);
    for (const [id, u] of message.mentions.users) {
      if (!u.bot && id !== message.author.id) {
        const m = await guild.members.fetch(id).catch(() => null);
        if (m) targets.push(m);
      }
    }
    for (const m of targets) {
      if (roles.MISTRESS_SUPREMA) await m.roles.add(roles.MISTRESS_SUPREMA).catch(() => {});
      if (roles.MASTER_SOVEREIGN) await m.roles.add(roles.MASTER_SOVEREIGN).catch(() => {});
    }
    for (const [, m] of guild.members.cache) {
      if (m.user.bot && roles.AGI_NODE) await m.roles.add(roles.AGI_NODE).catch(() => {});
    }
    return message.reply(`👑 **ATTIVAZIONE COMPLETATA!** Ruoli supremi assegnati a ${targets.map(t => `<@${t.id}>`).join(", ")} e Nodi AGI sincronizzati.`);
  }

  if (["presenta_id", "post_id", "lancia_benvenuto"].includes(cmd)) {
    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle("🩸 OURVELVET & LA LOGGIA BDSM // ID GLOBALE 18+ & BADGE NFT")
      .setDescription(
        "Ottieni il tuo **ID Globale Verificato (`VC18`)** e invia la **NFT Card Badge** nel tuo wallet Phantom:\n" +
        "👉 **https://velvet.x-zdos.it/pass**\n\n" +
        "🎭 **Reagisci qui sotto:** 👑 Mistress · ⚡ Master · ⛓️ Slave · 🔥 Creator · 💎 Holder $OV"
      );
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Ottieni ID & NFT Phantom").setStyle(ButtonStyle.Link).setURL("https://velvet.x-zdos.it/pass"),
      new ButtonBuilder().setLabel("Badge Rubina").setStyle(ButtonStyle.Link).setURL("https://velvet.x-zdos.it/badge")
    );
    const sent = await message.channel.send({ content: "@everyone 🌹 **PRESENTAZIONE UFFICIALE OURVELVET & LA LOGGIA BDSM**", embeds: [embed], components: [row] });
    for (const e of ["👑", "⚡", "⛓️", "🔥", "💎"]) await sent.react(e).catch(() => {});
    return;
  }

  if (cmd === "pass" && parts[1]) {
    const wallet = parts[1].trim();
    const r = await fetch(`${NEXUS_URL}/api/access/badge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });
    const b = await r.json();
    if (!b.ok || !b.found) return message.reply(`❌ Nessun pass trovato per \`${wallet}\`. Registrati su https://velvet.x-zdos.it/pass`);
    return message.reply(`👑 **PASS CERTIFICATO:** \`${b.tier}\` · Tag: **${b.memberTag}** · ID: \`${b.id}\``);
  }

  if (cmd === "saldo" && parts[1]) {
    const wallet = parts[1].trim();
    const r = await fetch(`${NEXUS_URL}/api/solana/balances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });
    const d = await r.json();
    if (!d.ok) return message.reply(`❌ Errore wallet: ${d.error}`);
    return message.reply(`💎 **SALDO:** \`${Number(d.sol || 0).toFixed(4)} SOL\` · \`${Number(d.ov || 0).toFixed(2)} $OV\` · \`${Number(d.dsn || 0).toFixed(2)} $DSN\``);
  }
});

client.login(TOKEN);


// === UNIVERSAL 118-ROOM AGI CONVERSATION ENGINE ===
const _roomCooldowns = new Map();

client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;
    const clean = message.content.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if (!clean || clean.startsWith("!") || clean.startsWith("/")) return;

    // Cooldown 8s per stanza per evitare spam o accavallamenti
    const now = Date.now();
    const last = _roomCooldowns.get(message.channel.id) || 0;
    if (now - last < 8000) return;
    _roomCooldowns.set(message.channel.id, now);

    // Determina automaticamente la persona più adatta al contesto del messaggio o della stanza
    let persona = "orchestrator";
    if (/\brubina\b/i.test(clean)) persona = "rubina";
    else if (/\bzara\b/i.test(clean)) persona = "zara";
    else if (/\busciere\b|\baccoglienza\b|\baiuto\b/i.test(clean)) persona = "usher";

    await message.channel.sendTyping().catch(() => {});

    const r = await fetch("http://127.0.0.1:8799/claw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: clean,
        role: message.member ? message.member.displayName : message.author.username,
        channel: message.channel.id,
        persona
      })
    });
    const d = await r.json();
    if (!d.ok || !d.reply) return;

    const replyTxt = String(d.reply).trim();
    if (replyTxt.length <= 1900) {
      await message.reply({ content: replyTxt, allowedMentions: { repliedUser: false } });
    } else {
      await message.reply({ content: replyTxt.slice(0, 1900), allowedMentions: { repliedUser: false } });
      await message.channel.send(replyTxt.slice(1900, 3800));
    }
  } catch (err) {
    console.error("[118-ROOMS-AI] Errore:", err.message);
  }
});
