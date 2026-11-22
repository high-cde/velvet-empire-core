(function () {
  if (window.__VELVET_DOCK_LOADED__) return;
  window.__VELVET_DOCK_LOADED__ = true;

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
          magBtn.textContent = "Leggi su Our Velvet Magazine 18+ →";
          magBtn.style.cssText =
            "display:inline-flex;align-items:center;gap:6px;margin-top:10px;margin-right:10px;" +
            "padding:7px 14px;border-radius:999px;background:#d7b46a;color:#09070d;" +
            "font-size:12px;font-weight:800;text-decoration:none;";
          a.parentNode.insertBefore(magBtn, a);
        }
      }
    });
  }

  const dock = document.createElement("div");
  dock.style.cssText =
    "position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:9998;" +
    "display:flex;flex-wrap:wrap;justify-content:center;gap:7px;padding:8px 14px;" +
    "border-radius:999px;background:rgba(12,6,16,0.94);backdrop-filter:blur(14px);" +
    "border:1px solid rgba(215,180,106,0.45);box-shadow:0 12px 32px rgba(0,0,0,0.85);" +
    "font-family:system-ui,-apple-system,sans-serif;font-size:12px;max-width:96vw;";

  const links = [
    { label: "🏛️ Club", href: "https://velvet.x-zdos.it/" },
    { label: "📰 Magazine 18+", href: "https://velvet.x-zdos.it/magazine/" },
    { label: "💋 Zara AGI", href: "https://velvet.x-zdos.it/zara/" },
    { label: "🏦 $OV Our Vault", href: "https://velvet.x-zdos.it/our-vault/" },
    { label: "📼 Videoteca", href: "https://velvet.x-zdos.it/live" },
    { label: "👑 Creator/Slave", href: "https://velvet.x-zdos.it/accesso" },
    { label: "⚡ ZLang & Monete", href: "https://velvet.x-zdos.it/zlang/linguaggio/" },
    { label: "🧭 Command Deck", href: "https://velvet.x-zdos.it/command-deck/" },
    { label: "💬 Discord", href: "https://discord.gg/BcMh6vcpQX", ext: true }
  ];

  links.forEach(function (item) {
    const el = document.createElement("a");
    el.href = item.href;
    if (item.ext) el.target = "_blank";
    el.textContent = item.label;
    el.style.cssText =
      "color:#f3ebf2;text-decoration:none;font-weight:700;padding:5px 10px;" +
      "border-radius:999px;border:1px solid rgba(255,255,255,0.12);white-space:nowrap;";
    el.onmouseenter = function () { el.style.background = "#d7b46a"; el.style.color = "#09070d"; };
    el.onmouseleave = function () { el.style.background = "transparent"; el.style.color = "#f3ebf2"; };
    dock.appendChild(el);
  });

  document.body.appendChild(dock);
  setInterval(wireFeedCards, 1500);
  wireFeedCards();
})();
