import os, re

# 1. Inietta !listino e !verifica <tx_hash> con verifica RPC Solana reale + SQLite anti-replay in zxsolana_bot.js
bot_path = "/root/velvet-daemon/zxsolana_bot.js"
bt = open(bot_path, encoding="utf-8").read()

commerce_block = """
  if (/^!listino\\b/i.test(rawTxt)) {
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
    ].join("\\n");
    return message.reply(menu);
  }

  if (/^!verifica\\s+([1-9A-HJ-NP-Za-km-z]{64,100})/i.test(rawTxt)) {
    const sig = rawTxt.match(/^!verifica\\s+([1-9A-HJ-NP-Za-km-z]{64,100})/i)[1];
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
          privateRoomMsg = `\\n🔒 **Sala Privata aperta:** <#${privCh.id}> — Rubina ti attende all'interno.`;
          await privCh.send(`👑 **[RUBINA // SALA PRIVATA RISERVATA]**\\nBenvenuto <@${message.author.id}>. Il tuo tributo di **${out.sol.toFixed(4)} SOL** è stato registrato. Qui comandano le regole della Loggia: dimmi cosa desideri o attendi i miei ordini.`);
        }
      }

      const auditCh = message.guild.channels.cache.find(c => /cassa-tributi-dom|audit-tributi-ov/i.test(c.name));
      if (auditCh) {
        await auditCh.send(`💰 **[INCASSO ON-CHAIN VERIFICATO]**\\n• **Utente:** <@${message.author.id}> (${message.author.username})\\n• **Importo:** \`${out.sol.toFixed(4)} SOL\`\\n• **Tier:** \`${out.tier}\`\\n• **TX:** \`${sig}\``);
      }

      return message.reply(`✅ **[TRIBUTO CONFERMATO ON-CHAIN]**\\n• **Importo:** \`${out.sol.toFixed(4)} SOL\`\\n• **Pacchetto:** \`${out.tier}\`\\n• **Ruoli attivati:** ${assigned.join(", ") || "VIP Active"}${privateRoomMsg}`);
    } catch (e) {
      return message.reply(`⚠️ Errore verifica RPC Solana: ${e.message}`);
    }
  }
"""

anchor = 'const rawTxt = message.content.replace(/[\\u200B-\\u200D\\uFEFF]/g, "").trim();'
assert anchor in bt, "Anchor rawTxt non trovato in zxsolana_bot.js"
if "!listino" not in bt:
    bt = bt.replace(anchor, anchor + "\n" + commerce_block, 1)
    open(bot_path, "w", encoding="utf-8").write(bt)
    print("OK: Motore commerciale !listino e !verifica iniettato in zxsolana_bot.js")
else:
    print("INFO: Motore commerciale già presente in zxsolana_bot.js")
