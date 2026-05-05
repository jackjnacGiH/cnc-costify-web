#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# CNC Costify Backend — Database backup
#
# Run via cron every 6 hours:
#   0 */6 * * * /opt/cnc-costify/deploy/backup.sh > /var/log/cnc-costify/backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

# DB path (must match feedbackDb.js _pickDbDir order)
DB_CANDIDATES=(
    "$HOME/.cnc-costify/data/cnc.db"
    "/var/lib/cnc-costify/data/cnc.db"
    "/opt/cnc-costify/data/cnc.db"
)

DB=""
for c in "${DB_CANDIDATES[@]}"; do
    if [ -f "$c" ]; then DB="$c"; break; fi
done

if [ -z "$DB" ]; then
    echo "[backup] DB not found in any candidate location"
    exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$HOME/.cnc-costify/backups}"
mkdir -p "$BACKUP_DIR"

TS=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/cnc_${TS}.db"

# Use sqlite .backup command (online, safe while DB is in use)
sqlite3 "$DB" ".backup '$OUT'"
gzip -f "$OUT"

echo "[backup] $(date) → $OUT.gz ($(du -h $OUT.gz | cut -f1))"

# Retain last 30 backups
ls -1t "$BACKUP_DIR"/cnc_*.db.gz | tail -n +31 | xargs -r rm -f
