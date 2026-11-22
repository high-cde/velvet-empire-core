(function () {
  if (window.__ZDOS_DOCK_LOADED__) return;
  window.__ZDOS_DOCK_LOADED__ = true;

  const btn = document.createElement("button");
  btn.textContent = "☰ ZDOS & Crypto";
  btn.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:9999;cursor:pointer;" +
    "padding:10px 16px;border-radius:999px;background:rgba(6,12,24,0.94);" +
    "color:#00f0ff;border:1px solid rgba(0,240,255,0.55);font-weight:800;" +
    "font-size:12px;letter-spacing:0.6px;backdrop-filter:blur(12px);" +
    "box-shadow:0 8px 24px rgba(0,0,0,0.8);font-family:system-ui,sans-serif;";

  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;bottom:62px;right:16px;z-index:9999;display:none;width:305px;max-width:92vw;" +
    "background:rgba(8,14,26,0.97);backdrop-filter:blur(16px);border:1px solid rgba(0,240,255,0.42);" +
    "border-radius:18px;padding:16px;box-shadow:0 18px 44px rgba(0,0,0,0.9);" +
    "font-family:system-ui,sans-serif;color:#eef4fa;font-size:12px;";

  box.innerHTML = [
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">',
    '<strong style="color:#00f0ff;letter-spacing:1px;font-size:11px;">ZDOS // CRYPTO & MINING</strong>',
    '<a href="https://x-zdos.it/hub/" style="color:#14f195;font-size:11px;text-decoration:underline;">Hub ZDOS →</a>',
    '</div>',
    '<div style="display:grid;gap:7px;">',
    '<a href="https://x-zdos.it/fomo/" style="color:#14f195;text-decoration:none;font-weight:700;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">🚀 Solana Terminal ($DSN & $OV)</a>',
    '<a href="https://quest.x-zdos.it" target="_blank" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">🧠 Miner Umano (Quest & Merit)</a>',
    '<a href="https://x-zdos.it/our-vault/" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">🏦 $OV — Our Vault (unMineable)</a>',
    '<a href="https://swap.x-zdos.it/?ref=6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD" target="_blank" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">🔄 ZSwap DEX Solana</a>',
    '<a href="https://x-zdos.it/zlang/linguaggio/" style="color:#fff;text-decoration:none;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.04);">⚡ ZLang, VM ZLB2 & Monete</a>',
    '<a href="https://velvet.x-zdos.it/hub/" style="color:#d7b46a;text-decoration:none;font-weight:700;padding:6px 8px;border-radius:8px;border:1px solid rgba(215,180,106,0.35);margin-top:4px;">💋 Passa al Polo AI & Our Velvet →</a>',
    '</div>'
  ].join("");

  btn.onclick = function () { box.style.display = box.style.display === "none" ? "block" : "none"; };
  document.body.appendChild(box);
  document.body.appendChild(btn);
})();
