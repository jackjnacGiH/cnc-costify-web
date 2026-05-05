#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Set up SMTP credentials in .env + restart PM2 + send test email.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/jackjnacGiH/cnc-costify-web/main/backend/deploy/setup-smtp.sh -o /tmp/setup-smtp.sh
#   bash /tmp/setup-smtp.sh
#
# Will prompt for password locally — never sent over chat/SSH visible.
# ─────────────────────────────────────────────────────────────────────────
set -e

B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'
info() { echo -e "${G}[INFO]${N} $*"; }
warn() { echo -e "${Y}[WARN]${N} $*"; }
err()  { echo -e "${R}[ERR]${N}  $*" >&2; }

ENV_FILE="${ENV_FILE:-/opt/cnc-costify/backend/.env}"
APP_DIR="$(dirname "$ENV_FILE")"

if [ ! -f "$ENV_FILE" ]; then
    err "$ENV_FILE not found"
    exit 1
fi

info "${B}=== SMTP Setup for CNC Costify ===${N}"
echo

# Defaults for Hostinger SMTP
DEFAULT_USER="info@cnccostify.cloud"
DEFAULT_HOST="smtp.hostinger.com"
DEFAULT_PORT="465"

read -p "SMTP email account [$DEFAULT_USER]: " SMTP_USER
SMTP_USER="${SMTP_USER:-$DEFAULT_USER}"

read -p "SMTP host [$DEFAULT_HOST]: " SMTP_HOST
SMTP_HOST="${SMTP_HOST:-$DEFAULT_HOST}"

read -p "SMTP port [$DEFAULT_PORT]: " SMTP_PORT
SMTP_PORT="${SMTP_PORT:-$DEFAULT_PORT}"

# Password — hidden input
read -s -p "SMTP password (hidden): " SMTP_PASS
echo ""
if [ -z "$SMTP_PASS" ]; then
    err "Password empty — aborting"
    exit 1
fi

# Update .env
info "Updating $ENV_FILE..."
sed -i '/^SMTP_/d' "$ENV_FILE"
{
    echo "SMTP_HOST=$SMTP_HOST"
    echo "SMTP_PORT=$SMTP_PORT"
    echo "SMTP_USER=$SMTP_USER"
    echo "SMTP_PASS=$SMTP_PASS"
    echo "SMTP_FROM=\"CNC Costify AI <$SMTP_USER>\""
} >> "$ENV_FILE"

# Securely clear from memory
unset SMTP_PASS

info "Configuration saved (password hidden):"
grep "^SMTP_" "$ENV_FILE" | sed 's/^SMTP_PASS=.*/SMTP_PASS=<hidden>/'
echo

# Restart PM2 with new env
info "Restarting PM2 process..."
cd "$APP_DIR"
pm2 restart cnc-costify --update-env > /dev/null
sleep 2
pm2 list --no-color | grep -E "id|cnc-costify"
echo

# Test email send
info "Sending test email to $SMTP_USER..."
cd "$APP_DIR"
set -a; source "$ENV_FILE"; set +a
node -e "
const email = require('./lib/email');
console.log('  isConfigured:', email.isConfigured());
email.sendVerifyEmail({
    to: process.env.SMTP_USER,
    token: 'smtp-test-' + Date.now(),
    locale: 'th',
    name: 'SMTP Test'
}).then(r => {
    if (r.mocked) console.log('  ⚠️  MOCKED (still no SMTP) — check env vars');
    else console.log('  ✅ Sent — messageId:', r.messageId);
}).catch(e => {
    console.error('  ❌ FAIL:', e.message);
    if (e.code) console.error('     code:', e.code);
    if (e.response) console.error('     response:', e.response);
    process.exit(1);
});
"

echo
info "${B}=== Done ===${N}"
info "ตรวจสอบ inbox ของ $SMTP_USER — ควรได้รับอีเมลทดสอบ 'ยืนยันอีเมลของคุณ'"
info "ถ้าไม่ได้รับใน 1-2 นาที — ลองเช็ค Junk/Spam folder"
