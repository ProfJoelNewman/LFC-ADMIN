# Google Apps Script Companion Setup (`Code.gs`)

This Apps Script Web App powers secure, two-way live sync between **LFC ADMIN** and the **Weekly Treasurer Meeting Breakdown** workbook (`1GHBm-XbHH04f4CfpogAdPxg90_WQrWe2LzaJKBVTiY4`) in the Three Amigos Google Drive folder.

## Security Model
- **Zero Client Secrets**: The admin passcode is **never** stored in client HTML/JS or in this repository.
- **Server-Side Gate**: Every `doGet` and `doPost` action (`verify`, `init`, `getTab`, `saveTab`, `duplicateTab`) verifies the submitted passcode in constant time against `PropertiesService.getScriptProperties().getProperty('LFC_ADMIN_PASSCODE')`.
- **Formula Integrity**: White auto-calculated formula cells (`C6`, `C7`, `B11:F11`, `C18`, `C26`, `C38:C40`, `C44:F47`, `F48`, `C49:F51`, `C65:D65`) are strictly guarded server-side and can **never** be overwritten.

---

## 2-Minute Deployment Steps

1. **Open Apps Script from the Workbook**:
   - Open [Weekly Treasurer Meeting Breakdown](https://docs.google.com/spreadsheets/d/1GHBm-XbHH04f4CfpogAdPxg90_WQrWe2LzaJKBVTiY4/edit).
   - Click **Extensions** &rarr; **Apps Script**.
2. **Paste `Code.gs`**:
   - Replace the contents of `Code.gs` in the Apps Script editor with `apps-script/Code.gs` from this repository and click **Save** (`Ctrl+S`).
3. **Configure `ScriptProperties` Secret**:
   - In the left sidebar of Apps Script, click **Project Settings** (gear icon &#9881;).
   - Scroll down to **Script Properties** &rarr; click **Add script property**:
     - **Property**: `LFC_ADMIN_PASSCODE`
     - **Value**: *(Enter the church admin passcode)*
   - Click **Save script properties**.
4. **Deploy as HTTPS Web App**:
   - Click **Deploy** (top right) &rarr; **New deployment**.
   - Click the gear icon next to "Select type" &rarr; choose **Web app**.
   - Set:
     - **Description**: `LFC ADMIN Live Sheet Sync v1.0`
     - **Execute as**: `Me`
     - **Who has access**: `Anyone` *(Required so CORS-free HTTPS `fetch` requests from `github.io` / `deltonanaz.com` reach `doPost`, where `verifyPasscode_()` enforces the passcode before touching any sheet data).*
   - Click **Deploy**, authorize spreadsheet access when prompted, and copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`).
5. **Connect to LFC ADMIN**:
   - Paste the Web App `/exec` URL into `js/config.js` (`defaultGasWebAppUrl`), **or** open LFC ADMIN with `?api=<YOUR_EXEC_URL>` once on any phone/desktop to save it automatically.
