#!/usr/bin/env bash
set -euo pipefail

SYNC_DIR="/root/velvet-empire-sync"
LOG_FILE="/var/log/velvet-empire-sync.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Avvio sincronizzazione completa velvet-empire-core..." >> "$LOG_FILE"

mkdir -p "$SYNC_DIR/velvet-claw" "$SYNC_DIR/velvet-daemon" "$SYNC_DIR/web-zara" "$SYNC_DIR/nginx"

# Sincronizza i demoni escludendo tassativamente segreti, DB SQLite, log e node_modules
rsync -a --delete \
  --exclude='.env' --exclude='.env.*' \
  --exclude='*.db' --exclude='*.db-journal' --exclude='*.sqlite' --exclude='*.sqlite3' \
  --exclude='*.log' --exclude='*.pem' --exclude='*.key' \
  --exclude='node_modules' --exclude='.git' \
  /root/velvet-claw/ "$SYNC_DIR/velvet-claw/"

rsync -a --delete \
  --exclude='.env' --exclude='.env.*' \
  --exclude='*.db' --exclude='*.db-journal' --exclude='*.sqlite' --exclude='*.sqlite3' \
  --exclude='*.log' --exclude='*.pem' --exclude='*.key' \
  --exclude='node_modules' --exclude='.git' \
  /root/velvet-daemon/ "$SYNC_DIR/velvet-daemon/"

# Sincronizza anche la console web di Zara e il vhost Nginx
[ -d /var/www/velvet-zara ] && rsync -a --delete /var/www/velvet-zara/ "$SYNC_DIR/web-zara/"
[ -d /var/www/velvet-mining ] && rsync -a --delete /var/www/velvet-mining/ "$SYNC_DIR/web-mining/"
[ -d /var/www/velvet-magazine ] && rsync -a --delete /var/www/velvet-magazine/ "$SYNC_DIR/web-magazine/"
[ -d /var/www/velvet-portal ] && rsync -a --delete /var/www/velvet-portal/ "$SYNC_DIR/web-portal/"
[ -d /var/www/zdos-portal ] && rsync -a --delete /var/www/zdos-portal/ "$SYNC_DIR/zdos-portal/"
[ -f /etc/nginx/sites-enabled/velvethub ] && cp /etc/nginx/sites-enabled/velvethub "$SYNC_DIR/nginx/velvethub.conf"

cd "$SYNC_DIR"
git add -A

if git diff --cached --quiet; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Nessuna modifica rilevata rispetto all'ultimo commit." >> "$LOG_FILE"
else
  git commit -m "feat(sync): Zara AGI node + console /zara/ + Nginx + cassa Solana ($(date '+%Y-%m-%d %H:%M'))" >> "$LOG_FILE" 2>&1
  GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" git push origin main >> "$LOG_FILE" 2>&1 || \
  GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no" git push origin main >> "$LOG_FILE" 2>&1
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push completato su high-cde/velvet-empire-core." >> "$LOG_FILE"
fi
