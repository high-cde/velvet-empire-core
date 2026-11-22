const crypto = require("crypto");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { Client, GatewayIntentBits } = require("/root/velvet-daemon/node_modules/discord.js");

for (const envPath of ["/root/velvet-claw/.env", "/root/velvet-daemon/.env", "/root/.env"]) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const X_API_KEY = process.env.X_API_KEY;
const X_API_SECRET = process.env.X_API_SECRET;
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const X_ACCESS_SECRET = process.env.X_ACCESS_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.ZXSOLANA_TOKEN;

function pctEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildOAuthHeader(method, url) {
  const oauthParams = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: "1.0"
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map(k => `${pctEncode(k)}=${pctEncode(oauthParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${pctEncode(url)}&${pctEncode(paramString)}`;
  const signingKey = `${pctEncode(X_API_SECRET)}&${pctEncode(X_ACCESS_SECRET)}`;
  oauthParams.oauth_signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  return "OAuth " + Object.keys(oauthParams)
    .sort()
    .map(k => `${pctEncode(k)}="${pctEncode(oauthParams[k])}"`)
    .join(", ");
}

async function postTweet(payload) {
  const url = "https://api.twitter.com/2/tweets";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: buildOAuthHeader("POST", url),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function askZara(prompt) {
  const r = await fetch("http://127.0.0.1:8799/claw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      role: "Zara X Growth Director (ZDOS_Core)",
      channel: "x-growth-engine",
      persona: "zara"
    })
  });
  const d = await r.json();
  return d.ok ? String(d.reply).trim() : null;
}

function logAction(actionType, tweetId, content) {
  const py = `
import sqlite3, sys
conn = sqlite3.connect("/root/velvet-claw/x_growth.db")
conn.execute("CREATE TABLE IF NOT EXISTS x_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, action_type TEXT, tweet_id TEXT, content TEXT, ts DATETIME DEFAULT CURRENT_TIMESTAMP)")
conn.execute("INSERT INTO x_actions (action_type, tweet_id, content) VALUES (?, ?, ?)", (sys.argv[1], sys.argv[2], sys.argv[3]))
conn.commit()
`;
  execFileSync("python3", ["-c", py, actionType, String(tweetId || ""), String(content || "").slice(0, 500)]);
}

async function runXGrowthCycle(discordClient) {
  const report = [];
  const mainDraft = await askZara(
    "Scrivi un singolo post magnetico per X (MASSIMO 210 caratteri, zero virgolette esterne, zero asterischi) per attirare utenti Solana e AI verso Our Velvet (https://velvet.x-zdos.it) e il nostro Discord (https://discord.gg/BcMh6vcpQX). Usa massimo 2 hashtag (#Solana #AI)."
  );

  if (mainDraft) {
    const cleanMain = mainDraft.replace(/^["']|["']$/g, "").replace(/\*\*/g, "").slice(0, 275);
    const posted = await postTweet({ text: cleanMain });
    if (posted.status === 201 && posted.data?.data?.id) {
      const tid = posted.data.data.id;
      logAction("POST", tid, cleanMain);
      report.push(`✅ **Post X pubblicato (ZDOS_Core):** https://x.com/i/web/status/${tid}`);

      const replyDraft = await askZara(
        "Scrivi un breve commento di follow-up (MAX 180 caratteri, zero virgolette, zero asterischi) con link diretto al portale ZDOS https://x-zdos.it e al canale Telegram https://t.me/OurVelvetHub per chi vuole entrare subito."
      );
      if (replyDraft) {
        const cleanReply = replyDraft.replace(/^["']|["']$/g, "").replace(/\*\*/g, "").slice(0, 275);
        const rep = await postTweet({ text: cleanReply, reply: { in_reply_to_tweet_id: tid } });
        if (rep.status === 201 && rep.data?.data?.id) {
          logAction("THREAD_REPLY", rep.data.data.id, cleanReply);
          report.push(`🧵 **Thread CTA collegato:** https://x.com/i/web/status/${rep.data.data.id}`);
        }
      }
    } else {
      report.push(`⚠️ **Errore X API:** HTTP ${posted.status} — ${JSON.stringify(posted.data).slice(0, 180)}`);
    }
  }

  console.log("[X-GROWTH] Esito ciclo:", report.join(" | "));
  if (discordClient && report.length > 0) {
    const guild = discordClient.guilds.cache.first();
    const lab = guild?.channels.cache.find(c => c.name === "claw-test-lab");
    if (lab) {
      await lab.send(`🐦 **[ZARA // ZDOS_Core X GROWTH (4x/Giorno)]**\n${report.join("\n")}`).catch(() => {});
    }
  }
}

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
discordClient.once("clientReady", async () => {
  console.log(`[X-GROWTH] ZDOS_Core attivo su ${discordClient.user.tag}. Avvio primo ciclo X...`);
  await runXGrowthCycle(discordClient);
  setInterval(() => runXGrowthCycle(discordClient).catch(console.error), 6 * 60 * 60 * 1000);
});

discordClient.login(DISCORD_TOKEN);
