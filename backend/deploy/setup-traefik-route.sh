#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Add api.cnccostify.cloud routing to Traefik (the n8n reverse proxy)
# Run on Hostinger VPS where n8n is already deployed via Docker + Traefik.
#
# Usage (one-liner):
#   curl -fsSL https://raw.githubusercontent.com/jackjnacGiH/cnc-costify-web/main/backend/deploy/setup-traefik-route.sh | sudo bash
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'
info() { echo -e "${G}[INFO]${N} $*"; }
warn() { echo -e "${Y}[WARN]${N} $*"; }
err()  { echo -e "${R}[ERR]${N}  $*" >&2; }

DOMAIN="${DOMAIN:-api.cnccostify.cloud}"
DYNAMIC_DIR="${DYNAMIC_DIR:-/docker/n8n/traefik-dynamic}"
BACKEND_PORT="${BACKEND_PORT:-5000}"

if [ "$(id -u)" -ne 0 ]; then
    err "Must run as root (use sudo)"
    exit 1
fi

if [ ! -d "$DYNAMIC_DIR" ]; then
    err "Traefik dynamic dir not found: $DYNAMIC_DIR"
    err "Is n8n + Traefik deployed?"
    exit 1
fi

# ── 1. Write Traefik dynamic config ──────────────────────────────────────
info "Step 1/4 — Writing Traefik route config..."
TARGET="$DYNAMIC_DIR/cnc-costify.yml"
cat > "$TARGET" << 'YAML'
http:
  routers:
    cnc-costify:
      rule: "Host(`api.cnccostify.cloud`)"
      entryPoints:
        - web
        - websecure
      tls:
        certResolver: mytlschallenge
      service: cnc-costify
      middlewares:
        - cnc-costify-headers
  services:
    cnc-costify:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:5000"
  middlewares:
    cnc-costify-headers:
      headers:
        sslRedirect: true
        stsSeconds: 315360000
        browserXssFilter: true
        contentTypeNosniff: true
        forceSTSHeader: true
        sslHost: "api.cnccostify.cloud"
        stsIncludeSubdomains: true
        stsPreload: true
YAML

info "Wrote $TARGET"
ls -la "$DYNAMIC_DIR/"
echo

# ── 2. Verify backend is running on host:$BACKEND_PORT ───────────────────
info "Step 2/4 — Verifying backend on localhost:$BACKEND_PORT..."
HTTP_CODE=$(curl -s -o /tmp/cnc_check.txt -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/auth/me" || echo "000")
echo "  Backend response: HTTP $HTTP_CODE"
echo "  Body: $(head -c 200 /tmp/cnc_check.txt)"
if [ "$HTTP_CODE" = "000" ]; then
    err "Backend not reachable! Check: pm2 status"
    exit 1
fi
echo

# ── 3. Wait for Traefik to detect new config (file watcher) ──────────────
info "Step 3/4 — Waiting 8s for Traefik to load new route..."
sleep 8

# ── 4. Test routing via HTTPS ────────────────────────────────────────────
info "Step 4/4 — Testing https://$DOMAIN..."
echo "  → Trying HTTPS (may take up to 30s for Let's Encrypt to issue cert)..."
for i in 1 2 3 4 5 6; do
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "https://$DOMAIN/api/auth/me" 2>/dev/null || echo "000")
    echo "    Attempt $i: HTTP $HTTPS_CODE"
    if [ "$HTTPS_CODE" != "000" ] && [ "$HTTPS_CODE" != "404" ]; then
        break
    fi
    sleep 5
done

echo
info "Traefik logs (last 30 lines, filtered):"
docker logs n8n-traefik-1 --tail 30 2>&1 | grep -iE "cnc-costify|error|certificate" | tail -15 || true

echo
if [ "$HTTPS_CODE" = "401" ]; then
    info "${B}=== ✅ SUCCESS ===${N}"
    info "Routing works! https://$DOMAIN responds with 401 (auth required) — exactly what we want"
elif [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "404" ]; then
    info "${B}=== ✅ ROUTING OK ===${N}"
    info "https://$DOMAIN is live (HTTP $HTTPS_CODE) — backend reachable through Traefik"
else
    warn "Unexpected response code: $HTTPS_CODE"
    warn "Check: docker logs n8n-traefik-1 --tail 100"
    warn "Check DNS: dig $DOMAIN +short"
fi
echo
info "Done."
