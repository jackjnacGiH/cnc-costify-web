# CNC Costify AI — Project Memory

> **For Claude Code:** This file is your reference for working on CNC Costify AI.
> Read it at the start of every session before making changes.

---

## 1. Project Overview

**CNC Costify AI** is a SaaS platform that helps Thai CNC machine shops quote
parts in seconds instead of hours, by combining:

- **Desktop application (Electron)** — runs locally on Windows, contains AI
  vision pipeline, STEP file analysis, pricing engine, and Excel export.
- **Web backend (Node.js Express + Python Flask + SQLite)** — hosted on
  Hostinger VPS at `api.cnccostify.cloud`. Handles auth, quota, licensing,
  orders, AI key proxy (currently disabled), and admin operations.
- **Marketing website (Next.js 16 + Tailwind 4 + next-intl)** — deployed on
  Vercel at `www.cnccostify.cloud`. Bilingual (TH/EN). Source under `website/`.
- **Admin panel** — same Next.js app under `/[locale]/admin/*`. Email-gated
  via `ADMIN_EMAILS` env var.

**Company:** บริษัท เจ แนค (ประเทศไทย) จำกัด — J Nac (Thailand) Co., Ltd.

**Current version:** V5.14 (see Version History section)

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Desktop (Electron 35 + Python OCC)            VPS Backend       │
│  ┌────────────────────────────────┐            ┌──────────────┐  │
│  │ electron/main.js               │            │ server.js    │  │
│  │  ├ webAuth.js  (sign-in flow)  │  HTTPS     │  - Express   │  │
│  │  ├ licenseManager.js  (Ed25519)│ ◀────────▶ │  - SQLite    │  │
│  │  ├ webSession.js  (DPAPI store)│            │  - PM2       │  │
│  │  └ preload.js  (IPC bridge)    │            └──────────────┘  │
│  └────────────────────────────────┘                              │
│  ┌────────────────────────────────┐            ┌──────────────┐  │
│  │ CNC_Costify_AI_V6.html         │            │ Vercel       │  │
│  │  - Main UI + Settings + Chat   │            │ www.cnc...   │  │
│  │  - License tab                 │            │ Next.js 16   │  │
│  │  - iframe → /aey               │            └──────────────┘  │
│  └────────────────────────────────┘                              │
│  ┌────────────────────────────────┐                              │
│  │ PDF_JPG_Costify.html (iframe)  │                              │
│  │  - AI batch analysis           │                              │
│  │  - Cache + resize + parallel   │                              │
│  └────────────────────────────────┘                              │
│  ┌────────────────────────────────┐                              │
│  │ Python Flask (port 5001/5002)  │                              │
│  │  - OpenCASCADE STEP volume     │                              │
│  └────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Files & Their Purpose (DO NOT BREAK)

### Backend (Node.js)
| File | Purpose |
|---|---|
| `server.js` | Main Express backend — auth, quota, licenses, orders, AI routes |
| `lib/feedbackDb.js` | SQLite schema + migrations |
| `lib/desktopLink.js` | Auth-link flow + device tokens + quota |
| `lib/orderManager.js` | Plan/order logic, license issuance, validity periods |
| `lib/licenseSigner.js` | Ed25519 license.dat builder |
| `lib/authDb.js` | User CRUD + admin queries |
| `lib/email.js` | SMTP via Hostinger |

### Backend (Python)
| File | Purpose |
|---|---|
| `server.py` | Flask backend (port 5001 in prod, 5002 in dev) for OpenCASCADE |
| `rthook_occ.py` | PyInstaller runtime hook for OCC |
| `CNC-Costify-AI.spec` / `.onefile.spec` | PyInstaller build specs |

### Desktop UI (HTML)
| File | Purpose |
|---|---|
| `CNC_Costify_AI_V6.html` | Main desktop UI (tabs: Home / PDF-JPG / Settings / License / Chat) |
| `PDF_JPG_Costify.html` | Loaded via `<iframe src="/aey">`. React + Tailwind. Batch AI analysis |
| `admin/index.html` | Standalone admin panel (legacy, separate app) |

### Desktop (Electron)
| File | Purpose |
|---|---|
| `electron/main.js` | Electron main process, IPC handlers, web sign-in flow, `cnc-costify://` deep links |
| `electron/preload.js` | `window.api`, `window.webAuth` IPC bridge |
| `electron/licenseManager.js` | Validates `.dat` files using `admin-key-2026` (Ed25519) + legacy keys |
| `electron/webAuth.js` | API client: sign-in, me, quota, license-report, AI proxy |
| `electron/webSession.js` | Encrypted token storage via Electron `safeStorage` (DPAPI) |
| `electron/activation.html` | Startup activation window — web sign-in OR license.dat import |

### Website (Next.js)
| Path | Purpose |
|---|---|
| `website/src/app/[locale]/page.tsx` | Home (Hero + Pain + Features + Pricing) |
| `website/src/app/[locale]/pricing/page.tsx` | 4-tier pricing cards |
| `website/src/app/[locale]/about/page.tsx` | About Us |
| `website/src/app/[locale]/features/page.tsx` | All features detail |
| `website/src/app/[locale]/docs/page.tsx` | User guide with TOC |
| `website/src/app/[locale]/download/page.tsx` | Installer download |
| `website/src/app/[locale]/contact/page.tsx` | Contact |
| `website/src/app/[locale]/privacy/page.tsx` | Privacy policy (PDPA) |
| `website/src/app/[locale]/account/page.tsx` | User account dashboard |
| `website/src/app/[locale]/upgrade/page.tsx` | Plan purchase + slip upload |
| `website/src/app/[locale]/admin/*` | Admin panel (Orders / Generate License / Users) |
| `website/src/app/api/*` | API proxy routes Next.js ↔ VPS |
| `website/src/components/Navbar.tsx` | Auth-aware navbar with plan badge |
| `website/messages/{th,en}.json` | i18n strings |

### Build / Deploy
| File | Purpose |
|---|---|
| `package.json` | npm scripts + electron-builder config (V5.14) |
| `build/installer.nsh` | NSIS installer customization |
| `deploy/` | VPS systemd/PM2/Nginx templates |

---

## 4. Version History

| Version | Key Changes |
|---|---|
| V5.0 | Initial release |
| V5.1 | Web account login + Free quota + Hardware ID binding |
| V5.2 | Added `admin-key-2026` Ed25519 verification (Phase A licenses) |
| V5.3 | Free plan can calculate via web session (was blocked at calc button) |
| V5.4 | Backup includes processPrices + Coating Add/Edit/Delete CRUD |
| V5.5 | Custom prompt modal (Electron 35 disables `window.prompt()`) |
| V5.6 | Surface (Grinding/Sandblast) round-up + per-row Precision Base in PDF/JPG |
| V5.7 | PDF/JPG layout full-width + readable fonts + remove global PB selector |
| V5.8 | PDF/JPG dropdowns auto-sync via storage event when Material/Coating settings change |
| V5.9 | (Skipped — initially had AI proxy for Monthly+, reverted) |
| V5.10 | GPT/OpenAI support + expanded OpenRouter model list (bring-your-own-key for all plans) |
| V5.11 | Parallel batch processing (concurrency=3) + per-file elapsed timer + faster default models |
| V5.12 | Quick Wins: file hash cache (LRU 100) + image resize (max 2048px) + connection pre-warm + ETA timer |
| V5.13 | Fix: PDF/JPG blank screen — pin Babel JSX to classic runtime (`data-presets="react-classic"`) so the unpinned `@babel/standalone` CDN flipping to the automatic runtime no longer emits an illegal `import` that blanks `/aey` |
| V5.14 | **Current** — Security: revoke exposed `admin-key-2025` verification while preserving all production licenses issued with `admin-key-2026` |

---

## 5. Database Schema (SQLite — `/root/.cnc-costify/data/cnc.db` on VPS)

### Tables (with migrations applied)
- **`feedback`** — feature suggestions, bug reports
- **`users`** — `id, email, password_hash, name, company, plan, plan_expires_at, verified, is_admin, created_at, last_login_at`
- **`licenses`** — `id, user_id, license_key, plan, hardware_id, valid_from, valid_until, status, revoked, revoked_reason, license_dat_json, created_at`
- **`orders`** — `id, user_id, plan, amount, currency, slip_path, payment_ref, payment_method, status, notes, hardware_id, confirmed_at, confirmed_by, created_at`
- **`sessions`** — JWT refresh sessions
- **`device_tokens`** — `id, user_id, hardware_id, device_name, os, app_version, last_used_at, last_ip, revoked, revoked_reason, local_license_status, local_license_expires_at, local_license_days_left, local_license_reported_at`
- **`auth_link_codes`** — short-lived codes for desktop ↔ web pairing
- **`usage_log`** — `id, user_id, day_key, file_type, file_name, file_size, device_token_id, created_at, via_proxy, engine, model` *(V5.9: via_proxy/engine/model added)*

### Plans
| Plan | Daily limit | Validity | Online? |
|---|---|---|---|
| `free` | 3 files | Lifetime | Required |
| `monthly` | 30 files | 30 days | Required |
| `yearly` | unlimited | 455 days | Offline OK (license.dat) |
| `lifetime` | unlimited | 36500 days | Offline OK (license.dat) |

---

## 6. Key API Endpoints

### Auth (cookie-based)
- `POST /api/auth/register` — Sign up
- `POST /api/auth/login` — Sign in (sets `cnc_session` HttpOnly cookie)
- `POST /api/auth/logout`
- `GET /api/auth/me` — Returns `{ user: { id, email, plan, is_admin } }`
- `GET /api/auth/google` + `/callback` — Google OAuth

### Desktop (Bearer device_token + X-Hardware-ID)
- `POST /api/desktop/auth-link/start` — desktop kicks off pairing
- `POST /api/desktop/auth-link/confirm` — web confirms (requires login cookie)
- `GET /api/desktop/auth-link/exchange?code=...` — desktop polls for token
- `GET /api/desktop/me` — returns `{ user, quota }`
- `POST /api/desktop/report-license` — desktop reports its `.dat` status
- `POST /api/quota/check` — pre-flight quota check
- `POST /api/quota/log` — log 1 file processed

### AI
- `POST /api/aey-analyze` — image/PDF analysis (Gemini → OpenRouter → OpenAI fallback chain). Uses keys from `api_config.json`
- `POST /api/chat` — material consultation chat
- `GET /api/config/ai` / `POST /api/config/ai` — local AI key config
- `POST /api/ai/proxy/analyze` — *(reserved, not active)* shared company key proxy
- `POST /api/ai/proxy/chat` — *(reserved, not active)*

### Account (cookie auth)
- `GET /api/account/quota` — current quota + license.dat override
- `GET /api/account/devices` — list devices
- `POST /api/account/devices/:id/revoke`
- `GET /api/account/license-info`
- `GET /api/account/license-dat` — download `.dat` file

### Orders / Admin
- `POST /api/order/create` — multipart with slip upload
- `GET /api/order/my`
- `GET /api/admin/orders` (admin only)
- `POST /api/admin/orders/:id/confirm` — issues license + sends email
- `POST /api/admin/orders/:id/reject`
- `GET /api/admin/users` / `GET /api/admin/users/:id`
- `POST /api/admin/license/generate` — direct issuance (admin)
- `POST /api/admin/licenses/:id/revoke`
- `GET /api/admin/licenses/:id/dat`

### Pricing & Plans (constants)
```js
PLAN_LIMITS         = { free: 3, monthly: 30, yearly: null, lifetime: null }
PLAN_VALIDITY_DAYS  = { monthly: 30, yearly: 455, lifetime: 36500 }
PLAN_AMOUNT_THB     = { monthly: 445, yearly: 4450, lifetime: 26700 }
```

---

## 7. Auth Flows

### Web sign-in (Free/Monthly)
1. User signs up / logs in at `https://www.cnccostify.cloud/login`
2. JWT issued as HttpOnly cookie `cnc_session`
3. Server checks `users.plan` for quota

### Desktop sign-in (Free/Monthly)
1. Desktop calls `POST /api/desktop/auth-link/start` with HW ID
2. Browser opens `/desktop-auth?code=...`
3. User clicks Authorize (logged in)
4. Desktop polls `GET /exchange?code=...` → gets `device_token`
5. Token + HW ID stored via Electron `safeStorage`

### Yearly/Lifetime (offline license.dat)
1. Admin runs `/admin/license/generate` (or auto from order confirm)
2. `lib/licenseSigner.js` signs JSON with Ed25519 private key (`LICENSE_PRIVATE_KEY` env)
3. User downloads `.dat` from `/account` → imports in Desktop
4. Desktop's `electron/licenseManager.js` verifies with `admin-key-2026` public key

---

## 8. Build / Deploy

### Desktop installer (Windows)
```bash
npx electron-builder --win --x64 --publish never
# Output: release_v5/CNC Costify AI V5.X Setup.exe (~635 MB)
```

### VPS backend
```bash
# Upload via SFTP using ~/.ssh/cnc_vps key:
python upload_v5XX.py
python deploy_v5X_backend.py   # uploads server.js + lib/ + restarts pm2
# Manually:
ssh root@72.62.254.216 "pm2 restart cnc-costify --update-env"
```

### Website (Vercel)
```bash
# From project root (with .vercel/ linked or use --archive):
rm -rf website/.next website/.vercel/output
vercel deploy --prod --yes --archive=tgz
# Production: https://www.cnccostify.cloud
```

### Version bump checklist (when releasing V5.X+1)
1. `package.json` — version, description, productName, artifactName, shortcutName, verify script
2. `lib/licenseSigner.js` — comment "Desktop V5.X+ verifies..."
3. `website/messages/{th,en}.json` — Brand.version, Hero.badge
4. `website/src/app/[locale]/{layout,docs,download,page,features}/page.tsx`
5. Build + upload installer to VPS at `/opt/cnc-costify/backend/downloads/`
6. Deploy website to Vercel

---

## 9. VPS Reference

- **Host:** `72.62.254.216` (root)
- **SSH key:** `~/.ssh/cnc_vps` (Ed25519, no password)
- **Backend path:** `/opt/cnc-costify/backend/`
- **DB:** `/root/.cnc-costify/data/cnc.db`
- **Downloads:** `/opt/cnc-costify/backend/downloads/`
- **Logs:** `/root/.pm2/logs/cnc-costify-{out,error}.log`
- **PM2 process:** `cnc-costify`

### Critical env vars (`/opt/cnc-costify/backend/.env`)
- `LICENSE_PRIVATE_KEY` — Ed25519 PEM (with `\n` escapes) — for signing license.dat
- `SMTP_*` — Hostinger SMTP credentials for emails
- `ADMIN_EMAILS` — comma-separated admin email allowlist
- `JWT_SECRET` — session token signing
- *(Reserved, currently empty)* `SHARED_GEMINI_API_KEY`, `SHARED_OPENROUTER_API_KEY`, `SHARED_OPENAI_API_KEY` — for AI proxy mode

---

## 10. AI Pipeline (PDF/JPG analysis)

**Provider chain (`/api/aey-analyze`):** Gemini → OpenRouter → OpenAI
- **Gemini:** multi-key rotation, model from `AI_CONFIG.gemini.model` (default `gemini-2.0-flash-exp`)
- **OpenRouter:** fallback when all Gemini keys exhausted; expanded model list in V5.10
- **OpenAI:** *(V5.10+)* native GPT API integration as third fallback

**V5.12 Quick-Wins (in `PDF_JPG_Costify.html`):**
- File-hash cache (LRU 100) — `localStorage` keyed by `aey:v1:auto:<sha256>`
- Image resize to 2048px before sending if file > 500KB
- Connection pre-warm on mount
- ETA timer based on rolling 5-file average
- Worker pool concurrency=3
- Per-row elapsed-time badge

**Bring-your-own-key only.** Company-shared AI proxy infrastructure is built but disabled — re-enable by setting `SHARED_*_API_KEY` env vars on VPS.

---

## 11. Common Commands

```bash
# Build desktop installer
npx electron-builder --win --x64 --publish never

# Deploy backend code to VPS
python deploy_backend.py

# Upload installer to VPS
python upload_v512.py   # or matching version

# Deploy website (from project root)
rm -rf website/.next website/.vercel/output && \
  vercel deploy --prod --yes --archive=tgz

# SSH into VPS
ssh root@72.62.254.216 -i ~/.ssh/cnc_vps

# View backend logs
ssh root@72.62.254.216 "pm2 logs cnc-costify --nostream --lines 50"

# Restart backend
ssh root@72.62.254.216 "pm2 restart cnc-costify --update-env"

# Query DB
ssh root@72.62.254.216 "sqlite3 /root/.cnc-costify/data/cnc.db 'SELECT ...'"
```

---

## 12. Working Rules

1. **Always bump version** in **all 5 places** when changing functionality:
   `package.json` (4 fields) + `licenseSigner.js` comment + 4 website files (`messages/*.json`, `layout.tsx`, `download/page.tsx`, `page.tsx`).
2. **Test schema migrations on VPS manually** — `_addColumnIfMissing` in `feedbackDb.js` has historically failed to run on existing DBs. Always verify with `PRAGMA table_info(...)` and run `ALTER TABLE` manually if missing.
3. **License.dat keys:** Current = `admin-key-2026` (V5.2+). Legacy `admin-key-2025` still in `LEGACY_KEYS` for backward compat. Never remove legacy.
4. **Hardware ID binding** — 1 license = 1 device. To move, contact admin (no self-service).
5. **Free plan policy (V5.10+):** ALL plans must bring their own API key. Company does NOT provide free AI.
6. **iframe sub-frame access:** `window.webAuth` and `window.api` available inside PDF_JPG iframe via Electron's `webPreferences`.
7. **Storage events:** Used to cross-sync iframe ↔ main window when settings change.

---

## 13. Out of Scope / Future Tasks

- Admin dashboard for AI cost tracking per user
- Mac/Linux desktop versions
- Multi-user (team) plan
- Online viewer for `.docx` user manual (currently sent on request)
- AI proxy as paid add-on (infrastructure ready, not exposed)
- Auto-update mechanism (currently manual download)
