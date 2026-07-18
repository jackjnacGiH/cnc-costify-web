#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# CNC Costify Backend — Nginx + SSL (Let's Encrypt) setup
#
# Run ONCE on VPS after install.sh + DNS pointing to VPS:
#   sudo bash deploy/setup-nginx.sh
#
# Env vars:
#   DOMAIN — default: api.cnccostify.cloud
#   EMAIL  — default: info@cnccostify.cloud (for Let's Encrypt notifications)
#
# Prerequisites:
#   - install.sh has been run (nginx + certbot installed)
#   - DNS A record:  api.cnccostify.cloud → <VPS IP>  (verify with: dig api.cnccostify.cloud)
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'
info() { echo -e "${G}[INFO]${N} $*"; }
warn() { echo -e "${Y}[WARN]${N} $*"; }
err()  { echo -e "${R}[ERR]${N}  $*" >&2; }

if [ "$(id -u)" -ne 0 ]; then
    err "Must run as root (use sudo)"
    exit 1
fi

DOMAIN="${DOMAIN:-api.cnccostify.cloud}"
EMAIL="${EMAIL:-info@cnccostify.cloud}"
APP_DIR="${APP_DIR:-/opt/cnc-costify}"
NGINX_AVAIL="/etc/nginx/sites-available/cnc-costify"
NGINX_ENABLED="/etc/nginx/sites-enabled/cnc-costify"
TEMPLATE="$APP_DIR/deploy/nginx.conf.template"

info "Setting up nginx + SSL for $DOMAIN"

# ── 1. Verify DNS points to this VPS ─────────────────────────────────────
VPS_IP=$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')
DOMAIN_IP=$(dig +short "$DOMAIN" | tail -1)
info "VPS IP:    $VPS_IP"
info "$DOMAIN → $DOMAIN_IP"
if [ -z "$DOMAIN_IP" ] || [ "$VPS_IP" != "$DOMAIN_IP" ]; then
    warn "DNS for $DOMAIN does not point to this VPS yet."
    warn "Set A record at your DNS provider:  $DOMAIN → $VPS_IP"
    warn "Wait 1-5 min for propagation, then re-run this script."
    read -p "Continue anyway? [y/N] " yn
    [[ "$yn" =~ ^[Yy]$ ]] || exit 1
fi

# ── 2. Install nginx config ──────────────────────────────────────────────
info "Step 1/3 — Installing nginx config..."
if [ ! -f "$TEMPLATE" ]; then
    err "Template not found: $TEMPLATE"
    exit 1
fi
cp "$TEMPLATE" "$NGINX_AVAIL"
sed -i "s/api\.cnccostify\.cloud/$DOMAIN/g" "$NGINX_AVAIL"

# Remove default site if present (avoids hostname conflict)
rm -f /etc/nginx/sites-enabled/default

# Enable our site
ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"

info "Testing nginx config..."
nginx -t

systemctl reload nginx

# ── 3. SSL via certbot ───────────────────────────────────────────────────
info "Step 2/3 — Requesting SSL certificate from Let's Encrypt..."
certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$EMAIL" \
    --redirect \
    || warn "certbot failed — check DNS + try manually: certbot --nginx -d $DOMAIN"

# ── 4. Auto-renewal (built-in via systemd timer; just verify) ────────────
info "Step 3/3 — Verifying auto-renewal..."
systemctl status certbot.timer --no-pager | head -5 || true
certbot renew --dry-run || warn "renewal dry-run failed"

echo
info "${B}=== Nginx + SSL setup complete ===${N}"
echo
info "Test:     curl -I https://$DOMAIN"
info "Logs:     tail -f /var/log/nginx/cnc-costify-access.log"
echo
