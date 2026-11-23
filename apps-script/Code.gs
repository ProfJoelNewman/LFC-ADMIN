/**
 * ============================================================================
 * LIFE FELLOWSHIP CHURCH — UNIFIED CHMS GOOGLE APPS SCRIPT GATEWAY (v2.0)
 * ============================================================================
 * 3-System Stack: WordPress (deltonanaz.com) + GitHub Pages PWA + Google Drive
 *
 * BOUND GOOGLE DRIVE VAULT ("LFC Church Management System Vault"):
 * - Master Vault Folder:              1rC8JBoNYpnHXL7syzfEJu0ceGNaSJV_e
 * - 01_LFC_System_Auth_&_Audit:       1VtjGMLeDGWTi08N0ZpvF_m3m-xqnoedD0xmHsT7dT84
 * - 02_LFC_People_Events_&_Attendance:1Nd4lihSEUhE1n4ftbDPAb7xkQW6EF9rs3o8Ptn8_iuA
 * - 03_LFC_Worship_&_Scheduling:      1KjpCYqQJynJF_E0ilETfVtP47vV2QLjBFFCuYuNdEZ4
 * - 04_LFC_Giving_Accounting_&_Cash:  1YIjfew_kXYjyw2AE7jK-IpLdZojIEF_bVNET9IXRHyk
 *
 * SECURITY GUARANTEES:
 * 1. Salted SHA-256 per-user password hashing in 01_LFC_System_Auth_&_Audit.
 * 2. 256-bit random Bearer session tokens stored as SHA-256 hashes (12h/7d TTL).
 * 3. Server-enforced Role-Based Access Control (RBAC) & Ministry Scope filtering.
 * 4. Strict Formula Guard: Read-only `REPORT_*` tabs can NEVER be overwritten.
 * 5. External API secrets (Twilio, Stripe, Plaid) live ONLY in ScriptProperties.
 */

const VAULT_IDS = {
  ROOT_FOLDER: '1rC8JBoNYpnHXL7syzfEJu0ceGNaSJV_e',
  WB01_AUTH: '1VtjGMLeDGWTi08N0ZpvF_m3m-xqnoedD0xmHsT7dT84',
  WB02_PEOPLE: '1Nd4lihSEUhE1n4ftbDPAb7xkQW6EF9rs3o8Ptn8_iuA',
  WB03_WORSHIP: '1KjpCYqQJynJF_E0ilETfVtP47vV2QLjBFFCuYuNdEZ4',
  WB04_FINANCE: '1YIjfew_kXYjyw2AE7jK-IpLdZojIEF_bVNET9IXRHyk',
  LEGACY_FRIDAY: '1GHBm-XbHH04f4CfpogAdPxg90_WQrWe2LzaJKBVTiY4',
  FOLDERS: {
    AP_BILLS: '1bb_kncBuWI3CTHeaSiNHbBaYeS5QbVFH',
    COUNT_SHEETS: '1SO_Ea6jNnoBVtLyPsP8pwpltefbMY5b_',
    RECEIPTS: '1Q0JGOEupY6gubT78NTWy-QQKZlMKlhUi',
    VISITOR_SCANS: '1W65fpiV2EX6Zrg1SyrkX-jGEa_wQ4PVn',
    WORSHIP_CHORDS: '1feqF2lCtZcwEhJ_8u2IvJtYCVoSGPfiy',
    MONTH_END_PDFS: '1C0xRVDHaLaU-OzCQJES-vOUq4FAdvGfY',
    CHURCHTRAC_DROPZONE: '1qSUCWiupvYBP9RxO_i7BXTzYvAxOsdv-'
  }
};

const ROLE_MODULES = {
  super_admin: ['*'],
  treasurer: ['dashboard', 'giving', 'accounting', 'reports', 'friday'],
  board_member: ['dashboard', 'reports', 'schedules_my'],
  offering_counter: ['dashboard', 'giving_batch_entry'],
  worship_leader: ['dashboard', 'worship', 'worship_stage', 'events', 'schedules'],
  worship_team: ['dashboard', 'worship_stage', 'schedules_my'],
  ministry_helper: ['dashboard', 'attendance', 'schedules_my']
};

/**
 * ONE-CLICK SUPER ADMIN SETUP HELPER (Run once inside Apps Script Editor if desired):
 * Authorizes Drive/Sheets/UrlFetch scopes and sets/rotates Pastor Joel's Super Admin password.
 */
function setupVaultAndSuperAdmin() {
  const props = PropertiesService.getScriptProperties();
  const overridePw = props.getProperty('INITIAL_SUPERADMIN_PASSWORD');
  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  const usersSheet = wb01.getSheetByName('Users');
  if (overridePw && overridePw.trim().length >= 8) {
    const salt = randomHex_(16);
    const hash = sha256Hex_(salt + ':' + overridePw.trim());
    const rows = usersSheet.getDataRange().getValues();
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][5]).trim() === 'super_admin') {
        usersSheet.getRange(r + 1, 9).setValue(salt);
        usersSheet.getRange(r + 1, 10).setValue(hash);
        usersSheet.getRange(r + 1, 11).setValue('No');
        break;
      }
    }
    props.deleteProperty('INITIAL_SUPERADMIN_PASSWORD');
  }
  DriveApp.getFolderById(VAULT_IDS.ROOT_FOLDER).getName();
  Logger.log('LFC CHMS Vault connected and authorized successfully.');
}

/**
 * HTTP GET Handler — Health check & public read fallback.
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = String(params.action || 'ping').trim();

    if (action === 'ping') {
      return jsonResponse_({
        ok: true,
        service: 'LFC-CHMS-VAULT-GATEWAY',
        version: '2.0.0',
        vaultFolderId: VAULT_IDS.ROOT_FOLDER,
        authMode: 'salted_sha256_rbac'
      });
    }

    if (action === 'publicBootstrap') {
      return jsonResponse_(handlePublicBootstrap_());
    }

    if (action === 'lookupRsvp') {
      return jsonResponse_(handleLookupRsvp_(String(params.token || '')));
    }

    return jsonResponse_({ ok: false, error: 'Use HTTPS POST for authenticated actions.' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: errMessage_(err) });
  }
}

/**
 * HTTP POST Handler — Accepts `text/plain;charset=utf-8` JSON (CORS preflight-free).
 */
function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const action = String(body.action || '').trim();

    // 1. Unauthenticated Public / Auth Endpoints
    if (action === 'ping') {
      return jsonResponse_({ ok: true, service: 'LFC-CHMS-VAULT-GATEWAY', version: '2.0.0' });
    }
    if (action === 'login') {
      return jsonResponse_(handleLogin_(body));
    }
    if (action === 'publicBootstrap') {
      return jsonResponse_(handlePublicBootstrap_());
    }
    if (action === 'submitConnectCard') {
      return jsonResponse_(withScriptLock_(() => handleSubmitConnectCard_(body, null)));
    }
    if (action === 'lookupRsvp') {
      return jsonResponse_(handleLookupRsvp_(String(body.token || '')));
    }
    if (action === 'respondRsvp') {
      return jsonResponse_(withScriptLock_(() => handleRespondRsvp_(body)));
    }
    if (action === 'createStripeCheckout') {
      return jsonResponse_(handleCreateStripeCheckout_(body));
    }
    if (action === 'submitPilotFeedback' && !body.sessionToken) {
      return jsonResponse_(withScriptLock_(() => handleSubmitPilotFeedback_(body, null)));
    }

    // 2. Authenticated Session Gate
    const session = verifySessionToken_(String(body.sessionToken || ''));
    if (!session.ok) {
      return jsonResponse_(session);
    }

    if (action === 'logout') {
      return jsonResponse_(withScriptLock_(() => handleLogout_(String(body.sessionToken || ''), session)));
    }
    if (action === 'changeOwnPassword') {
      return jsonResponse_(withScriptLock_(() => handleChangeOwnPassword_(body, session)));
    }
    if (action === 'bootstrapApp') {
      return jsonResponse_(handleBootstrapApp_(session, Boolean(body.forceRefresh)));
    }

    // 3. Super Admin Exclusive Provisioning Endpoints
    if (['listUsers', 'createUser', 'updateUserAccess', 'resetUserPassword', 'toggleUserActive'].indexOf(action) !== -1) {
      if (session.role !== 'super_admin') {
        return jsonResponse_({ ok: false, code: 'FORBIDDEN', error: 'Super Admin access required for user provisioning.' });
      }
      return jsonResponse_(withScriptLock_(() => handleSuperAdminAction_(action, body, session)));
    }

    // 4. Role-Gated Ministry & Financial Mutations
    if (action === 'recordAttendance') {
      requireModule_(session, ['attendance', 'events']);
      return jsonResponse_(withScriptLock_(() => handleRecordAttendance_(body, session)));
    }
    if (action === 'addVisitorCard') {
      requireModule_(session, ['visitors', 'attendance']);
      return jsonResponse_(withScriptLock_(() => handleSubmitConnectCard_(body, session)));
    }
    if (action === 'updateFollowUpStatus') {
      requireModule_(session, ['visitors', 'attendance']);
      return jsonResponse_(withScriptLock_(() => handleUpdateFollowUp_(body, session)));
    }
    if (action === 'savePerson') {
      if (session.role !== 'super_admin') {
        return jsonResponse_({ ok: false, code: 'FORBIDDEN', error: 'Directory edits require Super Admin permission.' });
      }
      return jsonResponse_(withScriptLock_(() => handleSavePerson_(body, session)));
    }
    if (action === 'createGivingBatch') {
      requireModule_(session, ['giving', 'giving_batch_entry']);
      return jsonResponse_(withScriptLock_(() => handleCreateGivingBatch_(body, session)));
    }
    if (action === 'addContribution') {
      requireModule_(session, ['giving', 'giving_batch_entry']);
      return jsonResponse_(withScriptLock_(() => handleAddContribution_(body, session)));
    }
    if (action === 'lockGivingBatch') {
      requireModule_(session, ['giving', 'giving_batch_entry']);
      return jsonResponse_(withScriptLock_(() => handleLockGivingBatch_(body, session)));
    }
    if (action === 'createApBill') {
      requireModule_(session, ['accounting', 'friday']);
      return jsonResponse_(withScriptLock_(() => handleCreateApBill_(body, session)));
    }
    if (action === 'payApBill') {
      requireModule_(session, ['accounting', 'friday']);
      return jsonResponse_(withScriptLock_(() => handlePayApBill_(body, session)));
    }
    if (action === 'approveBankFeedItem') {
      requireModule_(session, ['accounting']);
      return jsonResponse_(withScriptLock_(() => handleApproveBankFeed_(body, session)));
    }
    if (action === 'importBankStatementRows') {
      requireModule_(session, ['accounting']);
      return jsonResponse_(withScriptLock_(() => handleImportBankRows_(body, session)));
    }
    if (action === 'plaidSync') {
      requireModule_(session, ['accounting']);
      return jsonResponse_(withScriptLock_(() => handlePlaidSync_(session)));
    }
    if (action === 'saveFridayMatrix') {
      requireModule_(session, ['accounting', 'friday']);
      return jsonResponse_(withScriptLock_(() => handleSaveFridayMatrix_(body, session)));
    }
    if (action === 'saveSong') {
      requireModule_(session, ['worship']);
      return jsonResponse_(withScriptLock_(() => handleSaveSong_(body, session)));
    }
    if (action === 'saveOutlineItem') {
      requireModule_(session, ['worship']);
      return jsonResponse_(withScriptLock_(() => handleSaveOutlineItem_(body, session)));
    }
    if (action === 'assignVolunteer') {
      requireModule_(session, ['worship', 'schedules']);
      return jsonResponse_(withScriptLock_(() => handleAssignVolunteer_(body, session)));
    }
    if (action === 'sendHelperSms') {
      requireModule_(session, ['worship', 'schedules']);
      return jsonResponse_(withScriptLock_(() => handleSendHelperSms_(body, session)));
    }
    if (action === 'uploadVaultFile') {
      return jsonResponse_(withScriptLock_(() => handleUploadVaultFile_(body, session)));
    }
    if (action === 'submitPilotFeedback') {
      return jsonResponse_(withScriptLock_(() => handleSubmitPilotFeedback_(body, session)));
    }
    if (action === 'updatePilotFeedbackStatus') {
      if (session.role !== 'super_admin') {
        return jsonResponse_({ ok: false, error: 'Super Admin required.' });
      }
      return jsonResponse_(withScriptLock_(() => handleUpdatePilotFeedbackStatus_(body, session)));
    }
    if (action === 'recordManualTransaction') {
      requireModule_(session, ['accounting']);
      return jsonResponse_(withScriptLock_(() => handleRecordManualTransaction_(body, session)));
    }
    if (action === 'recordAtomicTransfer') {
      requireModule_(session, ['accounting']);
      return jsonResponse_(withScriptLock_(() => handleRecordAtomicTransfer_(body, session)));
    }
    if (action === 'deleteOutlineItem') {
      requireModule_(session, ['worship']);
      return jsonResponse_(withScriptLock_(() => handleDeleteOutlineItem_(body, session)));
    }
    if (action === 'createCalendarEvent') {
      requireModule_(session, ['events', 'worship']);
      return jsonResponse_(withScriptLock_(() => handleCreateCalendarEvent_(body, session)));
    }
    if (action === 'bulkImportChurchTracCsv') {
      if (session.role !== 'super_admin' && session.role !== 'treasurer') {
        return jsonResponse_({ ok: false, error: 'Super Admin or Treasurer required for bulk CSV imports.' });
      }
      return jsonResponse_(withScriptLock_(() => handleBulkImportCsv_(body, session)));
    }

    return jsonResponse_({ ok: false, error: 'Unsupported action: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: errMessage_(err) });
  }
}

// ============================================================================
// AUTHENTICATION, RBAC & SUPER ADMIN PROVISIONING
// ============================================================================

function handleLogin_(body) {
  const identifier = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const rememberDays = body.rememberDevice ? 7 : 0.5; // 7 days or 12 hours

  if (!identifier || !password) {
    return { ok: false, code: 'AUTH_MISSING', error: 'Enter both your username/email and password.' };
  }

  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  const usersSh = wb01.getSheetByName('Users');
  const data = usersSh.getDataRange().getValues();

  let matchedRowIdx = -1;
  let userRow = null;
  for (let i = 1; i < data.length; i++) {
    const uname = String(data[i][1] || '').trim().toLowerCase();
    const email = String(data[i][3] || '').trim().toLowerCase();
    if (uname === identifier || (email && email === identifier)) {
      matchedRowIdx = i + 1;
      userRow = data[i];
      break;
    }
  }

  if (!userRow) {
    return { ok: false, code: 'AUTH_INVALID', error: 'Invalid username or password.' };
  }

  if (String(userRow[11] || 'Yes').trim().toLowerCase() !== 'yes') {
    return { ok: false, code: 'ACCOUNT_SUSPENDED', error: 'This account has been suspended by the Super Admin.' };
  }

  const salt = String(userRow[8] || '').trim();
  const expectedHash = String(userRow[9] || '').trim().toLowerCase();
  const candidateHash = sha256Hex_(salt + ':' + password);

  if (!expectedHash || !timingSafeEqual_(candidateHash, expectedHash)) {
    return { ok: false, code: 'AUTH_INVALID', error: 'Invalid username or password.' };
  }

  const rawToken = randomHex_(32);
  const tokenHash = sha256Hex_(rawToken);
  const now = new Date();
  const expires = new Date(now.getTime() + rememberDays * 24 * 60 * 60 * 1000);

  const sessSh = wb01.getSheetByName('Active_Sessions');
  sessSh.appendRow([
    tokenHash,
    userRow[0],
    userRow[1],
    userRow[5],
    now.toISOString(),
    expires.toISOString(),
    String(body.deviceInfo || 'Mobile/Web PWA').slice(0, 120),
    'No'
  ]);

  usersSh.getRange(matchedRowIdx, 13).setValue(now.toISOString());
  appendAudit_(wb01, userRow[1], userRow[5], 'LOGIN', 'auth', userRow[0], 'Signed in successfully');

  const profile = rowToUserProfile_(userRow);
  return {
    ok: true,
    sessionToken: rawToken,
    expiresAt: expires.toISOString(),
    user: profile
  };
}

function verifySessionToken_(rawToken) {
  if (!rawToken || rawToken.length < 32) {
    return { ok: false, code: 'SESSION_EXPIRED', error: 'Please sign in to continue.' };
  }
  const tokenHash = sha256Hex_(rawToken);
  const cache = CacheService.getScriptCache();
  const cached = cache.get('sess_' + tokenHash);
  if (cached) {
    return JSON.parse(cached);
  }

  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  const sessRows = wb01.getSheetByName('Active_Sessions').getDataRange().getValues();
  const nowIso = new Date().toISOString();

  let userId = '';
  for (let i = sessRows.length - 1; i >= 1; i--) {
    if (timingSafeEqual_(String(sessRows[i][0] || ''), tokenHash)) {
      if (String(sessRows[i][7] || 'No') === 'Yes' || String(sessRows[i][5] || '') < nowIso) {
        return { ok: false, code: 'SESSION_EXPIRED', error: 'Your session expired. Please sign in again.' };
      }
      userId = String(sessRows[i][1]);
      break;
    }
  }

  if (!userId) {
    return { ok: false, code: 'SESSION_INVALID', error: 'Session not recognized. Please sign in.' };
  }

  const userRows = wb01.getSheetByName('Users').getDataRange().getValues();
  for (let r = 1; r < userRows.length; r++) {
    if (String(userRows[r][0]) === userId) {
      if (String(userRows[r][11] || 'Yes').toLowerCase() !== 'yes') {
        return { ok: false, code: 'ACCOUNT_SUSPENDED', error: 'Account access has been paused.' };
      }
      const profile = rowToUserProfile_(userRows[r]);
      const sessionObj = Object.assign({ ok: true }, profile);
      cache.put('sess_' + tokenHash, JSON.stringify(sessionObj), 120);
      return sessionObj;
    }
  }

  return { ok: false, code: 'USER_NOT_FOUND', error: 'User profile not found.' };
}

function handleLogout_(rawToken, session) {
  const tokenHash = sha256Hex_(rawToken);
  CacheService.getScriptCache().remove('sess_' + tokenHash);
  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  const sh = wb01.getSheetByName('Active_Sessions');
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === tokenHash) {
      sh.getRange(i + 1, 8).setValue('Yes');
    }
  }
  appendAudit_(wb01, session.username, session.role, 'LOGOUT', 'auth', session.userId, 'Signed out');
  return { ok: true };
}

function handleChangeOwnPassword_(body, session) {
  const newPw = String(body.newPassword || '').trim();
  if (newPw.length < 8) {
    return { ok: false, error: 'New password must be at least 8 characters.' };
  }
  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  const sh = wb01.getSheetByName('Users');
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === session.userId) {
      const salt = randomHex_(16);
      const hash = sha256Hex_(salt + ':' + newPw);
      sh.getRange(i + 1, 9).setValue(salt);
      sh.getRange(i + 1, 10).setValue(hash);
      sh.getRange(i + 1, 11).setValue('No');
      appendAudit_(wb01, session.username, session.role, 'CHANGE_PASSWORD', 'auth', session.userId, 'Updated own password');
      return { ok: true };
    }
  }
  return { ok: false, error: 'User record not found.' };
}

function handleSuperAdminAction_(action, body, session) {
  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  const sh = wb01.getSheetByName('Users');
  const rows = sh.getDataRange().getValues();

  if (action === 'listUsers') {
    return { ok: true, users: listSafeUsers_(rows) };
  }

  if (action === 'createUser') {
    const uname = String(body.username || '').trim();
    const fullName = String(body.fullName || '').trim();
    const tempPw = String(body.tempPassword || '').trim();
    const role = String(body.role || 'ministry_helper').trim();
    if (!uname || !fullName || tempPw.length < 8) {
      return { ok: false, error: 'Username, full name, and temporary password (8+ chars) are required.' };
    }
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim().toLowerCase() === uname.toLowerCase()) {
        return { ok: false, error: 'Username "' + uname + '" already exists.' };
      }
    }
    const uid = 'usr_' + randomHex_(6);
    const salt = randomHex_(16);
    const hash = sha256Hex_(salt + ':' + tempPw);
    const modules = String(body.allowedModules || (ROLE_MODULES[role] || ['dashboard']).join(','));
    const scopes = String(body.ministryScopes || 'Sunday Worship');
    const nowIso = new Date().toISOString();

    sh.appendRow([
      uid,
      uname,
      fullName,
      String(body.email || '').trim(),
      String(body.phone || '').trim(),
      role,
      modules,
      scopes,
      salt,
      hash,
      body.mustChangePassword === false ? 'No' : 'Yes',
      'Yes',
      '',
      nowIso,
      session.username
    ]);
    appendAudit_(wb01, session.username, session.role, 'PROVISION_USER', 'users', uid, 'Created helper ' + uname + ' (' + role + ')');
    return { ok: true, userId: uid, users: listSafeUsers_(sh.getDataRange().getValues()) };
  }

  const targetId = String(body.userId || '').trim();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === targetId) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) {
    return { ok: false, error: 'Target user not found.' };
  }

  if (action === 'updateUserAccess') {
    const newRole = String(body.role || rows[rowIndex - 1][5]).trim();
    const newMods = String(body.allowedModules || (ROLE_MODULES[newRole] || ['dashboard']).join(','));
    const newScopes = String(body.ministryScopes || rows[rowIndex - 1][7]);
    sh.getRange(rowIndex, 6).setValue(newRole);
    sh.getRange(rowIndex, 7).setValue(newMods);
    sh.getRange(rowIndex, 8).setValue(newScopes);
    revokeUserSessions_(wb01, targetId);
    appendAudit_(wb01, session.username, session.role, 'UPDATE_USER_ACCESS', 'users', targetId, 'Updated role=' + newRole + ', scopes=' + newScopes);
    return { ok: true, users: listSafeUsers_(sh.getDataRange().getValues()) };
  }

  if (action === 'resetUserPassword') {
    const resetPw = String(body.tempPassword || '').trim();
    if (resetPw.length < 8) {
      return { ok: false, error: 'Temporary password must be at least 8 characters.' };
    }
    const salt = randomHex_(16);
    const hash = sha256Hex_(salt + ':' + resetPw);
    sh.getRange(rowIndex, 9).setValue(salt);
    sh.getRange(rowIndex, 10).setValue(hash);
    sh.getRange(rowIndex, 11).setValue('Yes');
    revokeUserSessions_(wb01, targetId);
    appendAudit_(wb01, session.username, session.role, 'RESET_USER_PASSWORD', 'users', targetId, 'Reset helper password');
    return { ok: true, users: listSafeUsers_(sh.getDataRange().getValues()) };
  }

  if (action === 'toggleUserActive') {
    if (targetId === session.userId) {
      return { ok: false, error: 'You cannot suspend your own Super Admin account.' };
    }
    const nextActive = body.active ? 'Yes' : 'No';
    sh.getRange(rowIndex, 12).setValue(nextActive);
    if (nextActive === 'No') {
      revokeUserSessions_(wb01, targetId);
    }
    appendAudit_(wb01, session.username, session.role, 'TOGGLE_USER_ACTIVE', 'users', targetId, 'Set Active=' + nextActive);
    return { ok: true, users: listSafeUsers_(sh.getDataRange().getValues()) };
  }

  return { ok: false, error: 'Unknown user management action.' };
}

// ============================================================================
// ROLE-SCOPED BOOTSTRAP & PUBLIC / MAGIC-LINK ENDPOINTS
// ============================================================================

function handleBootstrapApp_(session, forceRefresh) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'boot_v2_' + session.userId + '_' + session.role;
  if (!forceRefresh) {
    const hit = cache.get(cacheKey);
    if (hit) return JSON.parse(hit);
  }

  const payload = {
    ok: true,
    syncedAt: new Date().toISOString(),
    user: session,
    vaultLinks: {
      vaultFolder: 'https://drive.google.com/drive/folders/' + VAULT_IDS.ROOT_FOLDER,
      wb02People: 'https://docs.google.com/spreadsheets/d/' + getVaultId_('WB02_PEOPLE') + '/edit',
      wb03Worship: 'https://docs.google.com/spreadsheets/d/' + getVaultId_('WB03_WORSHIP') + '/edit',
      wb04Finance: 'https://docs.google.com/spreadsheets/d/' + getVaultId_('WB04_FINANCE') + '/edit'
    },
    reports: {},
    people: [],
    visitors: [],
    groups: [],
    events: [],
    attendanceSessions: [],
    pastoralTasks: [],
    songs: [],
    outlines: [],
    teamsRoles: [],
    schedules: [],
    givingBatches: [],
    contributions: [],
    bankAccounts: [],
    funds: [],
    coa: [],
    ledger: [],
    apBills: [],
    bankFeed: [],
    fridayMatrix: [],
    recurringSchedules: [],
    pilotFeedback: [],
    users: []
  };

  const isSuper = session.role === 'super_admin';
  const isBoard = session.role === 'board_member';

  // Workbook 02: People, Events, Attendance & Month-End Attendance/Visitor Rollups
  if (isSuper || isBoard || hasAnyModule_(session, ['attendance', 'visitors', 'events', 'schedules', 'schedules_my', 'giving', 'giving_batch_entry'])) {
    const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
    payload.events = sheetToObjects_(wb02.getSheetByName('Events_Calendar'));

    if (isSuper) {
      payload.reports.monthlyAttendance = readReportTable_(wb02.getSheetByName('REPORT_Monthly_Attendance'), 9, 22);
      payload.reports.visitorsApr = readReportTable_(wb02.getSheetByName('REPORT_Visitors_&_APR_Growth'), 9, 22);
      payload.people = sheetToObjects_(wb02.getSheetByName('People_Directory'));
      payload.visitors = sheetToObjects_(wb02.getSheetByName('Visitors_Connect'));
      payload.groups = sheetToObjects_(wb02.getSheetByName('Ministry_Groups'));
      payload.attendanceSessions = sheetToObjects_(wb02.getSheetByName('Attendance_Sessions'));
      payload.pastoralTasks = sheetToObjects_(wb02.getSheetByName('Pastoral_Care_Tasks'));
    } else if (isBoard) {
      // Church Board Member (e.g. Patricia Babb): Month-End/APR executive summaries only; zero Pastoral Notes or individual Giving!
      payload.reports.monthlyAttendance = readReportTable_(wb02.getSheetByName('REPORT_Monthly_Attendance'), 9, 22);
      payload.reports.visitorsApr = readReportTable_(wb02.getSheetByName('REPORT_Visitors_&_APR_Growth'), 9, 22);
    } else if (hasAnyModule_(session, ['attendance', 'visitors'])) {
      const allGroups = sheetToObjects_(wb02.getSheetByName('Ministry_Groups'));
      payload.groups = filterByMinistryScope_(allGroups, session.ministryScopes, ['Ministry_Category', 'Group_Name']);
      const allSessions = sheetToObjects_(wb02.getSheetByName('Attendance_Sessions'));
      payload.attendanceSessions = filterByMinistryScope_(allSessions, session.ministryScopes, ['Ministry_Category', 'Group_Name']);
      payload.visitors = filterByMinistryScope_(sheetToObjects_(wb02.getSheetByName('Visitors_Connect')), session.ministryScopes, ['Ministry_Source']);
      payload.people = sheetToObjects_(wb02.getSheetByName('People_Directory')).map(p => ({
        Person_ID: p.Person_ID,
        First_Name: p.First_Name,
        Last_Name: p.Last_Name,
        Member_Status: p.Member_Status,
        Age_Category: p.Age_Category,
        Mobile_Phone: p.Mobile_Phone
      }));
    } else if (hasAnyModule_(session, ['giving', 'giving_batch_entry', 'worship', 'schedules'])) {
      payload.people = sheetToObjects_(wb02.getSheetByName('People_Directory')).map(p => ({
        Person_ID: p.Person_ID,
        First_Name: p.First_Name,
        Last_Name: p.Last_Name,
        Mobile_Phone: p.Mobile_Phone,
        Email: p.Email
      }));
    }
  }

  // Workbook 03: Worship Songs, Outlines & Volunteer Schedules
  if (isSuper || hasAnyModule_(session, ['worship', 'worship_stage', 'schedules', 'schedules_my'])) {
    const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
    if (isSuper || hasAnyModule_(session, ['worship', 'worship_stage'])) {
      payload.songs = sheetToObjects_(wb03.getSheetByName('Songs_Library'));
      payload.outlines = sheetToObjects_(wb03.getSheetByName('Service_Outlines'));
      payload.teamsRoles = sheetToObjects_(wb03.getSheetByName('Volunteer_Teams_Roles'));
    }
    const allSched = sheetToObjects_(wb03.getSheetByName('Volunteer_Schedules'));
    if (isSuper || hasAnyModule_(session, ['worship', 'schedules'])) {
      payload.schedules = allSched;
    } else {
      payload.schedules = allSched.filter(s =>
        String(s.Helper_Username || '').toLowerCase() === String(session.username || '').toLowerCase() ||
        String(s.Helper_Name || '').toLowerCase().indexOf(session.fullName.split(' ')[0].toLowerCase()) !== -1
      );
    }
  }

  // Workbook 04: Giving, Accounting, AP Bills, Bank Feeds & Month-End Financial Rollups
  if (isSuper || isBoard || hasAnyModule_(session, ['giving', 'giving_batch_entry', 'accounting', 'reports', 'friday'])) {
    const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
    payload.coa = sheetToObjects_(wb04.getSheetByName('Chart_of_Accounts'));
    payload.funds = sheetToObjects_(wb04.getSheetByName('Funds'));

    if (session.role === 'offering_counter') {
      const openBatches = sheetToObjects_(wb04.getSheetByName('Giving_Batches')).filter(b => String(b.Locked) !== 'Yes');
      const openIds = openBatches.map(b => b.Batch_ID);
      payload.givingBatches = openBatches;
      payload.contributions = sheetToObjects_(wb04.getSheetByName('Contributions')).filter(c => openIds.indexOf(c.Batch_ID) !== -1);
    } else if (isBoard) {
      // Board Member sees aggregate monthly giving, WEF/District apportionments, and Bank/Fund balances — NEVER individual donor names!
      payload.reports.monthlyGiving = readReportTable_(wb04.getSheetByName('REPORT_Monthly_Giving'), 9, 22);
      payload.reports.bankHealth = readReportTable_(wb04.getSheetByName('REPORT_Fund_&_Budget_Health'), 5, 10);
      payload.reports.fundHealth = readReportTable_(wb04.getSheetByName('REPORT_Fund_&_Budget_Health'), 13, 19);
      payload.bankAccounts = sheetToObjects_(wb04.getSheetByName('Bank_Accounts'));
      payload.apBills = sheetToObjects_(wb04.getSheetByName('AP_Bills_Inbox'));
    } else {
      payload.reports.monthlyGiving = readReportTable_(wb04.getSheetByName('REPORT_Monthly_Giving'), 9, 22);
      payload.reports.bankHealth = readReportTable_(wb04.getSheetByName('REPORT_Fund_&_Budget_Health'), 5, 10);
      payload.reports.fundHealth = readReportTable_(wb04.getSheetByName('REPORT_Fund_&_Budget_Health'), 13, 19);
      payload.givingBatches = sheetToObjects_(wb04.getSheetByName('Giving_Batches'));
      payload.contributions = sheetToObjects_(wb04.getSheetByName('Contributions'));
      payload.bankAccounts = sheetToObjects_(wb04.getSheetByName('Bank_Accounts'));
      payload.ledger = sheetToObjects_(wb04.getSheetByName('Bank_Ledger_Splits'));
      payload.apBills = sheetToObjects_(wb04.getSheetByName('AP_Bills_Inbox'));
      payload.bankFeed = sheetToObjects_(wb04.getSheetByName('Bank_Feed_Staging'));
      payload.fridayMatrix = sheetToObjects_(wb04.getSheetByName('Friday_Treasurer_Matrix'));
      payload.recurringSchedules = sheetToObjects_(wb04.getSheetByName('Recurring_Giving_Schedules'));
    }
  }

  if (isSuper) {
    const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
    payload.vaultLinks.wb01Auth = 'https://docs.google.com/spreadsheets/d/' + getVaultId_('WB01_AUTH') + '/edit';
    payload.users = listSafeUsers_(wb01.getSheetByName('Users').getDataRange().getValues());
    payload.pilotFeedback = sheetToObjects_(wb01.getSheetByName('Pilot_Feedback_Log'));
  }

  try {
    cache.put(cacheKey, JSON.stringify(payload), 45);
  } catch (_) {
    // Payload > 100KB skips ScriptCache gracefully
  }
  return payload;
}

function handlePublicBootstrap_() {
  const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));

  const publicEvents = sheetToObjects_(wb02.getSheetByName('Events_Calendar'))
    .filter(ev => String(ev.Published_Public) === 'Yes');

  const publicOutlines = sheetToObjects_(wb03.getSheetByName('Service_Outlines'))
    .filter(item => String(item.Public_Visible) === 'Yes');

  const publicSongs = sheetToObjects_(wb03.getSheetByName('Songs_Library'))
    .filter(s => String(s.Public_Lyrics) === 'Yes')
    .map(s => ({
      Song_ID: s.Song_ID,
      Title: s.Title,
      Authors: s.Authors,
      Default_Key: s.Default_Key,
      BPM: s.BPM,
      ChordPro_Chart: s.ChordPro_Chart
    }));

  return {
    ok: true,
    churchName: 'Life Fellowship Church of the Nazarene',
    events: publicEvents,
    outlines: publicOutlines,
    songs: publicSongs
  };
}

function handleLookupRsvp_(token) {
  if (!token) return { ok: false, error: 'Missing RSVP token.' };
  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
  const rows = sheetToObjects_(wb03.getSheetByName('Volunteer_Schedules'));
  const match = rows.find(r => String(r.RSVP_Token) === token);
  if (!match) return { ok: false, error: 'Schedule invitation not found.' };
  return {
    ok: true,
    assignment: {
      Assignment_ID: match.Assignment_ID,
      Event_Date: match.Event_Date,
      Event_Title: match.Event_Title,
      Helper_Name: match.Helper_Name,
      Role_Title: match.Role_Title,
      RSVP_Status: match.RSVP_Status
    }
  };
}

function handleRespondRsvp_(body) {
  const token = String(body.token || '').trim();
  const status = body.status === 'Declined' ? 'Declined' : 'Accepted';
  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
  const sh = wb03.getSheetByName('Volunteer_Schedules');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][9]) === token) {
      sh.getRange(i + 1, 9).setValue(status);
      sh.getRange(i + 1, 12).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      return { ok: true, status: status, helperName: data[i][6], eventTitle: data[i][3] };
    }
  }
  return { ok: false, error: 'Invitation token not found.' };
}

// ============================================================================
// MINISTRY, WORSHIP & FINANCIAL MUTATIONS (AUTO-UPDATES SELF-CALC FORMULAS)
// ============================================================================

function handleRecordAttendance_(body, session) {
  const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
  const sh = wb02.getSheetByName('Attendance_Sessions');
  assertNotReportSheet_(sh);

  const sessionDate = String(body.sessionDate || todayYmd_());
  const monthKey = sessionDate.slice(0, 7);
  const namedPresent = Number(body.namedPresent || 0);
  const unnamedGuests = Number(body.unnamedGuests || 0);
  const totalCount = Number(body.totalAttendance != null ? body.totalAttendance : (namedPresent + unnamedGuests));
  const firstTimers = Number(body.firstTimeVisitors || 0);
  const sid = 'att_' + randomHex_(5);

  sh.appendRow([
    sid,
    monthKey,
    sessionDate,
    String(body.ministryCategory || 'Sunday Worship - Adults'),
    String(body.groupName || ''),
    String(body.eventTitle || ''),
    namedPresent,
    unnamedGuests,
    totalCount,
    firstTimers,
    session.fullName,
    String(body.notes || ''),
    'No'
  ]);

  if (Array.isArray(body.checkedInPeople) && body.checkedInPeople.length > 0) {
    const chkSh = wb02.getSheetByName('Attendance_Checkins');
    const nowIso = new Date().toISOString();
    body.checkedInPeople.forEach(p => {
      chkSh.appendRow([
        'chk_' + randomHex_(5),
        sid,
        sessionDate,
        String(p.personId || ''),
        String(p.personName || ''),
        String(body.groupName || ''),
        String(p.badgeCode || ''),
        session.fullName,
        nowIso
      ]);
    });
  }

  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return {
    ok: true,
    sessionId: sid,
    monthlyAttendance: readReportTable_(wb02.getSheetByName('REPORT_Monthly_Attendance'), 9, 22)
  };
}

function handleSubmitConnectCard_(body, session) {
  const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
  const sh = wb02.getSheetByName('Visitors_Connect');
  assertNotReportSheet_(sh);

  const visitDate = String(body.visitDate || todayYmd_());
  const monthKey = visitDate.slice(0, 7);
  const subId = 'vis_' + randomHex_(5);

  let scanUrl = String(body.cardScanUrl || '');
  if (body.photoBase64) {
    scanUrl = saveBase64ToFolder_(
      VAULT_IDS.FOLDERS.VISITOR_SCANS,
      body.photoFilename || ('VisitorCard_' + visitDate + '_' + subId + '.jpg'),
      body.photoMimeType || 'image/jpeg',
      body.photoBase64
    );
  }

  sh.appendRow([
    subId,
    monthKey,
    visitDate,
    String(body.fullName || '').trim(),
    String(body.phone || '').trim(),
    String(body.email || '').trim(),
    String(body.guestStatus || '1st Time Visitor'),
    String(body.ministrySource || 'Sunday Worship'),
    String(body.decisionToday || 'None'),
    String(body.prayerRequest || '').trim(),
    'Pending',
    'Pastor Joel Newman',
    scanUrl,
    String(body.notes || '').trim(),
    'No'
  ]);

  SpreadsheetApp.flush();
  if (session) invalidateUserCache_(session);
  return { ok: true, submissionId: subId, cardScanUrl: scanUrl };
}

function handleUpdateFollowUp_(body, session) {
  const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
  const sh = wb02.getSheetByName('Visitors_Connect');
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.submissionId)) {
      sh.getRange(i + 1, 11).setValue(body.status === 'Completed' ? 'Completed' : 'Pending');
      SpreadsheetApp.flush();
      invalidateUserCache_(session);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Visitor record not found.' };
}

function handleSavePerson_(body, session) {
  const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
  const sh = wb02.getSheetByName('People_Directory');
  const pid = 'p_' + randomHex_(5);
  sh.appendRow([
    pid,
    String(body.householdId || ''),
    String(body.firstName || '').trim(),
    String(body.lastName || '').trim(),
    String(body.memberStatus || 'Visitor'),
    'Yes',
    String(body.familyRole || 'Adult/Primary'),
    String(body.ageCategory || 'Adults'),
    String(body.gender || ''),
    String(body.maritalStatus || ''),
    String(body.birthDate || ''),
    String(body.mobilePhone || ''),
    String(body.email || ''),
    String(body.inviteMethod || 'Both'),
    String(body.firstVisitDate || ''),
    String(body.baptismMonth || ''),
    String(body.membershipMonth || ''),
    String(body.ministrySummary || ''),
    'No'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, personId: pid };
}

function handleCreateGivingBatch_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const sh = wb04.getSheetByName('Giving_Batches');
  const batchDate = String(body.batchDate || todayYmd_());
  const bid = 'bat_' + randomHex_(5);
  let countSheetUrl = '';
  if (body.photoBase64) {
    countSheetUrl = saveBase64ToFolder_(
      VAULT_IDS.FOLDERS.COUNT_SHEETS,
      body.photoFilename || ('CountSheet_' + batchDate + '_' + bid + '.jpg'),
      body.photoMimeType || 'image/jpeg',
      body.photoBase64
    );
  }
  sh.appendRow([
    bid,
    batchDate.slice(0, 7),
    batchDate,
    String(body.batchType || 'In-Person Giving'),
    String(body.description || (batchDate + ' Offering')),
    'No',
    '',
    countSheetUrl,
    session.fullName,
    'No'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, batchId: bid, countSheetUrl: countSheetUrl };
}

function handleAddContribution_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const batSh = wb04.getSheetByName('Giving_Batches');
  const batRows = batSh.getDataRange().getValues();
  let batchRow = null;
  for (let i = 1; i < batRows.length; i++) {
    if (String(batRows[i][0]) === String(body.batchId)) {
      batchRow = batRows[i];
      break;
    }
  }
  if (!batchRow) return { ok: false, error: 'Giving batch not found.' };
  if (String(batchRow[5]) === 'Yes') return { ok: false, error: 'Batch is locked and cannot be modified.' };

  const giftDate = String(batchRow[2] || todayYmd_());
  const cid = 'cnt_' + randomHex_(5);
  wb04.getSheetByName('Contributions').appendRow([
    cid,
    giftDate.slice(0, 7),
    giftDate,
    String(body.batchId),
    String(body.personId || ''),
    String(body.donorName || 'Anonymous Loose Plate'),
    Number(body.amount || 0),
    String(body.categoryCode || '10-1001'),
    String(body.categoryName || 'Tithes'),
    String(body.fundCode || '10'),
    String(body.paymentType || 'Check'),
    String(body.checkRef || ''),
    body.paymentType === 'Cash' && !body.personId ? 'No' : 'Yes',
    String(body.memo || ''),
    'No'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, contributionId: cid };
}

function handleLockGivingBatch_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const batSh = wb04.getSheetByName('Giving_Batches');
  const batRows = batSh.getDataRange().getValues();
  let bIdx = -1;
  for (let i = 1; i < batRows.length; i++) {
    if (String(batRows[i][0]) === String(body.batchId)) {
      bIdx = i + 1;
      break;
    }
  }
  if (bIdx === -1) return { ok: false, error: 'Batch not found.' };
  if (String(batRows[bIdx - 1][5]) === 'Yes') return { ok: false, error: 'Batch already locked.' };

  const contribs = sheetToObjects_(wb04.getSheetByName('Contributions'))
    .filter(c => String(c.Batch_ID) === String(body.batchId));
  if (contribs.length === 0) return { ok: false, error: 'Add at least one contribution before locking.' };

  const txId = 'tx_dep_' + randomHex_(5);
  const batchDate = String(batRows[bIdx - 1][2]);
  const bankAcctId = String(body.bankAccountId || 'bnk_boa_9284');
  const ledSh = wb04.getSheetByName('Bank_Ledger_Splits');

  // Group splits by Category + Fund and post directly to Bank_Ledger_Splits
  const grouped = {};
  contribs.forEach(c => {
    if (String(c.Payment_Type) === 'In-Kind') {
      // Balanced $0-cash In-Kind journal
      ledSh.appendRow([
        'ln_' + randomHex_(5), txId, batchDate.slice(0, 7), batchDate, 'NONE', 'in_kind_journal',
        Number(c.Amount), c.Donor_Name + ' — In-Kind', c.Category_Code, c.Category_Name, c.Fund_Code,
        'Cleared', 'No', '', '', body.batchId, c.Memo, 'No'
      ]);
      ledSh.appendRow([
        'ln_' + randomHex_(5), txId, batchDate.slice(0, 7), batchDate, 'NONE', 'in_kind_journal',
        -Number(c.Amount), c.Donor_Name + ' — In-Kind Offset', '70-5002', 'Ministry In-Kind Expense', c.Fund_Code,
        'Cleared', 'No', '', '', body.batchId, c.Memo, 'No'
      ]);
    } else {
      const k = c.Category_Code + '|' + c.Category_Name + '|' + c.Fund_Code;
      grouped[k] = (grouped[k] || 0) + Number(c.Amount);
    }
  });

  Object.keys(grouped).forEach(k => {
    const parts = k.split('|');
    ledSh.appendRow([
      'ln_' + randomHex_(5), txId, batchDate.slice(0, 7), batchDate, bankAcctId, 'deposit',
      grouped[k], String(batRows[bIdx - 1][4]), parts[0], parts[1], parts[2],
      'Cleared', 'No', '', '', body.batchId, 'Auto-posted from locked Giving Batch', 'No'
    ]);
  });

  batSh.getRange(bIdx, 6).setValue('Yes');
  batSh.getRange(bIdx, 7).setValue(txId);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, depositTxId: txId };
}

function handleCreateApBill_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const sh = wb04.getSheetByName('AP_Bills_Inbox');
  const billId = 'ap_' + randomHex_(5);
  let invUrl = '';
  if (body.photoBase64) {
    invUrl = saveBase64ToFolder_(
      VAULT_IDS.FOLDERS.AP_BILLS,
      body.photoFilename || ('Invoice_' + String(body.vendorName || 'Vendor').replace(/\W+/g, '_') + '_' + billId + '.pdf'),
      body.photoMimeType || 'image/jpeg',
      body.photoBase64
    );
  }
  sh.appendRow([
    billId,
    String(body.vendorName || '').trim(),
    String(body.invoiceNumber || '').trim(),
    String(body.invoiceDate || todayYmd_()),
    String(body.dueDate || todayYmd_()),
    Number(body.amount || 0),
    String(body.categoryCode || '10-5202'),
    String(body.fundCode || '10'),
    String(body.payFromAccountId || 'bnk_boa_9284'),
    String(body.status || 'Approved'),
    invUrl,
    String(body.notes || ''),
    new Date().toISOString(),
    'No'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, billId: billId, invoiceUrl: invUrl };
}

function handlePayApBill_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const apSh = wb04.getSheetByName('AP_Bills_Inbox');
  const rows = apSh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.billId)) {
      if (String(rows[i][9]) === 'Paid') return { ok: false, error: 'Bill is already marked Paid.' };
      const payDate = String(body.paidDate || todayYmd_());
      const amt = Number(rows[i][5] || 0);
      wb04.getSheetByName('Bank_Ledger_Splits').appendRow([
        'ln_' + randomHex_(5),
        'tx_ap_' + randomHex_(5),
        payDate.slice(0, 7),
        payDate,
        String(rows[i][8] || 'bnk_boa_9284'),
        'expense',
        -Math.abs(amt),
        String(rows[i][1]),
        String(rows[i][6]),
        'AP Bill Payment',
        String(rows[i][7]),
        'Cleared',
        'No',
        '',
        String(rows[i][10] || ''),
        '',
        'Paid Invoice #' + String(rows[i][2]),
        'No'
      ]);
      apSh.getRange(i + 1, 10).setValue('Paid');
      SpreadsheetApp.flush();
      invalidateUserCache_(session);
      return { ok: true };
    }
  }
  return { ok: false, error: 'AP Bill not found.' };
}

function handleApproveBankFeed_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const feedSh = wb04.getSheetByName('Bank_Feed_Staging');
  const rows = feedSh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.feedId)) {
      const dir = String(rows[i][5]);
      const amt = Number(rows[i][6]);
      const signed = dir === 'credit' ? Math.abs(amt) : -Math.abs(amt);
      const postedDate = String(rows[i][3] || todayYmd_());
      if (!body.matchExistingDeposit) {
        wb04.getSheetByName('Bank_Ledger_Splits').appendRow([
          'ln_' + randomHex_(5),
          'tx_fd_' + randomHex_(5),
          postedDate.slice(0, 7),
          postedDate,
          String(rows[i][1]),
          dir === 'credit' ? 'deposit' : 'expense',
          signed,
          String(rows[i][4]),
          String(body.categoryCode || rows[i][7] || '10-5102'),
          String(body.categoryName || 'Bank Feed Approved'),
          String(body.fundCode || rows[i][8] || '10'),
          'Cleared',
          body.needsReceipt ? 'Yes' : 'No',
          String(body.receiptAssignee || ''),
          '',
          '',
          'Synced Bank Feed',
          'No'
        ]);
      }
      feedSh.getRange(i + 1, 10).setValue(body.matchExistingDeposit ? 'Matched_Deposit' : 'Approved');
      SpreadsheetApp.flush();
      invalidateUserCache_(session);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Feed item not found.' };
}

function handleImportBankRows_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const feedSh = wb04.getSheetByName('Bank_Feed_Staging');
  const existing = feedSh.getDataRange().getValues().map(r => String(r[2]));
  const items = Array.isArray(body.rows) ? body.rows : [];
  let added = 0;
  items.forEach(item => {
    const extId = String(item.externalId || sha256Hex_(item.date + '|' + item.description + '|' + item.amount).slice(0, 20));
    if (existing.indexOf(extId) === -1) {
      feedSh.appendRow([
        'fd_' + randomHex_(5),
        String(body.bankAccountId || 'bnk_boa_9284'),
        extId,
        String(item.date || todayYmd_()),
        String(item.description || ''),
        Number(item.amount) >= 0 ? 'credit' : 'debit',
        Math.abs(Number(item.amount || 0)),
        String(item.suggestedCategory || '10-5102'),
        String(item.suggestedFund || '10'),
        'Pending',
        new Date().toISOString()
      ]);
      added++;
    }
  });
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, importedCount: added };
}

function handlePlaidSync_(session) {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('PLAID_CLIENT_ID');
  const secret = props.getProperty('PLAID_SECRET');
  const env = props.getProperty('PLAID_ENV') || 'production';
  const tokensJson = props.getProperty('PLAID_ACCESS_TOKENS_JSON');
  if (!clientId || !secret || !tokensJson) {
    return {
      ok: false,
      code: 'PLAID_NOT_CONFIGURED',
      error: 'Add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ACCESS_TOKENS_JSON in Apps Script ScriptProperties to enable live Plaid sync (or import .CSV/.QBO statements anytime).'
    };
  }
  const tokensMap = JSON.parse(tokensJson);
  const host = env === 'sandbox' ? 'https://sandbox.plaid.com' : 'https://production.plaid.com';
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const feedSh = wb04.getSheetByName('Bank_Feed_Staging');
  const existingIds = feedSh.getDataRange().getValues().map(r => String(r[2]));
  let syncedCount = 0;

  Object.keys(tokensMap).forEach(bankAccountId => {
    const resp = UrlFetchApp.fetch(host + '/transactions/sync', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        client_id: clientId,
        secret: secret,
        access_token: tokensMap[bankAccountId]
      }),
      muteHttpExceptions: true
    });
    const parsed = JSON.parse(resp.getContentText() || '{}');
    (parsed.added || []).forEach(tx => {
      if (existingIds.indexOf(tx.transaction_id) === -1) {
        // Plaid amounts: positive = debit outflow, negative = credit inflow
        const isCredit = Number(tx.amount) < 0;
        feedSh.appendRow([
          'fd_' + randomHex_(5),
          bankAccountId,
          tx.transaction_id,
          tx.date,
          tx.name || tx.merchant_name || 'Bank Transaction',
          isCredit ? 'credit' : 'debit',
          Math.abs(Number(tx.amount)),
          isCredit ? '10-1001' : '10-5202',
          '10',
          'Pending',
          new Date().toISOString()
        ]);
        syncedCount++;
      }
    });
  });

  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, syncedCount: syncedCount };
}

function handleSaveFridayMatrix_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const sh = wb04.getSheetByName('Friday_Treasurer_Matrix');
  const fDate = String(body.fridayDate || todayYmd_());
  const rows = sh.getDataRange().getValues();
  const rowPayload = [
    fDate,
    String(body.treasurerName || 'Dee "Huney" Huchton'),
    session.fullName,
    Number(body.generalCushion || 1500),
    Number(body.schoolCushion || 5000),
    Number(body.otherCushion || 250),
    Number(body.pendingDepositsTotal || 0),
    JSON.stringify(body.checklist || []),
    String(body.meetingNotes || ''),
    new Date().toISOString()
  ];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === fDate) {
      sh.getRange(i + 1, 1, 1, rowPayload.length).setValues([rowPayload]);
      SpreadsheetApp.flush();
      invalidateUserCache_(session);
      return { ok: true };
    }
  }
  sh.appendRow(rowPayload);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true };
}

function handleSaveSong_(body, session) {
  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
  const sh = wb03.getSheetByName('Songs_Library');
  const sid = String(body.songId || ('sng_' + randomHex_(5)));
  let leadUrl = String(body.leadSheetUrl || '');
  if (body.fileBase64) {
    leadUrl = saveBase64ToFolder_(
      VAULT_IDS.FOLDERS.WORSHIP_CHORDS,
      body.filename || (String(body.title || 'Song') + '.pdf'),
      body.mimeType || 'application/pdf',
      body.fileBase64
    );
  }
  sh.appendRow([
    sid,
    String(body.title || '').trim(),
    String(body.authors || '').trim(),
    String(body.ccliNumber || '').trim(),
    String(body.defaultKey || 'G'),
    String(body.tempo || 'Medium'),
    Number(body.bpm || 74),
    String(body.themes || ''),
    String(body.chordProChart || ''),
    leadUrl,
    String(body.lastSungDate || ''),
    body.publicLyrics === false ? 'No' : 'Yes'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, songId: sid, leadSheetUrl: leadUrl };
}

function handleSaveOutlineItem_(body, session) {
  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
  const sh = wb03.getSheetByName('Service_Outlines');
  const oid = 'out_' + randomHex_(5);
  sh.appendRow([
    oid,
    String(body.eventId || ''),
    Number(body.sortOrder || 1),
    String(body.itemType || 'element'),
    String(body.songId || ''),
    String(body.title || ''),
    String(body.selectedKey || ''),
    Number(body.durationSec || 300),
    String(body.ledBy || ''),
    String(body.stageNotes || ''),
    body.publicVisible === false ? 'No' : 'Yes'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, itemId: oid };
}

function handleDeleteOutlineItem_(body, session) {
  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
  const sh = wb03.getSheetByName('Service_Outlines');
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.itemId)) {
      sh.deleteRow(i + 1);
      SpreadsheetApp.flush();
      invalidateUserCache_(session);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Outline item not found.' };
}

function handleCreateCalendarEvent_(body, session) {
  const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
  const sh = wb02.getSheetByName('Events_Calendar');
  const eid = 'ev_' + randomHex_(5);
  sh.appendRow([
    eid,
    String(body.title || '').trim(),
    String(body.ministryScope || 'Sunday Worship'),
    String(body.eventDate || todayYmd_()),
    String(body.helperArrival || '09:45'),
    String(body.startTime || '10:30'),
    String(body.endTime || '12:00'),
    String(body.location || 'Worship Center'),
    body.publishedPublic === false ? 'No' : 'Yes',
    body.isWorshipService ? 'Yes' : 'No',
    String(body.topic || ''),
    body.registrationOpen ? 'Yes' : 'No',
    Number(body.capacity || 0),
    String(body.description || '')
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, eventId: eid };
}

function handleAssignVolunteer_(body, session) {
  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
  const sh = wb03.getSheetByName('Volunteer_Schedules');
  const aid = 'asg_' + randomHex_(5);
  const rsvpToken = 'tok_' + randomHex_(10);
  sh.appendRow([
    aid,
    String(body.eventId || ''),
    String(body.eventDate || todayYmd_()),
    String(body.eventTitle || 'Sunday Worship'),
    String(body.roleId || ''),
    String(body.helperUsername || ''),
    String(body.helperName || ''),
    String(body.roleTitle || ''),
    'Invited',
    rsvpToken,
    String(body.inviteChannel || 'SMS'),
    new Date().toISOString()
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, assignmentId: aid, rsvpToken: rsvpToken };
}

function handleSendHelperSms_(body, session) {
  const props = PropertiesService.getScriptProperties();
  const sid = props.getProperty('TWILIO_ACCOUNT_SID');
  const auth = props.getProperty('TWILIO_AUTH_TOKEN');
  const fromPhone = props.getProperty('TWILIO_FROM_NUMBER');
  const toPhone = String(body.toPhone || '').trim();
  const message = String(body.message || '').trim();

  const wb03 = SpreadsheetApp.openById(getVaultId_('WB03_WORSHIP'));
  const logSh = wb03.getSheetByName('SMS_Communications_Log');

  if (!sid || !auth || !fromPhone) {
    logSh.appendRow(['sms_' + randomHex_(5), 'outbound_queued', String(body.contactName || ''), toPhone, message, 'Awaiting_Twilio_Keys', new Date().toISOString()]);
    return {
      ok: true,
      simulated: true,
      notice: 'Logged in SMS_Communications_Log. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN & TWILIO_FROM_NUMBER in ScriptProperties for live SMS dispatch.'
    };
  }

  const resp = UrlFetchApp.fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
    method: 'post',
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(sid + ':' + auth) },
    payload: { To: toPhone, From: fromPhone, Body: message },
    muteHttpExceptions: true
  });
  const ok = resp.getResponseCode() >= 200 && resp.getResponseCode() < 300;
  logSh.appendRow(['sms_' + randomHex_(5), 'outbound', String(body.contactName || ''), toPhone, message, ok ? 'Sent' : 'Failed', new Date().toISOString()]);
  return { ok: ok, status: ok ? 'Sent' : resp.getContentText() };
}

function handleCreateStripeCheckout_(body) {
  const props = PropertiesService.getScriptProperties();
  const stripeKey = props.getProperty('STRIPE_SECRET_KEY');
  const amountCents = Math.round(Number(body.amount || 0) * 100);
  if (amountCents < 100) return { ok: false, error: 'Minimum online gift is $1.00.' };

  if (!stripeKey) {
    return {
      ok: false,
      code: 'STRIPE_NOT_CONFIGURED',
      error: 'Add STRIPE_SECRET_KEY in Apps Script ScriptProperties to launch live Stripe Checkout.'
    };
  }

  const fundLabel = String(body.fundLabel || 'Tithes & General Offering');
  const successUrl = String(body.returnUrl || 'https://www.deltonanaz.com/?giving=thank-you');
  const cancelUrl = String(body.cancelUrl || 'https://www.deltonanaz.com/');

  const resp = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + stripeKey },
    payload: {
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': 'Life Fellowship Church — ' + fundLabel,
      'line_items[0][price_data][unit_amount]': String(amountCents),
      'line_items[0][quantity]': '1'
    },
    muteHttpExceptions: true
  });
  const data = JSON.parse(resp.getContentText() || '{}');
  if (!data.url) return { ok: false, error: data.error ? data.error.message : 'Stripe session error' };
  return { ok: true, checkoutUrl: data.url };
}

function handleUploadVaultFile_(body, session) {
  const bucket = String(body.folderKey || 'RECEIPTS');
  const folderId = VAULT_IDS.FOLDERS[bucket] || VAULT_IDS.FOLDERS.RECEIPTS;
  const url = saveBase64ToFolder_(
    folderId,
    String(body.filename || ('Upload_' + todayYmd_() + '.jpg')),
    String(body.mimeType || 'image/jpeg'),
    String(body.base64 || '')
  );
  return { ok: true, fileUrl: url };
}

function handleRecordManualTransaction_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const ledSh = wb04.getSheetByName('Bank_Ledger_Splits');
  const txDate = String(body.txDate || todayYmd_());
  const txType = body.txType === 'deposit' ? 'deposit' : 'expense';
  const rawAmt = Math.abs(Number(body.amount || 0));
  const signed = txType === 'deposit' ? rawAmt : -rawAmt;
  let receiptUrl = '';
  if (body.photoBase64) {
    receiptUrl = saveBase64ToFolder_(
      VAULT_IDS.FOLDERS.RECEIPTS,
      body.photoFilename || ('Receipt_' + txDate + '.jpg'),
      body.photoMimeType || 'image/jpeg',
      body.photoBase64
    );
  }
  const txId = 'tx_man_' + randomHex_(5);
  ledSh.appendRow([
    'ln_' + randomHex_(5),
    txId,
    txDate.slice(0, 7),
    txDate,
    String(body.bankAccountId || 'bnk_boa_9284'),
    txType,
    signed,
    String(body.payee || '').trim(),
    String(body.categoryCode || '10-5202'),
    String(body.categoryName || 'Manual Entry'),
    String(body.fundCode || '10'),
    'Cleared',
    body.needsReceipt && !receiptUrl ? 'Yes' : 'No',
    String(body.receiptAssignee || ''),
    receiptUrl,
    '',
    String(body.memo || ''),
    'No'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, txId: txId, receiptUrl: receiptUrl };
}

/**
 * Atomic Two-Legged Bank/Fund Transfer — Permanently eliminates ChurchTrac's $8,109.92 GL Xfer Drift!
 */
function handleRecordAtomicTransfer_(body, session) {
  const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
  const ledSh = wb04.getSheetByName('Bank_Ledger_Splits');
  const txDate = String(body.txDate || todayYmd_());
  const amt = Math.abs(Number(body.amount || 0));
  if (amt <= 0) return { ok: false, error: 'Transfer amount must be greater than $0.00.' };

  const fromBank = String(body.fromBankId || 'bnk_boa_9284');
  const toBank = String(body.toBankId || fromBank);
  const fromFund = String(body.fromFundCode || '10');
  const toFund = String(body.toFundCode || fromFund);
  const memo = String(body.memo || 'Atomic Bank/Fund Transfer');
  const txId = 'tx_xfer_' + randomHex_(5);

  ledSh.appendRow([
    'ln_' + randomHex_(5), txId, txDate.slice(0, 7), txDate, fromBank, 'transfer_out',
    -amt, 'Transfer Out -> ' + toBank + ' (Fund ' + toFund + ')', 'XFER-OUT', 'Inter-Account/Fund Transfer',
    fromFund, 'Cleared', 'No', '', '', '', memo, 'No'
  ]);
  ledSh.appendRow([
    'ln_' + randomHex_(5), txId, txDate.slice(0, 7), txDate, toBank, 'transfer_in',
    amt, 'Transfer In <- ' + fromBank + ' (Fund ' + fromFund + ')', 'XFER-IN', 'Inter-Account/Fund Transfer',
    toFund, 'Cleared', 'No', '', '', '', memo, 'No'
  ]);
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, txId: txId };
}

function handleSubmitPilotFeedback_(body, session) {
  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  let sh = wb01.getSheetByName('Pilot_Feedback_Log');
  if (!sh) {
    sh = wb01.insertSheet('Pilot_Feedback_Log');
    sh.appendRow([
      'Feedback_ID', 'Submitted_At', 'Reviewer_Name', 'Reviewer_Username',
      'Reviewer_Role', 'Screen_Module', 'Feedback_Type', 'Priority',
      'Suggestion_or_Issue', 'Status', 'Admin_Response'
    ]);
  }
  const fbId = 'fb_' + randomHex_(5);
  sh.appendRow([
    fbId,
    new Date().toISOString(),
    String(body.reviewerName || (session && session.fullName) || 'Pilot Tester'),
    String(body.reviewerUsername || (session && session.username) || 'pilot'),
    String(body.reviewerRole || (session && session.role) || 'tester'),
    String(body.screenModule || 'General'),
    String(body.feedbackType || 'Feature Needed'),
    String(body.priority || 'Normal'),
    String(body.message || '').trim(),
    'Open',
    ''
  ]);
  SpreadsheetApp.flush();
  if (session) invalidateUserCache_(session);
  return { ok: true, feedbackId: fbId };
}

function handleUpdatePilotFeedbackStatus_(body, session) {
  const wb01 = SpreadsheetApp.openById(getVaultId_('WB01_AUTH'));
  const sh = wb01.getSheetByName('Pilot_Feedback_Log');
  if (!sh) return { ok: false, error: 'Pilot_Feedback_Log sheet not found.' };
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(body.feedbackId)) {
      sh.getRange(i + 1, 10).setValue(String(body.status || 'Planned'));
      if (body.adminResponse != null) {
        sh.getRange(i + 1, 11).setValue(String(body.adminResponse));
      }
      SpreadsheetApp.flush();
      invalidateUserCache_(session);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Feedback item not found.' };
}

function handleBulkImportCsv_(body, session) {
  const importType = String(body.importType || 'people');
  const rows = Array.isArray(body.rows) ? body.rows : [];
  let added = 0;

  if (importType === 'people') {
    const wb02 = SpreadsheetApp.openById(getVaultId_('WB02_PEOPLE'));
    const pSh = wb02.getSheetByName('People_Directory');
    const existingNames = pSh.getDataRange().getValues().map(r => (String(r[2]) + ' ' + String(r[3])).trim().toLowerCase());
    rows.forEach(r => {
      const full = (String(r.firstName || '') + ' ' + String(r.lastName || '')).trim();
      if (full && existingNames.indexOf(full.toLowerCase()) === -1 && full.toLowerCase().indexOf('cameron white') === -1) {
        pSh.appendRow([
          'p_imp_' + randomHex_(4), '', r.firstName || '', r.lastName || '',
          r.memberStatus || 'Affiliated', 'Yes', 'Adult', 'Adults', '', '',
          r.birthDate || '', r.phone || '', r.email || '', 'Both', '', '', '', r.notes || 'CSV Import', 'No'
        ]);
        added++;
      }
    });
  } else if (importType === 'giving') {
    const wb04 = SpreadsheetApp.openById(getVaultId_('WB04_FINANCE'));
    const cSh = wb04.getSheetByName('Contributions');
    rows.forEach(r => {
      const amt = Number(r.amount || 0);
      const dt = String(r.date || todayYmd_());
      if (amt !== 0) {
        cSh.appendRow([
          'cnt_imp_' + randomHex_(4), dt.slice(0, 7), dt, 'bat_csv_import', '',
          String(r.donorName || 'Imported Donor'), amt, String(r.categoryCode || '10-1001'),
          String(r.categoryName || 'Tithes & General Offerings'), String(r.fundCode || '10'),
          String(r.paymentType || 'Check'), String(r.checkRef || ''), 'Yes', String(r.memo || 'CSV Import'), 'No'
        ]);
        added++;
      }
    });
  }
  SpreadsheetApp.flush();
  invalidateUserCache_(session);
  return { ok: true, importedCount: added };
}

// ============================================================================
// UTILITY & SECURITY HELPERS
// ============================================================================

function getVaultId_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || VAULT_IDS[key];
}

function assertNotReportSheet_(sheet) {
  if (!sheet || sheet.getName().indexOf('REPORT_') === 0) {
    throw new Error('STRICT FORMULA GUARD: Self-calculating REPORT_* tabs are read-only.');
  }
}

function requireModule_(session, allowedList) {
  if (session.role === 'super_admin') return;
  if (!hasAnyModule_(session, allowedList)) {
    throw new Error('Access denied for your assigned ministry role.');
  }
}

function hasAnyModule_(session, candidates) {
  if (!session || !Array.isArray(session.allowedModules)) return false;
  if (session.allowedModules.indexOf('*') !== -1) return true;
  return candidates.some(m => session.allowedModules.indexOf(m) !== -1);
}

function filterByMinistryScope_(rows, scopesArr, fieldNames) {
  if (!Array.isArray(scopesArr) || scopesArr.indexOf('*') !== -1) return rows;
  const lowered = scopesArr.map(s => String(s).trim().toLowerCase()).filter(Boolean);
  return rows.filter(r =>
    fieldNames.some(fn => {
      const val = String(r[fn] || '').toLowerCase();
      return lowered.some(sc => val.indexOf(sc) !== -1 || sc.indexOf(val) !== -1);
    })
  );
}

function rowToUserProfile_(r) {
  const modsRaw = String(r[6] || '').trim();
  const scopesRaw = String(r[7] || '').trim();
  return {
    userId: String(r[0]),
    username: String(r[1]),
    fullName: String(r[2]),
    email: String(r[3] || ''),
    phone: String(r[4] || ''),
    role: String(r[5] || 'ministry_helper'),
    allowedModules: modsRaw === '*' ? ['*'] : modsRaw.split(',').map(s => s.trim()).filter(Boolean),
    ministryScopes: scopesRaw === '*' ? ['*'] : scopesRaw.split(',').map(s => s.trim()).filter(Boolean),
    mustChangePassword: String(r[10] || 'No') === 'Yes'
  };
}

function listSafeUsers_(rows) {
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    list.push({
      userId: String(rows[i][0]),
      username: String(rows[i][1]),
      fullName: String(rows[i][2]),
      email: String(rows[i][3] || ''),
      phone: String(rows[i][4] || ''),
      role: String(rows[i][5]),
      allowedModules: String(rows[i][6]),
      ministryScopes: String(rows[i][7]),
      mustChangePassword: String(rows[i][10] || 'No') === 'Yes',
      active: String(rows[i][11] || 'Yes') === 'Yes',
      lastLoginAt: String(rows[i][12] || '')
    });
  }
  return list;
}

function revokeUserSessions_(wb01, targetUserId) {
  const sh = wb01.getSheetByName('Active_Sessions');
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === targetUserId && String(rows[i][7]) !== 'Yes') {
      sh.getRange(i + 1, 8).setValue('Yes');
      CacheService.getScriptCache().remove('sess_' + String(rows[i][0]));
    }
  }
}

function appendAudit_(wb01, actorUsername, actorRole, action, moduleName, targetId, summary) {
  wb01.getSheetByName('Audit_Log').appendRow([
    new Date().toISOString(),
    actorUsername,
    actorRole,
    action,
    moduleName,
    targetId,
    summary
  ]);
}

function sheetToObjects_(sheet) {
  if (!sheet) return [];
  const vals = sheet.getDataRange().getDisplayValues();
  if (vals.length < 2) return [];
  const headers = vals[0].map(h => String(h).trim());
  const out = [];
  for (let r = 1; r < vals.length; r++) {
    if (vals[r].every(cell => cell === '')) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = vals[r][c];
    }
    out.push(obj);
  }
  return out;
}

function readReportTable_(sheet, headerRow, endRow) {
  if (!sheet) return [];
  const lastCol = sheet.getLastColumn();
  const vals = sheet.getRange(headerRow, 1, endRow - headerRow + 1, lastCol).getDisplayValues();
  const headers = vals[0].map(h => String(h).trim());
  const out = [];
  for (let r = 1; r < vals.length; r++) {
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = vals[r][c];
    }
    out.push(obj);
  }
  return out;
}

function saveBase64ToFolder_(folderId, filename, mimeType, base64Str) {
  const clean = String(base64Str).replace(/^data:[^;]+;base64,/, '');
  const bytes = Utilities.base64Decode(clean);
  const blob = Utilities.newBlob(bytes, mimeType, filename);
  const file = DriveApp.getFolderById(folderId).createFile(blob);
  return file.getUrl();
}

function invalidateUserCache_(session) {
  if (!session) return;
  const cache = CacheService.getScriptCache();
  cache.remove('boot_v2_' + session.userId + '_' + session.role);
}

function withScriptLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function sha256Hex_(input) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  return raw.map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
}

function randomHex_(byteCount) {
  let out = '';
  for (let i = 0; i < byteCount; i++) {
    out += ('0' + Math.floor(Math.random() * 256).toString(16)).slice(-2);
  }
  return out + sha256Hex_(Utilities.getUuid() + ':' + new Date().getTime()).slice(0, byteCount);
}

function timingSafeEqual_(a, b) {
  const sa = String(a);
  const sb = String(b);
  const len = Math.max(sa.length, sb.length);
  let diff = sa.length ^ sb.length;
  for (let i = 0; i < len; i++) {
    const ca = i < sa.length ? sa.charCodeAt(i) : 0;
    const cb = i < sb.length ? sb.charCodeAt(i) : 0;
    diff |= (ca ^ cb);
  }
  return diff === 0;
}

function todayYmd_() {
  return Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd');
}

function errMessage_(err) {
  return String(err && err.message ? err.message : err);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
