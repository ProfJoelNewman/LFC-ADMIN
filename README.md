# LFC ADMIN — Life Fellowship Church Treasurer & Operations PWA

Secure mobile-installable Progressive Web App (PWA) and executive desktop dashboard built as a staff & treasurer extension of **[deltonanaz.com](https://deltonanaz.com)**.

## Key Features
- **Zero-Exposure Server-Side Auth Vault**: Entire dashboard is gated behind an admin passcode verified server-side via Google Apps Script (`ScriptProperties`). Zero passcodes or raw financial figures exist in client HTML, CSS, JS, or Service Worker caches.
- **Live Two-Way Google Sheets Sync**: Maps 1:1 to every weekly Friday tab (`Oct 30` &rarr; `Feb 26` + **New Friday Tab** cloner) in `Weekly Treasurer Meeting Breakdown` (`1GHBm-XbHH04f4CfpogAdPxg90_WQrWe2LzaJKBVTiY4`).
- **Strict Formula Protection**: Distinguishes editable yellow input cells and checklist toggles from auto-calculated formula cells — spreadsheet formulas are **never** overwritten.
- **Installable Standalone Mobile App & Executive Print Summary**:
  - `manifest.json` + maskable/standard/Apple Touch 3D Shield icons + `sw.js` static shell cache.
  - `0px` horizontal overflow across `390x844` mobile and `1440x900` desktop viewports.
  - Dedicated `@media print` Friday Meeting executive summary sheet.

## Project Structure
- `index.html`, `css/app.css`, `js/config.js`, `js/calc-engine.js`, `js/app.js` — PWA frontend
- `manifest.json`, `sw.js`, `icons/` — Standalone PWA manifest, Service Worker, and 3D Shield icons
- `apps-script/Code.gs`, `apps-script/DEPLOY_APPS_SCRIPT.md` — Companion Google Apps Script Web App (`doGet` / `doPost`)
- `scripts/generate_icons.py`, `scripts/deploy_github_api.py` — Build & deployment utilities
