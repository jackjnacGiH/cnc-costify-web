# 💻 Electron + Offline License System (Manual Renewal) — Secure Edition

This document strengthens the offline license system for Electron applications by focusing on integrity, tamper-resistance, and clear user experience, while avoiding shared hardcoded secrets and unsafe crypto examples.

The architecture follows a “Sign on the admin side – Verify on the client side” model. The license file is digitally signed using the admin’s private key, and the client application verifies it with an embedded public key, which is not secret.

---

## 🎯 Goals and Principles
- Offline-first: Operates and renews without an internet connection
- Integrity over confidentiality: First ensure the license file is “authentic from the admin” and “not modified”; encryption to hide content is optional
- No hardcoded secret keys on client side: Embed only the admin’s public key
- Modern crypto: Use Ed25519 signatures, AES‑256‑GCM for encryption, and Argon2id/PBKDF2 as KDFs
- Verifiable and key-rotatable: Support algorithm/key versioning and revocation lists
- Respect privacy: Store only data necessary for validation and features

---

## 🛡️ Threat Model
- Copy/share the license file to other machines
- Modify the file to extend expiry or unlock features
- Roll back system time to bypass expiry
- Reverse/modify client code or repackage the installer
- Hook/debug at runtime to bypass license checks
- Leakage of the admin private key

Mitigations
- Digitally sign the license file using the admin private key, and verify using the embedded public key in the app
- Bind the license to a `hardware_id` derived from multiple stable identifiers (e.g., MachineGuid/BIOS/Storage ID), hashed to a single value
- Use `not_before`/`expires_at` with `grace_period_days` and `time_tolerance_sec` to mitigate time manipulation
- Store `last_seen_expiry` and detect aggressive time rollback patterns (e.g., system time decreases beyond tolerance)
- Use obfuscation/packaging to raise the bar against reversing (not a primary security measure)
- Manage admin keys securely; support `pubkey_id` for key rotation and revocation

---

## 🧱 System Architecture
- Actors
  - Admin Tool: Issues and renews license files
  - Client App: Electron + (Python server/Node) that reads/verifies license files
  - License File: `license.dat` (JSON with digital signature)
  - Keystore: Admin-side private key storage (not inside client app)
- Trust Boundary
  - Client trusts only license files that are “validly signed” and bound to that machine’s hardware
  - Admin private key never resides on the client side
- Data Flow
  1) Customer sends `hardware_id` to admin
  2) Admin issues a signed license file and returns it to the customer
  3) App reads the file → verifies signature/time/hardware/features → grants usage

---

## 🔑 Keys and Crypto
- Digital signature: Use `Ed25519` to sign the `license_payload` with the admin’s private key
  - The app embeds the public key (`pubkey`) along with `pubkey_id` and `sig_alg`
- Optional content encryption: Use `AES‑256‑GCM` if some fields need confidentiality
  - KDF: `Argon2id` (recommended) or `PBKDF2‑HMAC‑SHA256` with strict parameters and `salt`
  - Note: In offline systems, confidentiality is weaker than authenticity; prioritize signatures

---

## 📄 License File Format (`license.dat`)
The file is signed JSON, with the signature covering the entire `payload`:

```json
{
  "version": 1,
  "payload": {
    "license_id": "LIC-2025-000123",
    "product": "CNCcostifyAI",
    "customer_name": "ACME Co.",
    "hardware_id": "sha256:8cfa...",
    "issued_at": "2025-10-10T09:00:00Z",
    "not_before": "2025-10-10T00:00:00Z",
    "expires_at": "2026-10-10T00:00:00Z",
    "grace_period_days": 7,
    "time_tolerance_sec": 300,
    "features": { "pro": true, "module_x": true },
    "max_version": "1.2.x",
    "build_channel": "stable",
    "revoked": false
  },
  "signature": "base64:MEUCIQC...",
  "sig_alg": "Ed25519",
  "pubkey_id": "admin-key-2025",
  "enc": {
    "enabled": false,
    "enc_alg": "AES-256-GCM",
    "salt": "base64:...",
    "ciphertext": null
  }
}
```

Notes
- If `enc.enabled = true`, encrypt only specific fields in `payload` using AES‑GCM, but still “sign over the decrypted data” to preserve integrity
- `hardware_id` should be a combined hash from multiple stable identifiers to mitigate machine cloning

---

## 🧩 Hardware Binding
- Combine multiple sources such as `MachineGuid` (`HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`), BIOS serial, and disk/volume ID, then hash into a single `hardware_id`
- Support fallback/override when hardware changes (admin issues a new license upon customer identity verification)
- Communicate upfront that motherboard/disk changes may affect licensing for transparency

---

## ⏱️ Time Rollback Protection
- Use `not_before`/`expires_at` + `grace_period_days` and `time_tolerance_sec`
- Persist `last_seen_expiry` and `last_validation_time` in user space, and detect suspicious backward time shifts
- Avoid relying on online NTP; support additional checks if connectivity exists in future

---

## 📦 File Storage and Permissions
- License file locations
  - Per-machine: `\ProgramData\CNCcostifyAI\license.dat`
  - Per-user: `\Users\<User>\AppData\Roaming\CNCcostifyAI\license.dat`
- Permissions (ACL)
  - Readable by the user running the app; writable only by the app/admin
  - Avoid world-writable locations
- Logs/events
  - `\ProgramData\CNCcostifyAI\logs\server.log` should include reasons when license validation fails to aid support

---

## 🔁 Offline Workflow (Activation/Renewal)
- Activation
  1) App displays `hardware_id` to the customer
  2) Customer sends it to the admin
  3) Admin issues a signed `license.dat` and returns it
  4) Customer places the file at the designated location → app validates and enables
- Manual Renewal
  1) Before expiry/within grace period, customer requests renewal
  2) Admin issues a new signed file with updated `expires_at`
  3) Customer replaces the old file

UX Suggestions
- A “License Status” page showing expiry/grace window/bound hardware
- An “Import License File” button and clear error messages
- Do not auto-open a browser at app startup

---

## 🗝️ Admin Key Management
- Store private keys securely in the Admin Tool (e.g., HSM, password manager, or offline machine)
- Include `pubkey_id` in the license file to support key rotation
- Maintain a revocation list by `license_id` or sets of `pubkey_id`
- Backup and access policy restricted to authorized personnel only

---

## ✅ Testing and Validation
- Unit tests: Verify signature validation, time semantics, and abnormal time detection
- Integration tests: Read/write files at designated locations; file permissions
- Tamper tests: Alter values in the file → app must reject
- Time rollback tests: System time rollback within tolerance → warn; beyond tolerance → reject

---

## 🧹 Removed/Reduced
- Examples using `AES-ECB`, legacy `crypto.createCipher/Decipher` with passphrases, or shared `SECRET_KEY` across client/admin
- Hardcoding secret keys in the client app
- Renewal by “secret codes” decrypted on the client → replaced by “digitally signed license files” issued by admin

---

## 🧭 Recommended Roadmap
- Adopt `Argon2id` as the KDF when feasible
- Add a client-side `revocation list` (JSON from admin) as an optional feature
- Add monotonic clock checks and additional heuristics for time validation
- Improve the Admin Tool UX with issuance logs and auditability

---

## 📗 Summary
- Use the “Admin signs – Client verifies” architecture as the foundation
- Prioritize authenticity/tamper-resistance over content secrecy
- Define a clear license file format, bind to hardware, and use appropriate time windows and tolerances
- Eliminate hardcoded secrets and unsafe crypto examples

Once you confirm this approach, I will align the application code and the Admin Tool accordingly, keeping the app versioning intact and supporting ongoing installer packaging.

---

## 🔒 Dependencies & Security Update Log (2025‑10‑11)
- Updated `electron` (devDependency) from `^31.0.0` to `^35.7.5`.
  - Rationale: Mitigates ASAR Integrity Bypass vulnerability (GitHub Advisory: `GHSA-vmqv-hx8q-j7mg`).
- Updated the `electron-builder` toolchain within the `^24.x` range (effective build version observed: `24.13.3`).
  - Rationale: Addresses installer/packaging advisories detected by `npm audit` (app-builder-lib/dmg-builder chain).
- Security outcome: `npm audit` now reports `found 0 vulnerabilities` after fixes.
- Packaging verification: `npm run dist:win` succeeds → installer at `release\CNCcostifyAI Setup-1.2.9.exe` with blockmap.

Commands used
```powershell
npm audit
npm audit fix
# bump devDependencies.electron to ^35.7.5
npm install
npm run dist:win
```

Maintenance notes
- Consider pinning versions without carets (`^`) for production stability policies.
- After security updates, re-validate packaging/install and test the Activation page (language switch/file selection).

---

## 📦 Customer Installation Note — Latest Version
- Latest installer version: `1.2.9` (2025‑10‑11)
- File location: `release\\CNCcostifyAI Setup-1.2.9.exe`
- SHA256 checksum: `4809247A0504773B26140E174F98C0F291120A902D7BF6A9D07C497A1040E1F5`

Standard installation steps (Windows)
- Double-click the installer → `NSIS` one‑click (no directory selection).
- Default mode: per‑user (`perMachine=false`); typical path: `%LocalAppData%\Programs\CNC Costify AI`
- Launch the app and open the Activation page to import the license file and choose the storage location (Roaming/ProgramData/Dev).

File authenticity verification
- Run PowerShell: `Get-FileHash -Algorithm SHA256 "release\\CNCcostifyAI Setup-1.2.9.exe"`
- Compare the output against the checksum above to ensure the file is unmodified.

Notes
- If Windows SmartScreen warns, choose “Run anyway” after confirming the source is trusted.
- Admins should publish the checksum via an independent channel (document/email) for customer verification.