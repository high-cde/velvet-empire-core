(function () {
  if (window.__VELVET_DOCK_LOADED__) return;
  window.__VELVET_DOCK_LOADED__ = true;

  // Trasforma tutte le card notizie della pagina in pulsanti diretti verso Our Velvet Magazine 18+
  function wireFeedCards() {
    document.querySelectorAll("a[href]").forEach(function (a) {
      if (a.textContent && (a.textContent.includes("Apri l’originale") || a.textContent.includes("Apri l'originale"))) {
        const card = a.closest("article, div[class*='rounded']");
        if (card && !card.dataset.ovWired) {
          card.dataset.ovWired = "1";
          const rawCat = (card.querySelector("span, p")?.textContent || "").toUpperCase();
          let rubrica = "";
          if (rawCat.includes("LESBO")) rubrica = "?rubrica=LESBO";
          else if (rawCat.includes("GAY")) rubrica = "?rubrica=GAY";
          else if (rawCat.includes("TRANS")) rubrica = "?rubrica=TRANS";
          else if (rawCat.includes("PORNO")) rubrica = "?rubrica=PORNO%20MISTO";
          else if (rawCat.includes("DONNA")) rubrica = "?rubrica=DONNA%20%26%20SESSO";

          const magBtn = document.createElement("a");
          magBtn.href = "https://velvet.x-zdos.it/magazine/" + rubrica;
          magBtn.textContent = "Apri nella Rivista Our Velvet 18+ →";
          magBtn.style.cssText =
            "display:inline-flex;align-items:center;margin-top:8px;margin-right:10px;" +
            "padding:7px 14px;border-radius:999px;background:#d7b46a;color:#09070d;" +
            "font-size:12px;font-weight:800;text-decoration:none;box-shadow:0 4px 14px rgba(215,180,106,0.3);";
          a.parentNode.insertBefore(magBtn, a);
        }
      }
    });
  }

  const trigger = document.createElement("button");
  trigger.textContent = "☰ Our Velvet & AI";
  trigger.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:9999;cursor:pointer;" +
    "padding:10px 16px;border-radius:999px;background:rgba(16,8,20,0.94);" +
    "color:#d7b46a;border:1px solid rgba(215,180,106,0.55);font-weight:800;" +
    "font-size:12px;letter-spacing:0.6px;backdrop-filter:blur(12px);" +
    "box-shadow:0 8px 24px rgba(0,0,0,0.75);font-family:system-ui,sans-serif;";

  const drawer = document.createElement("div");
  drawer.style.cssText =
    "position:fixed;bottom:62px;right:16px;z-index:9999;display:none;width:310px;max-width:92vw;" +
    "background:rgba(14,7,18,0.97);backdrop-filter:blur(16px);border:1px solid rgba(215,180,106,0.42);" +
    "border-radius:18px;padding:16px;box-shadow:0 18px 44px rgba(0,0,0,0.9);" +
    "font-family:system-ui,sans-serif;color:#f3ebf2;font-size:12px;";

  drawer.innerHTML = [
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">',
    '<strong style="color:#d7b46a;letter-spacing:1px;font-size:11px;">POLO AI & OUR VELVET</strong>',
    '<a href="https://velvet.x-zdos.it/hub/" style="color:#f3ebf2;font-size:11px;text-decoration:underline;">Indice AI/Velvet →</a>',
    '</div>',
    '<div style="display:grid;gap:7px;">',
    '<a href="https://velvet.x-zdos.it/magazine/" style="color:#d7b46a;text-decoration:none;font-weight:800;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.05);">📰 Our Velvet Magazine 18+ (25+ Riviste & Novità)</a>',
    '<a href="https://velvet.x-zdos.it/zara/" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">💋 Zara AGI Console (18+)</a>',
    '<a href="https://velvet.x-zdos.it/ai-directory/" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">🤖 AI Directory ZDOS</a>',
    '<a href="https://velvet.x-zdos.it/ourvelvet" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">🪪 Card Utente & Badge</a>',
    '<a href="https://velvet.x-zdos.it/accesso" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">👑 Creator / Mistress & Slave</a>',
    '<a href="https://velvet.x-zdos.it/live" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">📼 Red Velvet Videoteca Reale</a>',
    '<a href="https://discord.gg/BcMh6vcpQX" target="_blank" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">💬 Discord (118 Stanze Live)</a>',
    '<a href="https://x-zdos.it/hub/" style="color:#00f0ff;text-decoration:none;font-weight:700;padding:6px 8px;border-radius:8px;border:1px solid rgba(0,240,255,0.35);margin-top:4px;">⚡ Passa al Polo Crypto & ZDOS →</a>',
    '</div>'
  ].join("");

  trigger.onclick = function () { drawer.style.display = drawer.style.display === "none" ? "block" : "none"; };
  if (!window.location.pathname.startsWith("/magazine")) {
    document.body.appendChild(drawer);
    document.body.appendChild(trigger);
  }
  setInterval(wireFeedCards, 1500);
  wireFeedCards();
})();
