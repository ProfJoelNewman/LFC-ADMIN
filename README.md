# LFC Ministry Hub (CHMS v2.0) — WordPress + GitHub Pages + Google Drive Vault

Mobile-first Church Management System built for **Life Fellowship Church of the Nazarene** ([deltonanaz.com](https://www.deltonanaz.com)) and **SHIELD Christian Academy** on a \$0/month 3-system stack:

1. **WordPress Front Door (`deltonanaz.com/admin-use`)**: Ministry helpers and staff sign in from the existing website tab (or install as a standalone phone app), with ready-to-embed public congregation (`?view=connect`) and worship stage (`?view=worship`) portals.
2. **Behind-the-Scenes Google Drive Vault (`LFC Church Management System Vault`)**:
   - **4 Partitioned Google Sheets Workbooks**:
     - `01_LFC_System_Auth_&_Audit` *(Super Admin Exclusive — Salted SHA-256 credentials, sessions, RBAC scopes & audit log)*
     - `02_LFC_People_Events_&_Attendance` *(Includes locked `REPORT_Monthly_Attendance` & `REPORT_Visitors_&_APR_Growth` self-calculating tabs)*
     - `03_LFC_Worship_&_Scheduling` *(Includes ChordPro library, outlines, helper schedules & `REPORT_Worship_&_Helpers`)*
     - `04_LFC_Giving_Accounting_&_Cash` *(Includes 4 bank accounts, 5 true funds, AP Bills, Plaid/CSV feeds, Friday Matrix & locked `REPORT_Monthly_Giving` + `REPORT_Fund_&_Budget_Health`)*
   - **6 Auto-Filed Attachment Subfolders**: `10_AP_Bills`, `11_Offering_Count_Sheets`, `12_Expense_&_InKind_Receipts`, `13_Visitor_&_Connect_Card_Scans`, `14_Worship_Chord_&_Lead_Sheets`, `15_Month_End_PDF_Archives`.
3. **Google Apps Script RBAC & Sync Gateway (`apps-script/Code.gs`)**: Enforces unique per-helper credentials, Super Admin user provisioning, ministry-scoped reads/writes, and Strict Formula Protection on all `REPORT_*` tabs.
