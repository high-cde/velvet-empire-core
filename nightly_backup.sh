#!/usr/bin/env bash
set -euo pipefail

SYNC_DIR="/root/velvet-empire-sync/repo"
mkdir -p "$SYNC_DIR"

# Sincronizza i portali web e le interfacce
[ -d /var/www/velvet-portal ] && rsync -a --delete --exclude='.env*' --exclude='*.key' --exclude='*.pem' /var/www/velvet-portal/ "$SYNC_DIR/web-portal/"
[ -d /var/www/velvet-magazine ] && rsync -a --delete --exclude='.env*' --exclude='*.key' --exclude='*.pem' /var/www/velvet-magazine/ "$SYNC_DIR/velvet-magazine/"
[ -d /var/www/zdos-portal ] && rsync -a --delete --exclude='.env*' --exclude='*.key' --exclude='*.pem' /var/www/zdos-portal/ "$SYNC_DIR/zdos-portal/"

# Sincronizza i backend Node.js (escludendo node_modules, segreti e DB runtime sensibili)
[ -d /root/velvet-mag-social ] && rsync -a --delete --exclude='node_modules' --exclude='.env*' --exclude='*db.json' /root/velvet-mag-social/ "$SYNC_DIR/velvet-mag-social/"
[ -d /root/zdos-forge ] && rsync -a --delete --exclude='node_modules' --exclude='.env*' --exclude='*tokens.json' /root/zdos-forge/ "$SYNC_DIR/zdos-forge/"
[ -d /root/velvet-claw ] && rsync -a --delete --exclude='node_modules' --exclude='.env*' --exclude='*.json' /root/velvet-claw/ "$SYNC_DIR/velvet-claw/"

# Esporta snapshot pulito dei vhost Nginx (solo struttura location/proxy)
mkdir -p "$SYNC_DIR/nginx-sites"
rsync -a --delete --exclude='*.key' --exclude='*.pem' /etc/nginx/sites-enabled/ "$SYNC_DIR/nginx-sites/"

cd "$SYNC_DIR"
git add -A
if ! git diff --cached --quiet; then
  git commit -m "sync(ecosystem): update velvet-magazine social, zdos-forge, portals & nginx ($(date -u +'%Y-%m-%d %H:%M UTC'))"
  git push origin HEAD
  echo "OK: Push completato su GitHub."
else
  echo "OK: Nessuna modifica pendente da pushare."
fi
