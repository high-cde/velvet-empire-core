#!/usr/bin/env bash
set -euo pipefail

SYNC_DIR="/root/velvet-empire-sync"
LOG_FILE="/var/log/velvet-empire-sync.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Avvio sincronizzazione notturna velvet-empire-core..." >> "$LOG_FILE"

mkdir -p "$SYNC_DIR/velvet-claw" "$SYNC_DIR/velvet-daemon"

# Aggiorna il codice escludendo tassativamente segreti, DB SQLite, log e node_modules
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

cd "$SYNC_DIR"
git add -A

if git diff --cached --quiet; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Nessuna modifica rilevata rispetto all'ultimo commit." >> "$LOG_FILE"
else
  git commit -m "chore(nightly-sync): backup automatico $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1
  GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" git push origin main >> "$LOG_FILE" 2>&1 || \
  GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no" git push origin main >> "$LOG_FILE" 2>&1
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push completato su high-cde/velvet-empire-core." >> "$LOG_FILE"
fi
