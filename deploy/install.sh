#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# CNC Costify Backend — Hostinger VPS first-time setup
#
# Run ONCE on a fresh Ubuntu 22.04 / Debian 12 VPS:
#   curl -fsSL https://raw.githubusercontent.com/<repo>/main/deploy/install.sh | sudo bash
# OR locally:
#   sudo bash deploy/install.sh
#
# What it does:
#   1. apt update / upgrade
#   2. Install Node.js 20 LTS + build tools + git
#   3. Install PM2 globally
#   4. Install nginx + certbot (Let's Encrypt)
#   5. Create app dir /opt/cnc-costify (chown to invoking user)
#   6. Open firewall ports (80, 443, 22)
#
# After this:  scp/git-clone code → bash deploy/deploy.sh
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Color helpers
B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'
info()  { echo -e "${G}[INFO]${N} $*"; }
warn()  { echo -e "${Y}[WARN]${N} $*"; }
err()   { echo -e "${R}[ERR]${N}  $*" >&2; }

# Must be root
if [ "$(id -u)" -ne 0 ]; then
    err "This script must be run as root (use sudo)"
    exit 1
fi

APP_DIR="${APP_DIR:-/opt/cnc-costify}"
TARGET_USER="${SUDO_USER:-${USER:-root}}"

info "Installing CNC Costify Backend on $(hostname)"
info "Target user: $TARGET_USER"
info "App dir:     $APP_DIR"
echo

# ── 0. Fix line endings (in case scripts came from Windows) ──────────────
fix_line_endings() {
    local dir="$1"
    if command -v dos2unix >/dev/null 2>&1; then
        find "$dir" -type f \( -name "*.sh" -o -name "*.cjs" -o -name "*.conf" -o -name "*.template" \) -exec dos2unix -q {} \; 2>/dev/null || true
    else
        find "$dir" -type f \( -name "*.sh" -o -name "*.cjs" -o -name "*.conf" -o -name "*.template" \) -exec sed -i 's/\r$//' {} \; 2>/dev/null || true
    fi
}
APP_DIR_DEFAULT="/opt/cnc-costify"
[ -d "$APP_DIR_DEFAULT" ] && fix_line_endings "$APP_DIR_DEFAULT"

# ── 1. System update ─────────────────────────────────────────────────────
info "Step 1/5 — Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git build-essential ca-certificates gnupg ufw dos2unix sqlite3

# ── 2. Node.js 20 LTS via NodeSource ─────────────────────────────────────
info "Step 2/5 — Installing Node.js 20 LTS..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
info "Node version: $(node -v)"
info "npm  version: $(npm -v)"

# ── 3. PM2 process manager ───────────────────────────────────────────────
info "Step 3/5 — Installing PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
    npm install -g pm2
fi
info "PM2 version: $(pm2 -v)"

# ── 4. Nginx + Certbot (Let's Encrypt) ───────────────────────────────────
info "Step 4/5 — Installing nginx + certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx
systemctl enable --now nginx

# ── 5. Firewall + app dir ────────────────────────────────────────────────
info "Step 5/5 — Configuring firewall + app directory..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable

mkdir -p "$APP_DIR"
mkdir -p /var/log/cnc-costify
mkdir -p /var/lib/cnc-costify/data   # SQLite DB lives here
chown -R "$TARGET_USER:$TARGET_USER" "$APP_DIR" /var/log/cnc-costify /var/lib/cnc-costify

echo
info "${B}=== Install complete ===${N}"
echo
info "Next steps:"
echo "  1. Copy code to $APP_DIR:"
echo "       rsync -avz --exclude node_modules --exclude .git --exclude data ./ ${TARGET_USER}@<vps-ip>:$APP_DIR/"
echo "     OR: cd $APP_DIR && git clone <your-repo> ."
echo
echo "  2. Set up DNS:  api.cnccostify.cloud → $(curl -s ifconfig.me 2>/dev/null || echo '<vps-ip>')"
echo
echo "  3. Run nginx setup:"
echo "       sudo bash $APP_DIR/deploy/setup-nginx.sh"
echo
echo "  4. Deploy app:"
echo "       cd $APP_DIR && bash deploy/deploy.sh"
echo
