(function () {
  if (window.__VELVET_DOCK_LOADED__) return;
  window.__VELVET_DOCK_LOADED__ = true;

  // Collega le card feed alla Rivista 18+ senza alterare il layout della pagina
  function wireFeedCards() {
    document.querySelectorAll("a[href]").forEach(function (a) {
      if (a.textContent && a.textContent.includes("Apri l’originale")) {
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
          magBtn.textContent = "Leggi su Magazine 18+ →";
          magBtn.style.cssText =
            "display:inline-flex;align-items:center;margin-top:8px;margin-right:10px;" +
            "padding:6px 13px;border-radius:999px;background:#d7b46a;color:#09070d;" +
            "font-size:12px;font-weight:800;text-decoration:none;";
          a.parentNode.insertBefore(magBtn, a);
        }
      }
    });
  }

  // Un solo pulsante discreto in basso a destra invece di una barra affollata
  const trigger = document.createElement("button");
  trigger.textContent = "☰ Sezioni";
  trigger.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:9999;cursor:pointer;" +
    "padding:10px 16px;border-radius:999px;background:rgba(16,8,20,0.92);" +
    "color:#d7b46a;border:1px solid rgba(215,180,106,0.55);font-weight:800;" +
    "font-size:12px;letter-spacing:0.6px;backdrop-filter:blur(12px);" +
    "box-shadow:0 8px 24px rgba(0,0,0,0.75);font-family:system-ui,sans-serif;";

  const drawer = document.createElement("div");
  drawer.style.cssText =
    "position:fixed;bottom:62px;right:16px;z-index:9999;display:none;width:310px;max-width:92vw;" +
    "background:rgba(14,7,18,0.96);backdrop-filter:blur(16px);border:1px solid rgba(215,180,106,0.4);" +
    "border-radius:18px;padding:16px;box-shadow:0 18px 44px rgba(0,0,0,0.9);" +
    "font-family:system-ui,sans-serif;color:#f3ebf2;font-size:12px;";

  drawer.innerHTML = [
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">',
    '<strong style="color:#d7b46a;letter-spacing:1px;font-size:11px;">OUR VELVET // SEZIONI</strong>',
    '<a href="https://velvet.x-zdos.it/hub/" style="color:#f3ebf2;font-size:11px;text-decoration:underline;">Indice Completo →</a>',
    '</div>',
    '<div style="display:grid;gap:8px;">',
    '<div style="padding:8px;border-radius:10px;background:rgba(255,255,255,0.04);">',
    '<div style="color:#d7b46a;font-weight:800;font-size:10px;margin-bottom:4px;">01 · CLUB & RUOLI</div>',
    '<a href="https://velvet.x-zdos.it/ourvelvet" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">🪪 Card Utente & Badge</a>',
    '<a href="https://velvet.x-zdos.it/accesso" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">👑 Creator / Mistress & Slave</a>',
    '</div>',
    '<div style="padding:8px;border-radius:10px;background:rgba(255,255,255,0.04);">',
    '<div style="color:#d7b46a;font-weight:800;font-size:10px;margin-bottom:4px;">02 · RIVISTA & VIDEO 18+</div>',
    '<a href="https://velvet.x-zdos.it/magazine/" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">📰 Our Velvet Magazine 18+</a>',
    '<a href="https://velvet.x-zdos.it/live" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">📼 Red Velvet Videoteca</a>',
    '</div>',
    '<div style="padding:8px;border-radius:10px;background:rgba(255,255,255,0.04);">',
    '<div style="color:#d7b46a;font-weight:800;font-size:10px;margin-bottom:4px;">03 · AGI, VAULT & DISCORD</div>',
    '<a href="https://velvet.x-zdos.it/zara/" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">💋 Zara AGI Console</a>',
    '<a href="https://velvet.x-zdos.it/our-vault/" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">🏦 $OV — Our Vault (Mining)</a>',
    '<a href="https://velvet.x-zdos.it/zlang/linguaggio/" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">⚡ ZLang & Monete</a>',
    '<a href="https://discord.gg/BcMh6vcpQX" target="_blank" style="color:#fff;text-decoration:none;display:block;padding:2px 0;">💬 Discord (118 Stanze Live)</a>',
    '</div>',
    '</div>'
  ].join("");

  trigger.onclick = function () {
    drawer.style.display = drawer.style.display === "none" ? "block" : "none";
  };

  document.body.appendChild(drawer);
  document.body.appendChild(trigger);
  setInterval(wireFeedCards, 1500);
  wireFeedCards();
})();
