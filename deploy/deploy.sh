#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# CNC Costify Backend — Deploy / update on VPS
#
# Run from $APP_DIR (default: /opt/cnc-costify) every time you push code:
#   bash deploy/deploy.sh
#
# What it does:
#   1. (If git repo) git pull origin main
#   2. npm install --production --omit=dev (skip electron, electron-builder, nodemon)
#   3. Create/migrate SQLite DB (auto on first run via lib/feedbackDb.js)
#   4. PM2 start or reload
#
# Idempotent — safe to re-run.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'
info() { echo -e "${G}[INFO]${N} $*"; }
warn() { echo -e "${Y}[WARN]${N} $*"; }

APP_DIR="${APP_DIR:-/opt/cnc-costify}"
cd "$APP_DIR"

info "Deploying CNC Costify Backend from $APP_DIR"

# ── 1. Git pull (if applicable) ──────────────────────────────────────────
if [ -d .git ]; then
    info "Step 1/3 — Pulling latest code..."
    git fetch --all --prune
    git pull --ff-only origin main || warn "git pull failed — continuing with local code"
else
    info "Step 1/3 — Not a git repo, skipping pull"
fi

# ── 2. Install production dependencies ───────────────────────────────────
info "Step 2/3 — Installing production dependencies..."
# Skip devDeps: electron, electron-builder, nodemon
npm ci --omit=dev --omit=optional 2>/dev/null || npm install --omit=dev --omit=optional

# ── 3. PM2 start/reload ──────────────────────────────────────────────────
info "Step 3/3 — Starting/reloading PM2 process..."
ECOSYSTEM="$APP_DIR/deploy/ecosystem.config.cjs"
if pm2 describe cnc-costify >/dev/null 2>&1; then
    info "Reloading existing PM2 process (zero-downtime)..."
    pm2 reload cnc-costify --update-env
else
    info "Starting new PM2 process..."
    pm2 start "$ECOSYSTEM"
    pm2 save
    # Ensure PM2 starts on boot
    pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true
fi

echo
info "${B}=== Deploy complete ===${N}"
pm2 status
echo
info "Tail logs:  pm2 logs cnc-costify --lines 50"
info "Stop:       pm2 stop cnc-costify"
info "Restart:    pm2 restart cnc-costify"
