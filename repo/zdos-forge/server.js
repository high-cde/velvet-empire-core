const { execFile } = require("child_process");
function evalZlangNative(program) {
  return new Promise((resolve) => {
    execFile("/usr/local/bin/organism-bin", ["--eval", program], { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) return resolve({ ok: false, error: stderr || err.message });
      resolve({ ok: true, output: stdout.trim() });
    });
  });
}

const http = require("http");
const https = require("https");
const fs = require("fs");

const PORT = 8833;
const DB_PATH = "/root/zdos-forge/forge_tokens.json";
const XAI_KEY = process.env.XAI_API_KEY || "";

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return {
      tokens: [
        {
          ticker: "$DSN",
          name: "ZDOS Sovereign Core",
          ca: "35w74RT77BPSYNpmzpvxmR9wu2ihpgzubKy4bkGHR3F4",
          creator: "ZDOS Bare-Metal Architect",
          curvePct: 100,
          power: "ZLang VM ZLB2 · Proof-of-Merit · Compute Bridge",
          desc: "Carburante computazionale dell'ecosistema ZDOS, nodo RPC sovrano e ricompense Miner Umano.",
          createdAt: "2026-11-14T00:00:00Z"
        },
        {
          ticker: "$OV",
          name: "OV Ecosystem Utility",
          ca: "2EN6Y1zM4yyt41gE2muzdJSAgRCAZiXqnmkgpbrspump",
          creator: "ZDOS Community Labs",
          curvePct: 100,
          power: "Social Mining · Community Rewards · Multi-Token Vault",
          desc: "Token utility Solana integrato con il vault multi-coin unMineable e le ricompense della community.",
          createdAt: "2026-11-14T00:00:00Z"
        }
      ],
      oracles: []
    };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function askGrokMystic(name, intention) {
  return new Promise(resolve => {
    if (!XAI_KEY) {
      const archetypes = [
        "La Geometria d'Oro: la tua intuizione vede oltre il rumore del mercato. Ciò che costruisci con disciplina diventa architettura sovrana.",
        "La Custode della Luce Nera: la visione femminile guida la creazione tecnica. Ogni blocco validato porta chiarezza e prosperità.",
        "L'Oracolo dell'Etere: sincronizza mente, codice e intento. Il tuo progetto trova risonanza naturale nella rete."
      ];
      const pick = archetypes[Math.abs((name + intention).length) % archetypes.length];
      return resolve(`✦ [GROK · ORACLE SOLO DONNE per ${name}]: ${pick} (Intento: "${intention.slice(0, 90)}")`);
    }

    const payload = JSON.stringify({
      model: "grok-2-latest",
      messages: [
        {
          role: "system",
          content: "Sei l'Oracolo Strategico di ZDOS Forge (100% SFW, elegante, poetico, ispirazionale e riservato alle donne). Celebra intuizione, creatività, leadership e chiarezza."
        },
        { role: "user", content: `Nome: ${name}. Intenzione: ${intention}` }
      ],
      temperature: 0.8
    });

    const req = https.request(
      {
        hostname: "api.x.ai",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + XAI_KEY,
          "Content-Length": Buffer.byteLength(payload)
        },
        timeout: 10000
      },
      res => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => {
          try {
            const j = JSON.parse(data);
            const txt = j.choices?.[0]?.message?.content;
            if (txt) return resolve(`✦ [GROK · ORACLE]: ${txt.trim()}`);
          } catch {}
          resolve(`✦ [GROK · ORACLE]: Sigillo creativo attivato per ${name}.`);
        });
      }
    );
    req.on("error", () => resolve(`✦ [GROK · ORACLE]: Sigillo creativo attivato per ${name}.`));
    req.write(payload);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/zlang/eval") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const { code: zcode } = JSON.parse(body || "{}");
        const out = await evalZlangNative(zcode || "");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.url === "/state" && req.method === "GET") {
    const db = loadDb();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ tokens: db.tokens, oracles: db.oracles.slice(0, 12) }));
  }

  if (req.url === "/forge-token" && req.method === "POST") {
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", () => {
      try {
        const d = JSON.parse(body || "{}");
        const name = (d.name || "").trim().slice(0, 36);
        let ticker = (d.ticker || "").trim().toUpperCase().slice(0, 10);
        if (!name || !ticker) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Nome e Ticker obbligatori" }));
        }
        if (!ticker.startsWith("$")) ticker = "$" + ticker;

        const db = loadDb();
        const pseudoMint = "ZDF" + Math.random().toString(36).substring(2, 12).toUpperCase() + "zdos1pump";
        const newTok = {
          ticker,
          name,
          ca: (d.ca || pseudoMint).trim().slice(0, 64),
          creator: (d.creator || "ZDOS Builder").trim().slice(0, 40),
          curvePct: 15,
          power: (d.power || "ZLang Smart Hook + Proof-of-Merit + Vault Routing").trim().slice(0, 120),
          desc: (d.desc || "Asset Solana forgiato su ZDOS Sovereign Forge.").trim().slice(0, 260),
          createdAt: new Date().toISOString()
        };
        db.tokens.unshift(newTok);
        saveDb(db);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, token: newTok }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Errore forging" }));
      }
    });
    return;
  }

  if (req.url === "/mystic-oracle" && req.method === "POST") {
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", async () => {
      try {
        const d = JSON.parse(body || "{}");
        const name = (d.name || "Costruttrice Sovrana").trim().slice(0, 40);
        const intention = (d.intention || "Visione, armonia e leadership creativa").trim().slice(0, 240);
        const prophecy = await askGrokMystic(name, intention);
        const db = loadDb();
        db.oracles.unshift({ name, prophecy, ts: new Date().toISOString() });
        saveDb(db);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, prophecy }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Errore oracolo" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("ZDOS Forge SFW Crypto Suite attivo su 127.0.0.1:" + PORT);
});
