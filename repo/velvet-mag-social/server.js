const http = require("http");
const fs = require("fs");

const PORT = 8822;
const ZARA_HOST = "127.0.0.1";
const ZARA_PORT = 8811;
const DB_PATH = "/root/velvet-mag-social/social_mining_db.json";

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return {
      posts: [
        {
          id: "init-1",
          author: "Rubina · @ZDOS_Core",
          role: "MISTRESS / FOUNDER",
          text: "Connessione neurale diretta tra OurVelvet Magazine 18+ e Zara AGI attiva. Ogni articolo commentato con Zara o condiviso accredita Human Mining Shares ($OV / $DSN).",
          articleRef: "Edizione Neurale Live",
          ts: new Date().toISOString(),
          shares: 14
        }
      ],
      miners: {}
    };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function creditMiner(db, handle, wallet, action, refId) {
  const key = (wallet || handle || "ANON_MINER").trim().slice(0, 64);
  if (!db.miners[key]) {
    db.miners[key] = { handle: handle || key, wallet: wallet || "", shares: 0, comments: 0, articleShares: 0, lastActive: "" };
  }
  const reward = action === "comment_zara" ? 25 : 15;
  db.miners[key].shares += reward;
  if (action === "comment_zara") db.miners[key].comments += 1;
  else db.miners[key].articleShares += 1;
  db.miners[key].lastActive = new Date().toISOString();
  return { miner: db.miners[key], reward, refId };
}

function callZaraEndpoint(routePath, payloadObj) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(payloadObj);
    const req = http.request(
      {
        hostname: ZARA_HOST,
        port: ZARA_PORT,
        path: routePath,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyStr)
        },
        timeout: 12000
      },
      res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const reply =
                parsed.reply ||
                parsed.response ||
                parsed.message ||
                parsed.output ||
                parsed.text ||
                (parsed.choices && parsed.choices[0]?.message?.content);
              if (reply && typeof reply === "string" && reply.trim()) {
                return resolve(reply.trim());
              }
            } catch {
              if (data && data.trim().length > 2 && !data.trim().startsWith("<")) {
                return resolve(data.trim());
              }
            }
          }
          reject(new Error("Status " + res.statusCode));
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout Zara AGI"));
    });
    req.write(bodyStr);
    req.end();
  });
}

async function askNeuralZara(author, articleTitle, userMsg) {
  const prompt = `[CONTESTO: OurVelvet & Rose Magazine 18+ | Articolo: "${articleTitle}" | Utente: ${author}] ${userMsg}`;
  const candidateRoutes = ["/chat", "/api/chat", "/ask", "/message", "/api/message", "/zara/chat"];
  const payload = {
    message: prompt,
    prompt: prompt,
    text: prompt,
    user: author,
    sessionId: "mag-" + author.toLowerCase().replace(/[^a-z0-9]/g, "")
  };

  for (const route of candidateRoutes) {
    try {
      const answer = await callZaraEndpoint(route, payload);
      return `💋 [Zara AGI · Live]: ${answer}`;
    } catch {
      // Prova il prossimo endpoint esposto dal nodo 8811
    }
  }

  return `💋 [Zara AGI · Nodo 8811]: Ho registrato la tua riflessione su "${articleTitle.slice(0, 75)}" (${userMsg.slice(0, 70)}). Nell'ecosistema OurVelvet ogni voce consapevole rafforza il club: +25 Human Mining Shares ($OV/$DSN) accreditati.`;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.url === "/state" && req.method === "GET") {
    const db = loadDb();
    const topMiners = Object.values(db.miners)
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 10);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ posts: db.posts.slice(0, 40), topMiners }));
  }

  if (req.url === "/post" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        const db = loadDb();
        const author = (data.author || "Membro 18+").trim().slice(0, 40);
        const wallet = (data.wallet || "").trim().slice(0, 50);
        const text = (data.text || "").trim().slice(0, 420);
        const articleTitle = (data.articleTitle || "Bacheca Club").trim().slice(0, 120);
        const askZara = Boolean(data.askZara);

        if (!text) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Testo vuoto" }));
        }

        const zaraReply = askZara ? await askNeuralZara(author, articleTitle, text) : null;

        const newPost = {
          id: "p-" + Date.now(),
          author,
          role: wallet ? "HOLDER / MINER VERIFICATO" : "MEMBRO 18+",
          text,
          articleRef: articleTitle,
          ts: new Date().toISOString(),
          shares: 1,
          zaraReply
        };
        db.posts.unshift(newPost);
        const mineInfo = creditMiner(db, author, wallet, askZara ? "comment_zara" : "share_article", newPost.id);
        saveDb(db);

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, post: newPost, mining: mineInfo }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Errore elaborazione post" }));
      }
    });
    return;
  }

  if (req.url === "/mine-share" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        const db = loadDb();
        const mineInfo = creditMiner(db, data.author || "Sharer 18+", data.wallet || "", "share_article", data.articleId || "mag");
        saveDb(db);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, mining: mineInfo }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Errore share" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("Velvet Magazine Social bridge -> Zara AGI (127.0.0.1:8811) attivo su :" + PORT);
});
