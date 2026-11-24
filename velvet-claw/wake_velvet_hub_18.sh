#!/bin/bash
# VELVET HUB 18+ / SEX BANK / MERITOCRAZIA WAKE SCRIPT
# Per VPS vmi3082470 - Incolla e esegui come root o con sudo
# Non tocca colori/estetica esistenti. Organizza e attiva motori reali.

set -e
echo "⛓️ ⚡️ Attivazione Hub 18+ Velvet City / ZDOS - AsapKali"

# Percorsi tipici (adatta se diversi)
VELVET_ROOT="/var/www/velvet"
CLAW_DIR="$VELVET_ROOT/velvet-claw"
PM2_NAME="velvet-hub"

mkdir -p $VELVET_ROOT/{radar,annunci,merit,sessioni,logs}
mkdir -p $CLAW_DIR

# Se i file claw sono già nel repo, pull o copia
# cd /path/to/repo && git pull

echo "👑 Preparazione directory e permessi..."
chown -R www-data:www-data $VELVET_ROOT 2>/dev/null || true
chmod +x $CLAW_DIR/*.js 2>/dev/null || true

# Restart / start processi esistenti (claw, zara, etc.)
echo "🚀 Sveglia AGI e daemon..."
if command -v pm2 >/dev/null; then
  pm2 restart velvet-claw 2>/dev/null || pm2 start $CLAW_DIR/velvet_claw_daemon.js --name velvet-claw || true
  pm2 restart zara-agi 2>/dev/null || pm2 start $CLAW_DIR/zara_agi_node.js --name zara-agi || true
  pm2 save
else
  echo "PM2 non trovato. Installa con: npm i -g pm2"
  nohup node $CLAW_DIR/velvet_claw_daemon.js > $VELVET_ROOT/logs/claw.log 2>&1 &
  nohup node $CLAW_DIR/zara_agi_node.js > $VELVET_ROOT/logs/zara.log 2>&1 &
fi

# Nginx reload se presente
if command -v nginx >/dev/null; then
  nginx -t && systemctl reload nginx || true
fi

echo "✅ Hub 18+ attivato. Radar Carne, Merit Board, sessioni e AGI operativi."
echo "Log: $VELVET_ROOT/logs/"
echo "Conferma a @ZDOS_Core"
