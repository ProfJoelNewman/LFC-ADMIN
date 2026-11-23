# LFC Ministry Hub (CHMS v2.1) — WordPress + GitHub Pages + Google Drive Vault

Mobile-first Church Management System built for **Life Fellowship Church of the Nazarene** ([deltonanaz.com](https://www.deltonanaz.com)) and **SHIELD Christian Academy** on a $0/month 3-system stack:

1. **WordPress Front Door (`deltonanaz.com/admin-use`) & Phone Home-Screen PWA**:
   - Ministry leaders, Board members, Treasurer, and helpers sign in from the website tab or install **LFC Hub** directly to their iPhone (Safari) or Android (Chrome) Home Screen.
   - **Pilot Team Quick-Install Links (`?pilot=joel|yaresly|huney|wayne|patricia|sarah`)**: Lets designated leaders install the app on their phone, test their exact scoped workflow, and tap the floating **💬 Suggest Change** button on any screen to log feedback directly into `Pilot_Feedback_Log` in Google Drive.
   - Ready-to-embed public congregation (`?view=connect`), musician worship stage (`?view=worship`), and 1-tap Twilio SMS RSVP (`?rsvp=...`) views.
2. **Behind-the-Scenes Google Drive Vault (`LFC Church Management System Vault`)**:
   - **4 Partitioned Google Sheets Workbooks** (pre-migrated with ChurchTrac Households, Directory, Attendance, Contributions & Bank Statements):
     - `01_LFC_System_Auth_&_Audit` *(Super Admin Exclusive — Salted SHA-256 credentials, `Pilot_Feedback_Log`, sessions, RBAC scopes & audit log)*
     - `02_LFC_People_Events_&_Attendance` *(Includes locked `REPORT_Monthly_Attendance` & `REPORT_Visitors_&_APR_Growth` self-calculating tabs)*
     - `03_LFC_Worship_&_Scheduling` *(Includes ChordPro + Guitar Capo library, service outlines, helper schedules & `REPORT_Worship_&_Helpers`)*
     - `04_LFC_Giving_Accounting_&_Cash` *(Includes 4 bank accounts, 5 true funds with `$0.00` GL drift, Atomic Bank/Fund Transfers, Printable IRS Pub 1771 Donor Statements, AP Bills, Plaid/CSV feeds, Friday Cash Matrix & locked `REPORT_Monthly_Giving` with WEF 5% + District 8% apportionments)*
   - **7 Auto-Filed Attachment & Dropzone Subfolders**: `10_AP_Bills_&_Vendor_Invoices`, `11_Offering_Count_Sheets`, `12_Expense_&_InKind_Receipts`, `13_Visitor_&_Connect_Card_Scans`, `14_Worship_Chord_&_Lead_Sheets`, `15_Month_End_PDF_Archives`, `16_ChurchTrac_Imports_Dropzone`.
3. **Google Apps Script RBAC & Sync Gateway (`apps-script/Code.gs`)**:
   - Enforces unique salted `SHA-256` per-user credentials, Super Admin provisioning (Lead Pastor & Church Board Secretary), report-only Church Board role, scoped Children's Helper check-in, Treasurer workflows, and Strict Formula Protection on all `REPORT_*` tabs.
