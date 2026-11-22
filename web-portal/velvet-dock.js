(function () {
  if (window.__VELVET_DOCK_LOADED__) return;
  window.__VELVET_DOCK_LOADED__ = true;

  // 1. AUTO-SCROLL INTELLIGENTE SULLE SOTTO-PAGINE (salta l'hero banner iniziale)
  function autoScrollToSection() {
    const p = window.location.pathname.replace(/\/+$/, "");
    if (!p || p === "" || p.startsWith("/magazine") || p.startsWith("/zara") || p.startsWith("/hub")) {
      return;
    }

    const keywordsByPath = {
      "/discover": ["radar", "esplora", "scopri", "discover", "vetrina"],
      "/radar": ["radar", "esplora", "mistress", "slave"],
      "/ourvelvet": ["card", "profilo", "badge", "tessera", "livello"],
      "/live": ["videoteca", "video", "embed", "sala", "live"],
      "/accesso": ["accesso", "creator", "mistress", "slave", "invito"],
      "/creator-board": ["bacheca", "creator", "mistress", "incarichi"],
      "/gioco": ["gioco", "rpg", "zlang", "carne e lattice", "arena"]
    };

    const keys = keywordsByPath[p] || [p.replace("/", "")];
    let attempts = 0;

    const timer = setInterval(function () {
      attempts++;
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, section, [id]"));
      let target = null;

      for (const el of headings) {
        const txt = (el.textContent || "").trim().toLowerCase();
        const id = (el.id || "").toLowerCase();
        // Salta il titolo gigante della hero banner
        if (txt.includes("il piacere autonomo")) continue;
        if (keys.some(k => id.includes(k) || (txt.length > 2 && txt.length < 90 && txt.includes(k)))) {
          target = el;
          break;
        }
      }

      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 76;
        if (y > 180) {
          window.scrollTo({ top: y, behavior: "smooth" });
          clearInterval(timer);
        }
      } else if (attempts >= 12) {
        // Fallback: scorre automaticamente oltre l'hero banner su mobile/desktop
        const heroH = Math.min(window.innerHeight * 0.88, 680);
        if (window.scrollY < 100) {
          window.scrollTo({ top: heroH, behavior: "smooth" });
        }
        clearInterval(timer);
      }
    }, 250);
  }

  // Intercetta anche i cambi di rotta interni SPA (pushState / popstate)
  const origPush = history.pushState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    setTimeout(autoScrollToSection, 150);
  };
  window.addEventListener("popstate", () => setTimeout(autoScrollToSection, 150));
  window.addEventListener("load", () => setTimeout(autoScrollToSection, 200));

  // 2. COLLEGA LE CARD NOTIZIE ALLA RIVISTA 18+
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
            "font-size:12px;font-weight:800;text-decoration:none;";
          a.parentNode.insertBefore(magBtn, a);
        }
      }
    });
  }

  // 3. PULSANTE COMPATTO IN BASSO A DESTRA (nascosto su /magazine/)
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
    '<a href="https://velvet.x-zdos.it/magazine/" style="color:#d7b46a;text-decoration:none;font-weight:800;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.05);">📰 Our Velvet Magazine 18+ (25+ Riviste)</a>',
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
  autoScrollToSection();
})();
