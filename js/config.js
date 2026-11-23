/**
 * LFC CHMS v2.0 — Public Structural Client Configuration
 *
 * SECURITY GUARANTEE:
 * - Zero plaintext passwords, API keys, or private church member records exist in client JS.
 * - All real logins, RBAC checks, and Google Sheet reads/writes execute server-side in Google Apps Script.
 */
window.LFC_CHMS_CONFIG = {
  appName: 'LFC Hub',
  churchName: 'Life Fellowship Church of the Nazarene',
  churchShortName: 'Life Fellowship Church',
  churchSiteUrl: 'https://www.deltonanaz.com',
  wordpressAdminUrl: 'https://www.deltonanaz.com/admin-use/',
  version: '2.0.0',

  // Paste your deployed Unified Google Apps Script v2.0 Web App /exec URL here (or save via UI drawer)
  defaultGasWebAppUrl: '',

  // Behind-the-Scenes Google Drive Vault ("LFC Church Management System Vault")
  vault: {
    folderId: '1rC8JBoNYpnHXL7syzfEJu0ceGNaSJV_e',
    folderUrl: 'https://drive.google.com/drive/folders/1rC8JBoNYpnHXL7syzfEJu0ceGNaSJV_e',
    workbooks: {
      auth: {
        name: '01_LFC_System_Auth_&_Audit',
        id: '1VtjGMLeDGWTi08N0ZpvF_m3m-xqnoedD0xmHsT7dT84',
        url: 'https://docs.google.com/spreadsheets/d/1VtjGMLeDGWTi08N0ZpvF_m3m-xqnoedD0xmHsT7dT84/edit'
      },
      people: {
        name: '02_LFC_People_Events_&_Attendance',
        id: '1Nd4lihSEUhE1n4ftbDPAb7xkQW6EF9rs3o8Ptn8_iuA',
        url: 'https://docs.google.com/spreadsheets/d/1Nd4lihSEUhE1n4ftbDPAb7xkQW6EF9rs3o8Ptn8_iuA/edit'
      },
      worship: {
        name: '03_LFC_Worship_&_Scheduling',
        id: '1KjpCYqQJynJF_E0ilETfVtP47vV2QLjBFFCuYuNdEZ4',
        url: 'https://docs.google.com/spreadsheets/d/1KjpCYqQJynJF_E0ilETfVtP47vV2QLjBFFCuYuNdEZ4/edit'
      },
      finance: {
        name: '04_LFC_Giving_Accounting_&_Cash',
        id: '1YIjfew_kXYjyw2AE7jK-IpLdZojIEF_bVNET9IXRHyk',
        url: 'https://docs.google.com/spreadsheets/d/1YIjfew_kXYjyw2AE7jK-IpLdZojIEF_bVNET9IXRHyk/edit'
      }
    },
    subfolders: [
      { key: 'AP_BILLS', label: '10_AP_Bills_&_Vendor_Invoices', id: '1bb_kncBuWI3CTHeaSiNHbBaYeS5QbVFH' },
      { key: 'COUNT_SHEETS', label: '11_Offering_Count_Sheets', id: '1SO_Ea6jNnoBVtLyPsP8pwpltefbMY5b_' },
      { key: 'RECEIPTS', label: '12_Expense_&_InKind_Receipts', id: '1Q0JGOEupY6gubT78NTWy-QQKZlMKlhUi' },
      { key: 'VISITOR_SCANS', label: '13_Visitor_&_Connect_Card_Scans', id: '1W65fpiV2EX6Zrg1SyrkX-jGEa_wQ4PVn' },
      { key: 'WORSHIP_CHORDS', label: '14_Worship_Chord_&_Lead_Sheets', id: '1feqF2lCtZcwEhJ_8u2IvJtYCVoSGPfiy' },
      { key: 'MONTH_END_PDFS', label: '15_Month_End_PDF_Archives', id: '1C0xRVDHaLaU-OzCQJES-vOUq4FAdvGfY' }
    ]
  },

  rolePresets: {
    super_admin: {
      label: 'Super Admin (Lead Pastor)',
      badge: 'SUPER ADMIN',
      defaultModules: ['*'],
      defaultScopes: ['*']
    },
    treasurer: {
      label: 'Treasurer / Bookkeeper',
      badge: 'TREASURER',
      defaultModules: ['dashboard', 'giving', 'accounting', 'friday', 'reports'],
      defaultScopes: ['All Financial']
    },
    offering_counter: {
      label: 'Offering Counter',
      badge: 'COUNTER',
      defaultModules: ['dashboard', 'giving_batch_entry'],
      defaultScopes: ['Sunday Worship']
    },
    worship_leader: {
      label: 'Worship Planner',
      badge: 'WORSHIP LEAD',
      defaultModules: ['dashboard', 'worship', 'events', 'schedules'],
      defaultScopes: ['Sunday Worship', 'Audio Visual']
    },
    worship_team: {
      label: 'Worship / AV Musician',
      badge: 'WORSHIP TEAM',
      defaultModules: ['dashboard', 'worship_stage', 'schedules_my'],
      defaultScopes: ['Sunday Worship', 'Audio Visual']
    },
    ministry_helper: {
      label: 'Ministry Helper / Teacher',
      badge: 'HELPER',
      defaultModules: ['dashboard', 'attendance', 'visitors', 'schedules_my'],
      defaultScopes: ['Celebrate Recovery']
    }
  },

  allMinistryScopes: [
    'Sunday Worship',
    'Sunday School',
    'Celebrate Recovery',
    'SHIELD Ministry',
    'Children',
    'Audio Visual',
    'Leadership'
  ],

  allModuleOptions: [
    { id: 'dashboard', label: 'Today Home' },
    { id: 'attendance', label: '1-Tap Attendance & Check-In' },
    { id: 'visitors', label: 'Visitor & Connect Cards' },
    { id: 'worship', label: 'Worship Outlines & Song Library' },
    { id: 'worship_stage', label: 'Musician Stage ChordPro View' },
    { id: 'schedules', label: 'Helper Scheduling & SMS Invites' },
    { id: 'schedules_my', label: 'My Serving Dates' },
    { id: 'giving_batch_entry', label: 'Offering Batch Counter Only' },
    { id: 'giving', label: 'Full Giving & Tax Statements' },
    { id: 'accounting', label: 'Accounting, AP Bills & Bank Feeds' },
    { id: 'friday', label: 'Friday Treasurer Cash Matrix' },
    { id: 'reports', label: 'Month-End & APR Self-Calc Reports' }
  ]
};
