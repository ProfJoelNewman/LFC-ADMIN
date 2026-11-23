/**
 * LFC HUB (CHMS v2.1) — Public Structural Client Configuration
 * Leadership Roster:
 * - Super Admins: Pastor Joel Newman & Church Board Secretary Yaresly Godwin
 * - Church Treasurer: Dee "Huney" Huchton
 * - Worship Leader & Area Head: Wayne Crev (Wayne Crevoiserat)
 * - Church Board Member: Patricia Babb
 * - Children's Helper: Sarah Gulick
 */
window.LFC_CHMS_CONFIG = {
  appName: 'LFC Hub',
  churchName: 'Life Fellowship Church of the Nazarene',
  churchAddress: '1420 Courtland Blvd, Deltona, FL 32738',
  churchPhone: '(386) 574-7828',
  churchSiteUrl: 'https://www.deltonanaz.com',
  wordpressAdminUrl: 'https://www.deltonanaz.com/admin-use/',
  version: '2.1.0',

  // Paste deployed Google Apps Script Web App /exec URL here (or save via login drawer)
  defaultGasWebAppUrl: '',

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
      { key: 'MONTH_END_PDFS', label: '15_Month_End_PDF_Archives', id: '1C0xRVDHaLaU-OzCQJES-vOUq4FAdvGfY' },
      { key: 'CHURCHTRAC_DROPZONE', label: '16_ChurchTrac_Imports_Dropzone', id: '1qSUCWiupvYBP9RxO_i7BXTzYvAxOsdv-' }
    ]
  },

  rolePresets: {
    super_admin: {
      label: 'Super Admin (Pastor & Board Secretary)',
      badge: 'SUPER ADMIN',
      defaultModules: ['*'],
      defaultScopes: ['*']
    },
    treasurer: {
      label: 'Church Treasurer (Dee "Huney" Huchton)',
      badge: 'TREASURER',
      defaultModules: ['dashboard', 'giving', 'accounting', 'friday', 'reports'],
      defaultScopes: ['All Financial']
    },
    board_member: {
      label: 'Church Board Member',
      badge: 'CHURCH BOARD',
      defaultModules: ['dashboard', 'reports', 'schedules_my'],
      defaultScopes: ['Church Board']
    },
    worship_leader: {
      label: 'Worship Leader & Area Head (Wayne Crev)',
      badge: 'WORSHIP HEAD',
      defaultModules: ['dashboard', 'worship', 'worship_stage', 'events', 'schedules'],
      defaultScopes: ['Sunday Worship', 'Audio Visual']
    },
    worship_team: {
      label: 'Worship / AV Team Member',
      badge: 'WORSHIP TEAM',
      defaultModules: ['dashboard', 'worship_stage', 'schedules_my'],
      defaultScopes: ['Sunday Worship', 'Audio Visual']
    },
    ministry_helper: {
      label: "Ministry Helper (e.g. Children's Helper)",
      badge: 'HELPER',
      defaultModules: ['dashboard', 'attendance', 'schedules_my'],
      defaultScopes: ['Children']
    },
    offering_counter: {
      label: 'Offering Counter',
      badge: 'COUNTER',
      defaultModules: ['dashboard', 'giving_batch_entry'],
      defaultScopes: ['Sunday Worship']
    }
  },

  pilotTesters: [
    { key: 'joel', username: 'PastorJoel', fullName: 'Pastor Joel Newman', role: 'super_admin', scopes: ['*'], area: 'Lead Pastor • Full System & Pilot Feedback' },
    { key: 'yaresly', username: 'yaresly.godwin', fullName: 'Yaresly Godwin', role: 'super_admin', scopes: ['*'], area: 'Church Board Secretary • Full Super Admin' },
    { key: 'huney', username: 'huney.treasurer', fullName: 'Dee "Huney" Huchton', role: 'treasurer', scopes: ['All Financial'], area: 'Church Treasurer • Accounting, AP & Friday Cash' },
    { key: 'wayne', username: 'wayne.worship', fullName: 'Wayne Crev', role: 'worship_leader', scopes: ['Sunday Worship', 'Audio Visual'], area: 'Worship Leader & Area Head • Outlines, Songs & AV' },
    { key: 'patricia', username: 'patricia.board', fullName: 'Patricia Babb', role: 'board_member', scopes: ['Church Board'], area: 'Church Board Member • Month-End & APR Reports' },
    { key: 'sarah', username: 'sarah.kids', fullName: 'Sarah Gulick', role: 'ministry_helper', scopes: ['Children'], area: "Children's Helper • Kids Check-In & Attendance Only" }
  ],

  allMinistryScopes: [
    'Sunday Worship',
    'Children',
    'Sunday School',
    'Celebrate Recovery',
    'SHIELD Ministry',
    'Audio Visual',
    'Church Board'
  ],

  allModuleOptions: [
    { id: 'dashboard', label: 'Today Home' },
    { id: 'people', label: 'People Directory & Households' },
    { id: 'attendance', label: '1-Tap Attendance & Check-In' },
    { id: 'visitors', label: 'Visitor & Connect Cards' },
    { id: 'worship', label: 'Worship Outlines & Song Library' },
    { id: 'worship_stage', label: 'Stage ChordPro & Capo View' },
    { id: 'schedules', label: 'Helper Scheduling & SMS Invites' },
    { id: 'schedules_my', label: 'My Serving Dates' },
    { id: 'giving_batch_entry', label: 'Offering Batch Counter Only' },
    { id: 'giving', label: 'Full Giving & IRS Statements' },
    { id: 'accounting', label: 'Accounting, Transfers, AP & Feeds' },
    { id: 'friday', label: 'Friday Treasurer Cash Matrix' },
    { id: 'reports', label: 'Month-End & Nazarene APR Reports' }
  ]
};
