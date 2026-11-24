#!/bin/bash
# VELVET HUB 18+ / SEX BANK / MERITOCRAZIA — WAKE SCRIPT ENHANCED
# VPS vmi3082470 · AsapKali · ZDOS / Our Velvet
# Non tocca colori/estetica. Organizza e attiva motori reali.

set -e
echo "⛓️⚡️ Attivazione Hub 18+ Velvet City / ZDOS — AsapKali (Enhanced)"

VELVET_ROOT="/var/www/velvet"
CLAW_DIR="$VELVET_ROOT/velvet-claw"
LOG_DIR="$VELVET_ROOT/logs"
REPO_CLONE="/opt/velvet-empire-core"

mkdir -p "$VELVET_ROOT"/{radar,annunci,merit,sessioni,boost,logs,config}
mkdir -p "$CLAW_DIR"

if [ -d "$REPO_CLONE/.git" ]; then
  cd "$REPO_CLONE" && git pull origin main || true
  cp -r "$REPO_CLONE/velvet-claw/." "$CLAW_DIR/" 2>/dev/null || true
fi

echo "👑 Preparazione directory e permessi..."
chown -R www-data:www-data "$VELVET_ROOT" 2>/dev/null || true
chmod +x "$CLAW_DIR"/*.js "$CLAW_DIR"/*.sh 2>/dev/null || true

# Config meritocratica base
cat > "$VELVET_ROOT/config/merit.json" << 'EOF'
{
  "protocol": "ROSSO",
  "meritocracy": true,
  "weights": {
    "votes": 0.35,
    "volume_ov": 0.30,
    "mining_shares": 0.20,
    "sessions": 0.15
  },
  "min_age": 18,
  "consent_required": true
}
EOF

# Ranking placeholder
cat > "$VELVET_ROOT/merit/ranking.json" << EOF
{"status":"active","protocol":"ROSSO","meritocracy":true,"updated":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","top":[]}
EOF

echo "🚀 Sveglia AGI e daemon..."
if command -v pm2 >/dev/null; then
  pm2 delete velvet-claw zara-agi living-hosts merit-rank 2>/dev/null || true
  pm2 start "$CLAW_DIR/velvet_claw_daemon.js" --name velvet-claw --time || true
  pm2 start "$CLAW_DIR/zara_agi_node.js" --name zara-agi --time || true
  [ -f "$CLAW_DIR/living_hosts_daemon.js" ] && pm2 start "$CLAW_DIR/living_hosts_daemon.js" --name living-hosts || true
  # Merit ranking daemon (se presente)
  [ -f "$CLAW_DIR/merit_ranking.js" ] && pm2 start "$CLAW_DIR/merit_ranking.js" --name merit-rank || true
  pm2 save
  pm2 list
else
  echo "PM2 assente. Avvio background..."
  nohup node "$CLAW_DIR/velvet_claw_daemon.js" > "$LOG_DIR/claw.log" 2>&1 &
  nohup node "$CLAW_DIR/zara_agi_node.js" > "$LOG_DIR/zara.log" 2>&1 &
fi

if command -v nginx >/dev/null; then
  nginx -t && systemctl reload nginx && echo "Nginx reloaded" || echo "Nginx test failed"
fi

echo "✅ Hub 18+ Enhanced attivato."
echo "   Radar Carne + Merit Board + sessioni pronti"
echo "   AGI Zara + claw online"
echo "   Config merit: $VELVET_ROOT/config/merit.json"
echo "   Log: $LOG_DIR/"
echo "PROTOCOLLO ROSSO ATTIVO. SOLO 18+. CONSENSO OBBLIGATORIO."
