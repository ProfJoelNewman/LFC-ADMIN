# Google Apps Script v2.0 Deployment Guide (`Code.gs`)

This Apps Script Web App powers secure authentication, Super Admin user provisioning, server-side RBAC, Google Drive camera photo filing, and self-calculating Month-End / Nazarene APR sync across your **LFC Church Management System Vault** (`1rC8JBoNYpnHXL7syzfEJu0ceGNaSJV_e`).

---

## Pre-Bound Google Drive Vault IDs (Already Configured in `Code.gs`)
- **Master Folder (`LFC Church Management System Vault`)**: `1rC8JBoNYpnHXL7syzfEJu0ceGNaSJV_e`
- **`01_LFC_System_Auth_&_Audit`**: `1VtjGMLeDGWTi08N0ZpvF_m3m-xqnoedD0xmHsT7dT84`
- **`02_LFC_People_Events_&_Attendance`**: `1Nd4lihSEUhE1n4ftbDPAb7xkQW6EF9rs3o8Ptn8_iuA`
- **`03_LFC_Worship_&_Scheduling`**: `1KjpCYqQJynJF_E0ilETfVtP47vV2QLjBFFCuYuNdEZ4`
- **`04_LFC_Giving_Accounting_&_Cash`**: `1YIjfew_kXYjyw2AE7jK-IpLdZojIEF_bVNET9IXRHyk`

---

## 2-Minute Setup Steps

1. **Open Apps Script from `01_LFC_System_Auth_&_Audit`**:
   - Open `01_LFC_System_Auth_&_Audit` inside your **LFC Church Management System Vault** folder in Google Drive.
   - Click **Extensions** &rarr; **Apps Script**.
2. **Paste `apps-script/Code.gs`**:
   - Replace the contents of `Code.gs` with `apps-script/Code.gs` and click **Save** (`Ctrl+S`).
3. **(Optional) Set Custom Super Admin Password & Integration Keys**:
   - Click **Project Settings** (gear icon &#9881;) &rarr; **Script Properties**:
     - `INITIAL_SUPERADMIN_PASSWORD`: *(Optional — set your custom password, then run `setupVaultAndSuperAdmin()` once in the toolbar to hash it and delete the plaintext property automatically!)*
     - `STRIPE_SECRET_KEY`: *(When ready for live Stripe Online Giving)*
     - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`: *(When ready for live Twilio SMS invites)*
     - `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ACCESS_TOKENS_JSON`: *(When ready for live Plaid bank sync)*
4. **Deploy as HTTPS Web App**:
   - Click **Deploy** &rarr; **New deployment** &rarr; **Web app**:
     - **Execute as**: `Me`
     - **Who has access**: `Anyone` *(Required so CORS-free `fetch` requests from `deltonanaz.com/admin-use` reach `doPost()`, where salted SHA-256 credentials & RBAC tokens are verified before any data is returned).*
   - Copy the **`https://script.google.com/macros/s/.../exec`** URL and paste it into `js/config.js` (`defaultGasWebAppUrl`) or the **Google Drive Vault Sync Endpoint** drawer on the login card.
