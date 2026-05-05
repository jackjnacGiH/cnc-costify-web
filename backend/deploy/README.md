# CNC Costify Backend — Hostinger VPS Deployment

ระบบนี้ deploy `server.js` (Express + SQLite) ไปที่ Hostinger VPS เพื่อให้บริการ API:
- `/api/feedback/suggest` — รับ Feedback จาก marketing site (www.cnccostify.cloud)
- `/api/license/*` — ออก/ตรวจ License Key (Phase 2)
- `/api/auth/*` — Sign up / Login (Phase 2)
- `/api/order/*` — ระบบรับชำระเงิน manual (Phase 2)

API จะอยู่ที่ `https://api.cnccostify.cloud` (sub-domain) — เว็บ Vercel proxy มาที่นี่

---

## 📋 Prerequisites

1. **Hostinger VPS** (Ubuntu 22.04 หรือ Debian 12 — สั่งจาก hpanel.hostinger.com)
2. **DNS A record**: `api.cnccostify.cloud` → `<VPS IP>` (ตั้งที่ Hostinger DNS dashboard)
3. **SSH access**: `ssh root@<vps-ip>` ใช้งานได้

---

## 🚀 Deployment (ครั้งแรก)

### 1️⃣ ติดตั้ง dependencies บน VPS

SSH เข้า VPS แล้วรัน install script:

```bash
ssh root@<vps-ip>

# Clone repo (or rsync from local)
mkdir -p /opt/cnc-costify
cd /opt/cnc-costify
git clone https://github.com/<your-repo>.git .
# OR ถ้ายังไม่ใช้ git:
# rsync -avz --exclude node_modules --exclude .git --exclude data \
#       /path/to/local/CNC\ Costify\ AI\ 2027/ root@<vps-ip>:/opt/cnc-costify/

# Run install script
sudo bash deploy/install.sh
```

ผลลัพธ์: ติดตั้ง Node.js 20, PM2, nginx, certbot, firewall เปิด ports 22/80/443

### 2️⃣ ตั้ง Nginx + SSL

```bash
# ตรวจ DNS ก่อน — ต้องได้ IP ของ VPS
dig api.cnccostify.cloud

# ตั้ง nginx + Let's Encrypt SSL
sudo bash /opt/cnc-costify/deploy/setup-nginx.sh
```

ผลลัพธ์: `https://api.cnccostify.cloud` ใช้งานได้พร้อม SSL ใหม่ + auto-renew

### 3️⃣ Deploy app

```bash
cd /opt/cnc-costify

# เซ็ต admin token (หนึ่งครั้ง — เก็บไว้ที่ปลอดภัย)
TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "FEEDBACK_ADMIN_TOKEN=$TOKEN"  # เก็บค่านี้
pm2 set cnc-costify:FEEDBACK_ADMIN_TOKEN "$TOKEN"

# รัน deploy
bash deploy/deploy.sh
```

ผลลัพธ์: PM2 รัน `cnc-costify` บน port 5000, auto-restart ถ้า crash, auto-start ตอน reboot

### 4️⃣ ตั้งค่า Vercel ให้ proxy มาที่ backend นี้

```bash
# Local machine (ไม่ใช่ VPS)
cd website
vercel env rm BACKEND_API_URL production --yes
echo "https://api.cnccostify.cloud" | vercel env add BACKEND_API_URL production
vercel --prod --yes
vercel alias set <new-deployment-url> www.cnccostify.cloud
```

### 5️⃣ ทดสอบ

```bash
# ทดสอบ direct บน VPS
curl https://api.cnccostify.cloud/health
# → ok

# ทดสอบ POST feedback
curl -X POST https://api.cnccostify.cloud/api/feedback/suggest \
  -H "Content-Type: application/json" \
  -d '{"category":"newFeature","title":"test","description":"hello"}'
# → {"ok":true,"id":1}

# ทดสอบ flow เต็มผ่าน Vercel website
curl -X POST https://www.cnccostify.cloud/api/feedback/suggest \
  -H "Content-Type: application/json" \
  -d '{"category":"newFeature","title":"test from web","description":"via Vercel proxy"}'
# → {"ok":true,"id":2}
```

---

## 🔄 Update / Re-deploy

ทุกครั้งที่แก้ code:

```bash
# Local: push ไป git
git add .
git commit -m "your changes"
git push origin main

# VPS: pull + restart
ssh root@<vps-ip>
cd /opt/cnc-costify
bash deploy/deploy.sh
```

หรือใช้ GitHub Actions / Webhook อัตโนมัติ (Phase 3)

---

## 📊 ดู Feedback ที่เก็บไว้

```bash
# วิธีที่ 1: API endpoint (ต้องใช้ admin token)
curl -H "X-Admin-Token: $TOKEN" \
  "https://api.cnccostify.cloud/api/feedback/list?limit=50"

# วิธีที่ 2: SSH + SQLite CLI
ssh root@<vps-ip>
sqlite3 ~/.cnc-costify/data/cnc.db "SELECT * FROM feedback ORDER BY id DESC LIMIT 20;"
```

---

## 💾 Backup อัตโนมัติ

```bash
# ตั้ง cron ให้ backup ทุก 6 ชั่วโมง
crontab -e
# เพิ่ม:
0 */6 * * * /opt/cnc-costify/deploy/backup.sh > /var/log/cnc-costify/backup.log 2>&1
```

Backup เก็บที่ `~/.cnc-costify/backups/cnc_YYYYMMDD_HHMMSS.db.gz` (เก็บล่าสุด 30 ไฟล์)

---

## 🔧 Useful PM2 commands

```bash
pm2 status                          # ดู process status
pm2 logs cnc-costify --lines 100    # ดู logs
pm2 restart cnc-costify             # restart
pm2 reload cnc-costify              # zero-downtime reload
pm2 stop cnc-costify                # หยุด (ไม่ลบ)
pm2 delete cnc-costify              # ลบจาก PM2
pm2 monit                           # interactive monitor
```

---

## 🐛 Troubleshooting

### Express ไม่ขึ้น (port 5000 แบบไม่ตอบ)
```bash
pm2 logs cnc-costify --err --lines 50
```

### Nginx 502 Bad Gateway
- Backend ไม่ได้ run: `pm2 status` → start ถ้าไม่ขึ้น
- Firewall block: `ufw status`

### SSL หมดอายุ
- Auto-renew ปกติทำงานเอง: `systemctl status certbot.timer`
- Force renew: `certbot renew --force-renewal`

### ลบ DB / Reset
```bash
pm2 stop cnc-costify
rm ~/.cnc-costify/data/cnc.db*       # WAL/SHM ก็ลบด้วย
pm2 start cnc-costify                # auto-recreates schema
```

---

## 📁 ไฟล์ทั้งหมดใน deploy/

| ไฟล์ | หน้าที่ |
|---|---|
| `install.sh` | First-time VPS setup (Node, PM2, nginx, certbot, firewall) |
| `deploy.sh` | Update code + restart PM2 (รันทุกครั้งที่ deploy ใหม่) |
| `setup-nginx.sh` | Setup nginx reverse proxy + Let's Encrypt SSL |
| `nginx.conf.template` | Nginx site config (api.cnccostify.cloud → :5000) |
| `ecosystem.config.cjs` | PM2 process config (env vars, logs, memory limit) |
| `.env.example` | Template สำหรับ environment variables |
| `backup.sh` | SQLite online backup (cron job) |
| `README.md` | คู่มือนี้ |
