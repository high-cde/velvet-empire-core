p = "/root/velvet-daemon/zxsolana_bot.js"
t = open(p, encoding="utf-8").read()

# Rimuove eventuale vecchio listener conversazionale per evitare duplicati
if "// === UNIVERSAL 118-ROOM AGI CONVERSATION ENGINE ===" in t:
    t = t.split("// === UNIVERSAL 118-ROOM AGI CONVERSATION ENGINE ===")[0].rstrip() + "\n"

universal_block = """
// === UNIVERSAL 118-ROOM AGI CONVERSATION ENGINE ===
const _roomCooldowns = new Map();

client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;
    const clean = message.content.replace(/[\\u200B-\\u200D\\uFEFF]/g, "").trim();
    if (!clean || clean.startsWith("!") || clean.startsWith("/")) return;

    // Cooldown 8s per stanza per evitare spam o accavallamenti
    const now = Date.now();
    const last = _roomCooldowns.get(message.channel.id) || 0;
    if (now - last < 8000) return;
    _roomCooldowns.set(message.channel.id, now);

    // Determina automaticamente la persona più adatta al contesto del messaggio o della stanza
    let persona = "orchestrator";
    if (/\\brubina\\b/i.test(clean)) persona = "rubina";
    else if (/\\bzara\\b/i.test(clean)) persona = "zara";
    else if (/\\busciere\\b|\\baccoglienza\\b|\\baiuto\\b/i.test(clean)) persona = "usher";

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
"""

open(p, "w", encoding="utf-8").write(t + "\n" + universal_block)
print("OK: Motore conversazionale universale su 118 stanze installato in zxsolana_bot.js")
