# Changelog

All notable changes to this project will be documented in this file.

## [5.13.0] - 2026-06-17

- **PDF/JPG stability:** Pin Babel JSX to the classic React runtime so `/aey` no longer becomes blank when the unpinned Babel CDN changes its default runtime.
- **Release identity:** Align Desktop, installer, backend log, website labels, and version metadata on CNC Costify AI V5.13.
- **Compatibility:** Preserve the existing V5.12 cache, image resize, connection pre-warm, ETA, and parallel batch processing behavior.

## [3.0.0] - 2026-03-01

- **Major Update**: Reorganized project structure and updated documentation.
- **File Support**: Discontinued support for .x_t (Parasolid) files due to licensing constraints. The system now exclusively supports .STEP/.STP files for precise 3D geometric analysis.
- **Documentation**: Updated `CNC Costify AI 2027.MD` and `INSTALL.md` to reflect current architecture and installation procedures.
- **Backend**: Streamlined `server.py` to focus on OpenCASCADE STEP processing.
- **Frontend**: Cleaned up file upload interface to remove misleading .x_t options.

## [1.3.0] - 2025-10-29

- UI: Separated AI Chat from License Management; License page now focuses solely on licensing functions.
- UI: Added Users & Rights section with search and status filter (Active/Grace/Expired/Revoked).
- API: Introduced `/api/license/users` endpoint serving user-license assignments from `license_users.json`.
- Docs: Added `docs/License_Management_User_Guide_th.md` detailing usage and testing steps.

### Preview & Tests
- Open `http://localhost:5000/` and click the `สิทธิ์การใช้งาน` tab.
- Verify no chat components appear within the License page.
- Test importing license files and refreshing status.
- Use search and filter to validate the Users & Rights list works and fits the viewport without scrollbars.

## [1.2.9] - 2025-10-11

- Security: Upgrade `electron` devDependency from `^31.0.0` to `^35.7.5` to mitigate ASAR Integrity Bypass (`GHSA-vmqv-hx8q-j7mg`).
- Security: Update `electron-builder` toolchain within `^24.x`; effective build version observed `24.13.3`.
- Build: Verified `npm run dist:win` succeeds; installer produced at `release\\CNCcostifyAI Setup-1.2.9.exe`.
- Docs: Update `Electron_Offline_License_System.md` and `Electron_Offline_License_System_EN.md` with a Dependencies & Security Update Log.
- UI: Activation page aligned with V6 theme; added logo bar and TH/EN language switch; file picker and install location options now localized.

### Commands
```
npm audit
npm audit fix
npm install
npm run dist:win
```

### Status
- `npm audit` reports `found 0 vulnerabilities` after updates.
