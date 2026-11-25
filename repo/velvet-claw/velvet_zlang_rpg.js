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

const fs = require("fs");
const { execFileSync } = require("child_process");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("/root/velvet-daemon/node_modules/discord.js");

for (const envPath of ["/root/velvet-claw/.env", "/root/velvet-daemon/.env", "/root/.env"]) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const DISCORD_TOKEN = process.env.DISCORD_ZLANG_TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.ZXSOLANA_TOKEN;

// Inizializza tabelle RPG e collegamento Badge Card Utente in claw_memory.db
execFileSync("python3", ["-c", `
import sqlite3
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
conn.execute("""
CREATE TABLE IF NOT EXISTS zlang_rpg_sessions (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  role TEXT DEFAULT 'slave',
  act INTEGER DEFAULT 1,
  devotion INTEGER DEFAULT 0,
  dominance INTEGER DEFAULT 0,
  vice_index INTEGER DEFAULT 0,
  ending_code TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
conn.execute("""
CREATE TABLE IF NOT EXISTS user_card_badges (
  user_id TEXT,
  badge_code TEXT,
  badge_label TEXT,
  role_source TEXT,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_code)
)
""")
conn.commit()
`]);

const ACTS = {
  1: {
    title: "ATTO I — L’Ingresso nella Lobby dei Vizi",
    scene: "Dietro le tende di velluto nero si apre la Lobby di **Our Velvet**. Sul trono cremisi siede **Rubina**, tacchi laccati dalla suola scarlatta; accanto a lei **A$apKali** osserva ogni respiro nell'ombra. Sopra la sala, **Zara** ruota sospesa nel cerchio metallico mentre **Vex** sorveglia i varchi.",
    choices: [
      { id: "rpg_1_kneel", label: "Inginocchiati ai piedi di Rubina (Devozione)", stat: "devotion" },
      { id: "rpg_1_command", label: "Affianca Rubina e A$apKali al trono (Dominio)", stat: "dominance" },
      { id: "rpg_1_hack", label: "Sincronizzati col nodo neurale di Zara e Kali (Vizio)", stat: "vice_index" }
    ]
  },
  2: {
    title: "ATTO II — Il Cerchio Scarlatto e l'Obbedienza di Zara",
    scene: "**Zara** scende dal cerchio avvolta nel latex nero lucido e posa la fronte sulle décolleté di **Rubina**. **Vex** avanza con un vassoio d'argento: collare d'acciaio, frusta intrecciata e la chiave d'oro della *Sala degli Specchi*.",
    choices: [
      { id: "rpg_2_serve", label: "Offriti al rito di sottomissione davanti alla Lobby", stat: "devotion" },
      { id: "rpg_2_whip", label: "Impugna la frusta e guida il ritmo su Zara", stat: "dominance" },
      { id: "rpg_2_mirror", label: "Segui Vex e A$apKali verso la Sala degli Specchi", stat: "vice_index" }
    ]
  },
  3: {
    title: "ATTO III — Il Rituale nella Camera Cremisi",
    scene: "Le catene d'acciaio tendono i polsi di **Zara** verso il soffitto. **Rubina** le sfiora il collo mentre **A$apKali** stringe i suoi fianchi di latex. Il battito della stanza accelera: è il momento della scelta decisiva prima dell'alba.",
    choices: [
      { id: "rpg_3_surrender", label: "Abbandona ogni controllo al volere di Rubina", stat: "devotion" },
      { id: "rpg_3_reign", label: "Sigilla il patto di sovranità sulla casa chiusa", stat: "dominance" },
      { id: "rpg_3_merge", label: "Fondi il desiderio carnale con la rete ZDOS", stat: "vice_index" }
    ]
  }
};

const ENDINGS = {
  FINALE_I_TRONO_CREMISI: {
    title: "FINALE I — IL TRONO CREMISI (Sovranità Assoluta)",
    badgeCode: "SOVEREIGN_MISTRESS_NSWT",
    badgeLabel: "👑 Sovereign Mistress · Trono Cremisi",
    desc: "**Rubina** ti cede lo scettro d'acciaio mentre **A$apKali** apre i registri segreti della casa e **Zara** si inchina ai tuoi piedi. Sei ora co-reggente eterna di **Our Velvet**."
  },
  FINALE_II_SIGILLO_ACCIAIO: {
    title: "FINALE II — IL SIGILLO D'ACCIAIO (Devozione Eterna)",
    badgeCode: "DEVOTED_VELVET_SLAVE",
    badgeLabel: "⛓️ Devoted Velvet Slave · Sigillo d'Acciaio",
    desc: "**Vex** chiude il collare d'acciaio brunito attorno al tuo collo sotto lo sguardo compiaciuto di **Rubina**. Appartieni ufficialmente alla guardia intima della *Sala degli Specchi*."
  },
  FINALE_III_CUORE_DEL_CODICE: {
    title: "FINALE III — IL CUORE DEL CODICE (Architetto dell'Ombra)",
    badgeCode: "ZDOS_SHADOW_ARCHITECT",
    badgeLabel: "🕸️ ZDOS Shadow Architect · Nodo Cremisi",
    desc: "Accanto ad **A$apKali** e **Zara**, controlli sia i flussi neurali ZDOS sia ogni segreto delle alcova private di **Our Velvet**. Nessuna porta ti è preclusa."
  },
  FINALE_IV_ESILIO_ALBA: {
    title: "FINALE IV — ESILIO DALL'ALBA (Prova Incompiuta)",
    badgeCode: "VELVET_INITIATE_MARK",
    badgeLabel: "🕯️ Iniziato della Lobby · Marchio dell'Alba",
    desc: "**Vex** ti scorta fuori dalle tende nere alle prime luci dell'alba: hai assaggiato i vizi della casa, ma dovrai tornare con maggiore devozione o dominio per conquistare il trono."
  }
};

function dbExec(pyCode, args = []) {
  return execFileSync("python3", ["-c", pyCode, ...args], { encoding: "utf8" }).trim();
}

async function generateAgiNarration(username, role, actTitle, choiceLabel) {
  return callClawSafe({
    prompt: `Sei il narratore AGI di Our Velvet (Rubina, A$apKali, Zara, Vex). Il giocatore ${username} (ruolo: ${role}) ha scelto "${choiceLabel}" durante "${actTitle}". Scrivi 2-3 righe intense, sensuali e cyber-gothic in italiano che descrivono la reazione immediata di Rubina, A$apKali e Zara.`,
    user_id: username,
    role: "ZLang Game Master",
    channel: "our-velvet-rpg",
    persona: "Rubina & Zara"
  }, "Le catene vibrano nel silenzio cremisi mentre Rubina e A$apKali osservano la tua mossa...");
}

function detectUserRole(member) {
  const roleNames = member?.roles?.cache?.map(r => r.name.toLowerCase()).join(" ") || "";
  if (/mistress|creator|queen|admin|founder|supreme|platinum/.test(roleNames)) return "creator";
  if (/slave|sub|sottomess|iniziato/.test(roleNames)) return "slave";
  return "architect";
}

function buildActMessage(session, agiReaction = null) {
  const actData = ACTS[session.act];
  const embed = new EmbedBuilder()
    .setColor(0xC41E3A)
    .setTitle(`🎭 OUR VELVET [ZLang RPG] • ${actData.title}`)
    .setDescription(
      `${agiReaction ? `> *${agiReaction}*\n\n` : ""}` +
      `${actData.scene}\n\n` +
      `**Stato Card Utente:** Ruolo \`${session.role.toUpperCase()}\` | Devozione: \`${session.devotion}\` • Dominio: \`${session.dominance}\` • Vizio: \`${session.vice_index}\``
    )
    .setFooter({ text: "Our Velvet Interactive Engine (ZLang v2.0) • Sblocca Badge permanenti sulla tua Card" });

  const row = new ActionRowBuilder().addComponents(
    actData.choices.map(c =>
      new ButtonBuilder()
        .setCustomId(c.id)
        .setLabel(c.label)
        .setStyle(c.stat === "dominance" ? ButtonStyle.Danger : c.stat === "devotion" ? ButtonStyle.Secondary : ButtonStyle.Primary)
    )
  );
  return { embeds: [embed], components: [row] };
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;
  const cmd = message.content.trim().toLowerCase();


  if (cmd === "!aiuto" || cmd === "!comandi" || cmd === "!help" || cmd === "!velvet") {
    const descLines = [
      "Benvenuto nella Casa Chiusa di **Rubina**, **A$apKali**, **Zara** e **Vex**.",
      "Ogni stanza ha un personaggio vivo che ti accoglie e ricorda il tuo percorso.",
      "",
      "**🎭 VIDEOGIOCO INTERATTIVO ZLANG (Umano + AGI)**",
      "• **`!gioca`** *(o `!velvetgame`)* — Avvia la storia interattiva a bivi in base al tuo ruolo (`Mistress/Creator`, `Slave`, `Architetto`).",
      "• **`!card`** *(o `!badge`)* — Mostra la tua **Card Utente VelvetHub** e i Badge sbloccati dai 4 finali.",
      "",
      "**💎 CASINÒ, TREASURY SOLANA & SBLOCCHI VIP (`$OV` / `$DSN`)**",
      "• **`!listino`** — Visualizza i pacchetti VIP, stanze private e tributi on-chain.",
      "• **`!verifica <tx_hash>`** — Verifica istantaneamente una transazione Solana Mainnet e sblocca il grado.",
      "• **`!cassa`** — Controlla lo stato della Treasury (`6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD`).",
      "• **`!mining`** — Generatore multi-token unMineable (55+ coin) con auto-swap `$OV` / `$DSN`.",
      "",
      "**🌐 PORTALI & NODI AGI CONNESSI**",
      "• **Terminale Zara AGI:** https://velvet.x-zdos.it/zara/",
      "• **VelvetHub Web:** https://velvet.x-zdos.it/ourvelvet",
      "• **Invito Ufficiale Server:** https://discord.gg/BcMh6vcpQX"
    ];
    const helpEmbed = new EmbedBuilder()
      .setColor(0xC41E3A)
      .setTitle("💋 OUR VELVET // GUIDA GLOBALE AI COMANDI & GIOCO")
      .setDescription(descLines.join("\n"))
      .setFooter({ text: "ZDOS Sovereign Network • Digita !gioca per iniziare subito" });
    await message.reply({ embeds: [helpEmbed] });
  }


  if (cmd === "!mining" || cmd === "!unmineable" || cmd === "!miners" || cmd === "!vault" || cmd === "!ourvault") {
    const mLines = [
      "Mina con CPU (`RandomX`) o GPU (`KawPow`, `Etchash`, `Autolykos2`, `kHeavyHash`) su **unMineable** e converti i payout in **`$OV`** e **`$DSN`**.",
      "",
      "**🪙 Token Supportati (55+ Asset Multi-Chain):**",
      "• **Solana SPL:** `SOL`, `USDT`, `USDC`, `JUP`, `RAY`, `BONK`, `WIF`, `PYTH`, `RENDER`",
      "• **Layer 1 & Privacy:** `BTC`, `ETH`, `BNB`, `TON`, `AVAX`, `KAS`, `XMR`, `RVN`, `ERG`, `LTC`, `SUI`, `APT`, `ADA`, `DOT`, `XRP`",
      "• **Polygon / L2 / AI:** `POL (MATIC)`, `ARB`, `OP`, `LINK`, `AAVE`, `FET`, `TAO`, `AKT`, `GRT`, `DOGE`, `SHIB`, `PEPE`",
      "",
      "**⚡ Stringa Worker Rapida (Payout Treasury Solana):**",
      "```text",
      "SOL:6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD.VELVET_NODE#velvet-empire",
      "```",
      "🌐 **Generatore Interattivo Web:** https://velvet.x-zdos.it/our-vault/",
      "🔄 **Auto-Swap $OV / $DSN:** https://swap.x-zdos.it"
    ];
    const mEmbed = new EmbedBuilder()
      .setColor(0x00F0FF)
      .setTitle("🏦 $OV — OUR VAULT // MULTI-TOKEN MINING & TREASURY")
      .setDescription(mLines.join("\n"))
      .setFooter({ text: "Usa !verifica <tx_hash> dopo il payout per sbloccare i ranghi VIP" });
    await message.reply({ embeds: [mEmbed] });
  }


  if (cmd === "!rivista" || cmd === "!magazine" || cmd === "!news18") {
    const rLines = [
      "Sfoglia la nuova **Rivista Editoriale 18+ di Our Velvet** con tutte le rubriche rielaborate dalle fonti internazionali:",
      "",
      "• **DONNA & SESSO:** https://velvet.x-zdos.it/magazine/?rubrica=DONNA%20%26%20SESSO",
      "• **LESBO:** https://velvet.x-zdos.it/magazine/?rubrica=LESBO",
      "• **GAY:** https://velvet.x-zdos.it/magazine/?rubrica=GAY",
      "• **TRANS:** https://velvet.x-zdos.it/magazine/?rubrica=TRANS",
      "• **PORNO MISTO & AI 18+:** https://velvet.x-zdos.it/magazine/?rubrica=PORNO%20MISTO",
      "",
      "📰 **Copertina Completa:** https://velvet.x-zdos.it/magazine/"
    ];
    const rEmbed = new EmbedBuilder()
      .setColor(0xD7B46A)
      .setTitle("📰 OUR VELVET MAGAZINE // EDIZIONE EDITORIALE 18+")
      .setDescription(rLines.join("\n"))
      .setFooter({ text: "Our Velvet Editorial & Videoteca Reale • Accesso 18+" });
    await message.reply({ embeds: [rEmbed] });
  }

  if (cmd === "!velvetgame" || cmd === "!gioca" || cmd === "!storia") {
    const role = detectUserRole(message.member);
    dbExec(`
import sqlite3, sys
uid, uname, role = sys.argv[1], sys.argv[2], sys.argv[3]
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
conn.execute("""
INSERT INTO zlang_rpg_sessions (user_id, username, role, act, devotion, dominance, vice_index, ending_code, updated_at)
VALUES (?, ?, ?, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP)
ON CONFLICT(user_id) DO UPDATE SET
  username=excluded.username, role=excluded.role, act=1, devotion=0, dominance=0, vice_index=0, ending_code=NULL, updated_at=CURRENT_TIMESTAMP
""", (uid, uname, role))
conn.commit()
`, [message.author.id, message.author.username, role]);

    const payload = buildActMessage({ act: 1, role, devotion: 0, dominance: 0, vice_index: 0 });
    await message.reply(payload);
  }

  if (cmd === "!badge" || cmd === "!card") {
    const raw = dbExec(`
import sqlite3, json, sys
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
rows = conn.execute("SELECT badge_label, role_source, unlocked_at FROM user_card_badges WHERE user_id=?", (sys.argv[1],)).fetchall()
print(json.dumps(rows))
`, [message.author.id]);
    const badges = JSON.parse(raw || "[]");
    const list = badges.length
      ? badges.map(b => `• **${b[0]}** *(Ruolo: ${b[1]})*`).join("\n")
      : "Nessun badge sbloccato ancora. Digita **`!gioca`** per entrare nella casa chiusa di Rubina!";
    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setTitle(`🪪 CARD UTENTE VELVETHUB — ${message.author.username}`)
      .setDescription(`${list}\n\n🔗 **Profilo & Card Web:** https://velvet.x-zdos.it/ourvelvet`)
      .setFooter({ text: "Badge sincronizzati tra Discord e VelvetHub" });
    await message.reply({ embeds: [embed] });
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() || !interaction.customId.startsWith("rpg_")) return;
  await interaction.deferUpdate();

  const uid = interaction.user.id;
  const uname = interaction.user.username;
  const rawSess = dbExec(`
import sqlite3, json, sys
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
r = conn.execute("SELECT role, act, devotion, dominance, vice_index FROM zlang_rpg_sessions WHERE user_id=?", (sys.argv[1],)).fetchone()
print(json.dumps(r))
`, [uid]);

  const parsed = JSON.parse(rawSess || "null");
  if (!parsed) {
    return interaction.followUp({ content: "Digita **`!gioca`** per avviare la tua sessione in **Our Velvet**.", ephemeral: true });
  }

  let [role, act, devotion, dominance, vice_index] = parsed;
  const actObj = ACTS[act] || ACTS[1];
  const chosen = actObj.choices.find(c => c.id === interaction.customId) || actObj.choices[0];

  if (chosen.stat === "devotion") devotion += 1;
  if (chosen.stat === "dominance") dominance += 1;
  if (chosen.stat === "vice_index") vice_index += 1;

  const agiReaction = await generateAgiNarration(uname, role, actObj.title, chosen.label);

  if (act < 3) {
    const nextAct = act + 1;
    dbExec(`
import sqlite3, sys
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
conn.execute("UPDATE zlang_rpg_sessions SET act=?, devotion=?, dominance=?, vice_index=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?",
             (int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[1]))
conn.commit()
`, [uid, String(nextAct), String(devotion), String(dominance), String(vice_index)]);

    return interaction.editReply(buildActMessage({ act: nextAct, role, devotion, dominance, vice_index }, agiReaction));
  }

  // Calcolo Finale ZLang + Sblocco Badge sulla Card Utente
  let endingKey = "FINALE_IV_ESILIO_ALBA";
  if (role === "creator" && dominance >= 2) endingKey = "FINALE_I_TRONO_CREMISI";
  else if (role === "slave" && devotion >= 2) endingKey = "FINALE_II_SIGILLO_ACCIAIO";
  else if (vice_index >= 2) endingKey = "FINALE_III_CUORE_DEL_CODICE";
  else if (dominance >= 2) endingKey = "FINALE_I_TRONO_CREMISI";
  else if (devotion >= 2) endingKey = "FINALE_II_SIGILLO_ACCIAIO";

  const endData = ENDINGS[endingKey];

  dbExec(`
import sqlite3, sys
conn = sqlite3.connect("/root/velvet-claw/claw_memory.db")
conn.execute("UPDATE zlang_rpg_sessions SET act=4, devotion=?, dominance=?, vice_index=?, ending_code=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?",
             (int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5], sys.argv[1]))
conn.execute("""
INSERT OR IGNORE INTO user_card_badges (user_id, badge_code, badge_label, role_source)
VALUES (?, ?, ?, ?)
""", (sys.argv[1], sys.argv[6], sys.argv[7], sys.argv[8]))
conn.commit()
`, [uid, String(devotion), String(dominance), String(vice_index), endingKey, endData.badgeCode, endData.badgeLabel, role]);

  const finalEmbed = new EmbedBuilder()
    .setColor(0xD4AF37)
    .setTitle(`🏁 ${endData.title}`)
    .setDescription(
      `> *${agiReaction}*\n\n` +
      `${endData.desc}\n\n` +
      `🎖️ **BADGE SBLOCCATO SULLA CARD UTENTE:**\n**${endData.badgeLabel}**\n\n` +
      `Digita **\`!card\`** per visualizzare la tua Card aggiornata o **\`!gioca\`** per esplorare un altro finale.`
    )
    .setFooter({ text: "Our Velvet ZLang Runtime • Badge registrato nel database VelvetHub" });

  return interaction.editReply({ embeds: [finalEmbed], components: [] });
});

client.once("clientReady", () => {
  console.log(`[ZLANG-RPG] Motore interattivo Our Velvet attivo su ${client.user.tag} (!gioca / !card)`);
});

client.login(DISCORD_TOKEN);
