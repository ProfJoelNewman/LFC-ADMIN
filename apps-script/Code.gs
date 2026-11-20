/**
 * Life Fellowship Church — LFC ADMIN Google Apps Script Backend (Code.gs)
 * Bound Workbook: Weekly Treasurer Meeting Breakdown
 * Spreadsheet ID: 1GHBm-XbHH04f4CfpogAdPxg90_WQrWe2LzaJKBVTiY4
 *
 * SECURITY ARCHITECTURE:
 * - Zero plaintext passcodes exist in client HTML/JS or in this repository.
 * - Server-side secret is stored exclusively in Google Apps Script ScriptProperties
 *   under key `LFC_ADMIN_PASSCODE` (configured in Project Settings -> Script Properties).
 * - Every read (`init`, `getTab`) and write (`saveTab`, `duplicateTab`) request MUST
 *   pass constant-time server-side passcode verification before opening or mutating
 *   any spreadsheet tab or cell.
 * - Strict Formula Guard: Read-only white formula cells are NEVER overwritten.
 */

var SPREADSHEET_ID = '1GHBm-XbHH04f4CfpogAdPxg90_WQrWe2LzaJKBVTiY4';
var PASSCODE_PROP_KEYS = ['LFC_ADMIN_PASSCODE', 'ADMIN_PASSCODE'];

/**
 * Explicit allowlist of editable input cells (yellow cells + checklist toggles) per Friday tab.
 * Any cell coordinate outside this allowlist is rejected on write.
 */
var EDITABLE_CELL_TYPES = (function () {
  var map = {
    'F6': 'string', // Treasurer
    'F7': 'string', // Prepared by

    // Section 1: Cash in the Bank
    'C15': 'number', 'D15': 'string',
    'C16': 'number', 'D16': 'string',
    'C17': 'number', 'D17': 'string',

    // Section 2: Money on the Way In
    'C22': 'number', 'D22': 'string',
    'C23': 'number', 'D23': 'string',
    'C24': 'number', 'D24': 'string',
    'C25': 'number', 'D25': 'string',

    // Section 4: Minimum Cash Cushion (yellow cells; carry-forward formula preserved unless explicitly edited)
    'C48': 'cushion',
    'D48': 'cushion',
    'E48': 'cushion',

    // Section 4: Baseline prior-week cash (editable ONLY on first tab if no formula exists)
    'C50': 'baseline_if_no_formula',
    'D50': 'baseline_if_no_formula',
    'E50': 'baseline_if_no_formula',

    // Section 6: Freeform Discussion Notes (merged B76:G80 top-left anchor)
    'B76': 'string'
  };

  // Section 3: Bills & Payroll Due in Next 5 Days (Rows 30..37)
  for (var r = 30; r <= 37; r++) {
    map['C' + r] = 'number';
    map['D' + r] = 'paid_from';
    map['E' + r] = 'date_or_string';
    map['F' + r] = 'string';
  }

  // Section 5: Weekly Checklist (Rows 55..64)
  for (var c = 55; c <= 64; c++) {
    map['C' + c] = 'checklist_done';
    map['D' + c] = 'string';
  }

  // Section 6: Action Items (Rows 69..73)
  for (var a = 69; a <= 73; a++) {
    map['B' + a] = 'string';
    map['C' + a] = 'string';
    map['D' + a] = 'date_or_string';
    map['E' + a] = 'string';
  }

  return map;
})();

/**
 * HTTP GET handler (Health ping & authenticated read support).
 * Note: Browser clients use POST (`text/plain;charset=utf-8`) by default so passcodes
 * are never placed in URL query strings or browser history, while avoiding CORS preflight.
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = String(params.action || 'ping').trim();

    if (action === 'ping') {
      return jsonResponse_({
        ok: true,
        service: 'LFC-ADMIN-GAS',
        version: '1.0.0',
        authRequired: true,
        spreadsheetBound: true
      });
    }

    var authCheck = verifyPasscode_(params.passcode || '');
    if (!authCheck.ok) {
      return jsonResponse_(authCheck);
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (action === 'verify') {
      return jsonResponse_({ ok: true, authenticated: true });
    }
    if (action === 'init' || action === 'getTab') {
      return jsonResponse_(buildWorkbookPayload_(ss, params.tab || ''));
    }

    return jsonResponse_({ ok: false, error: 'Unsupported GET action: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/**
 * HTTP POST handler (Authenticated verify, read, two-way cell sync, and Friday tab duplication).
 * Accepts JSON body sent as `text/plain;charset=utf-8` (CORS preflight-free over HTTPS).
 */
function doPost(e) {
  try {
    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var body = JSON.parse(rawBody);
    var action = String(body.action || '').trim();

    if (action === 'ping') {
      return jsonResponse_({
        ok: true,
        service: 'LFC-ADMIN-GAS',
        version: '1.0.0',
        authRequired: true
      });
    }

    var authCheck = verifyPasscode_(body.passcode || '');
    if (!authCheck.ok) {
      return jsonResponse_(authCheck);
    }

    if (action === 'verify') {
      return jsonResponse_({ ok: true, authenticated: true });
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'init' || action === 'getTab') {
      return jsonResponse_(buildWorkbookPayload_(ss, body.tab || ''));
    }

    if (action === 'saveTab') {
      var lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try {
        var saveResult = applyTabUpdates_(ss, body.tab, body.updates || {});
        SpreadsheetApp.flush();
        var payload = buildWorkbookPayload_(ss, body.tab);
        payload.savedCount = saveResult.savedCount;
        payload.skippedFormulaCells = saveResult.skippedFormulaCells;
        payload.updatedCells = saveResult.updatedCells;
        payload.syncedAt = new Date().toISOString();
        return jsonResponse_(payload);
      } finally {
        lock.releaseLock();
      }
    }

    if (action === 'duplicateTab') {
      var dupLock = LockService.getScriptLock();
      dupLock.waitLock(15000);
      try {
        var newTabName = createNextFridayTab_(ss, body.sourceTab || '', body.newTabName || '');
        SpreadsheetApp.flush();
        var dupPayload = buildWorkbookPayload_(ss, newTabName);
        dupPayload.createdTab = newTabName;
        dupPayload.syncedAt = new Date().toISOString();
        return jsonResponse_(dupPayload);
      } finally {
        dupLock.releaseLock();
      }
    }

    return jsonResponse_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/**
 * Verify entered passcode against ScriptProperties in constant time.
 */
function verifyPasscode_(candidate) {
  var props = PropertiesService.getScriptProperties();
  var secret = '';
  for (var i = 0; i < PASSCODE_PROP_KEYS.length; i++) {
    var val = props.getProperty(PASSCODE_PROP_KEYS[i]);
    if (val && String(val).trim() !== '') {
      secret = String(val).trim();
      break;
    }
  }

  if (!secret) {
    return {
      ok: false,
      code: 'SERVER_SECRET_NOT_CONFIGURED',
      error: 'Server ScriptProperties LFC_ADMIN_PASSCODE has not been configured yet.'
    };
  }

  var provided = String(candidate || '').trim();
  if (!provided || !timingSafeEqual_(provided, secret)) {
    return {
      ok: false,
      code: 'AUTH_INVALID',
      error: 'Invalid admin passcode. Access denied.'
    };
  }

  return { ok: true };
}

/**
 * Constant-time string comparison to prevent timing side-channels.
 */
function timingSafeEqual_(a, b) {
  var strA = String(a);
  var strB = String(b);
  var len = Math.max(strA.length, strB.length);
  var diff = strA.length ^ strB.length;
  for (var i = 0; i < len; i++) {
    var codeA = i < strA.length ? strA.charCodeAt(i) : 0;
    var codeB = i < strB.length ? strB.charCodeAt(i) : 0;
    diff |= (codeA ^ codeB);
  }
  return diff === 0;
}

/**
 * Build full JSON representation of workbook tabs + selected Friday tab (Rows 1..80, Cols A..G).
 */
function buildWorkbookPayload_(ss, requestedTab) {
  var sheets = ss.getSheets();
  var tabs = [];
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (!sh.isSheetHidden()) {
      tabs.push({
        name: sh.getName(),
        index: i
      });
    }
  }

  if (tabs.length === 0) {
    throw new Error('No visible tabs found in Weekly Treasurer Meeting Breakdown.');
  }

  var targetSheet = null;
  if (requestedTab) {
    targetSheet = ss.getSheetByName(String(requestedTab));
  }
  if (!targetSheet) {
    targetSheet = selectNearestFridaySheet_(ss, tabs);
  }

  var tabName = targetSheet.getName();
  var tabIndex = 0;
  for (var t = 0; t < tabs.length; t++) {
    if (tabs[t].name === tabName) {
      tabIndex = t;
      break;
    }
  }

  // Read A1:G80 in 3 batch calls (values, displayValues, formulas) for sub-second latency
  var range = targetSheet.getRange(1, 1, 80, 7);
  var rawValues = range.getValues();
  var displayValues = range.getDisplayValues();
  var formulas = range.getFormulas();

  return {
    ok: true,
    spreadsheetTitle: ss.getName(),
    spreadsheetId: SPREADSHEET_ID,
    tabs: tabs,
    activeTab: tabName,
    activeTabIndex: tabIndex,
    sheetData: serializeTabModel_(rawValues, displayValues, formulas, tabIndex)
  };
}

/**
 * Pick the Friday tab closest to today's date in America/New_York.
 */
function selectNearestFridaySheet_(ss, tabs) {
  var now = new Date();
  var todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var bestSheet = ss.getSheetByName(tabs[0].name);
  var bestDiff = Infinity;

  for (var i = 0; i < tabs.length; i++) {
    var sh = ss.getSheetByName(tabs[i].name);
    var c6Val = sh.getRange('C6').getValue();
    var ts = null;
    if (Object.prototype.toString.call(c6Val) === '[object Date]' && !isNaN(c6Val.getTime())) {
      ts = new Date(c6Val.getFullYear(), c6Val.getMonth(), c6Val.getDate()).getTime();
    }
    if (ts !== null) {
      var diff = Math.abs(ts - todayMidnight);
      // Prefer exact match or nearest Friday within the current week
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSheet = sh;
      }
    }
  }
  return bestSheet;
}

/**
 * Helper accessors for 0-indexed arrays mapped from A1 coordinates (Col A=0..G=6, Row 1=0..79).
 */
function a1ToRowCol_(a1) {
  var match = /^([A-G])(\d{1,2})$/.exec(String(a1).toUpperCase());
  if (!match) {
    throw new Error('Invalid cell reference: ' + a1);
  }
  var col = match[1].charCodeAt(0) - 65;
  var row = parseInt(match[2], 10) - 1;
  return { row: row, col: col };
}

function numVal_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && !isNaN(v)) return v;
  var cleaned = String(v).replace(/[$,\s]/g, '');
  if (cleaned === '') return null;
  var parsed = Number(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function strVal_(raw, disp) {
  if (raw === null || raw === undefined || raw === '') return '';
  if (Object.prototype.toString.call(raw) === '[object Date]') {
    return String(disp || '').trim();
  }
  return String(raw);
}

function isTaskDone_(raw, disp) {
  if (raw === true) return true;
  var s = String(raw !== null && raw !== undefined ? raw : disp || '').trim().toLowerCase();
  return s === 'done' || s === 'true' || s === 'yes' || s === '1';
}

/**
 * Serialize Rows 1..80 into a structured, 1:1 typed model for the PWA frontend.
 */
function serializeTabModel_(raw, disp, formulas, tabIndex) {
  function gRaw(a1) { var rc = a1ToRowCol_(a1); return raw[rc.row][rc.col]; }
  function gDisp(a1) { var rc = a1ToRowCol_(a1); return disp[rc.row][rc.col]; }
  function gForm(a1) { var rc = a1ToRowCol_(a1); return formulas[rc.row][rc.col] || ''; }

  var cashAccounts = [15, 16, 17].map(function (r) {
    return {
      row: r,
      label: String(gDisp('B' + r) || ''),
      balanceCell: 'C' + r,
      notesCell: 'D' + r,
      balance: numVal_(gRaw('C' + r)),
      notes: strVal_(gRaw('D' + r), gDisp('D' + r))
    };
  });

  var pendingDeposits = [22, 23, 24, 25].map(function (r) {
    return {
      row: r,
      label: String(gDisp('B' + r) || ''),
      amountCell: 'C' + r,
      notesCell: 'D' + r,
      amount: numVal_(gRaw('C' + r)),
      notes: strVal_(gRaw('D' + r), gDisp('D' + r))
    };
  });

  var bills = [];
  for (var r = 30; r <= 37; r++) {
    var paidRaw = String(gRaw('D' + r) || '').trim();
    bills.push({
      row: r,
      label: String(gDisp('B' + r) || ''),
      amountCell: 'C' + r,
      paidFromCell: 'D' + r,
      dueDateCell: 'E' + r,
      notesCell: 'F' + r,
      amount: numVal_(gRaw('C' + r)),
      paidFrom: (paidRaw === 'School' || paidRaw === 'General') ? paidRaw : '',
      dueDate: strVal_(gRaw('E' + r), gDisp('E' + r)),
      notes: strVal_(gRaw('F' + r), gDisp('F' + r))
    });
  }

  var checklist = [];
  for (var c = 55; c <= 64; c++) {
    checklist.push({
      row: c,
      task: String(gDisp('B' + c) || ''),
      doneCell: 'C' + c,
      notesCell: 'D' + c,
      done: isTaskDone_(gRaw('C' + c), gDisp('C' + c)),
      rawDone: gDisp('C' + c),
      notes: strVal_(gRaw('D' + c), gDisp('D' + c))
    });
  }

  var actionItems = [];
  for (var a = 69; a <= 73; a++) {
    actionItems.push({
      row: a,
      itemCell: 'B' + a,
      ownerCell: 'C' + a,
      dueCell: 'D' + a,
      notesCell: 'E' + a,
      item: strVal_(gRaw('B' + a), gDisp('B' + a)),
      owner: strVal_(gRaw('C' + a), gDisp('C' + a)),
      due: strVal_(gRaw('D' + a), gDisp('D' + a)),
      notes: strVal_(gRaw('E' + a), gDisp('E' + a))
    });
  }

  return {
    header: {
      title: String(gDisp('B2') || 'WEEKLY CHURCH CASH POSITION'),
      subtitle: String(gDisp('B3') || ''),
      meetingDate: String(gDisp('C6') || ''),
      meetingDateIso: formatIsoDateIfPossible_(gRaw('C6')),
      lookAheadEnd: String(gDisp('C7') || ''),
      lookAheadEndIso: formatIsoDateIfPossible_(gRaw('C7')),
      treasurerCell: 'F6',
      treasurer: strVal_(gRaw('F6'), gDisp('F6')),
      preparedByCell: 'F7',
      preparedBy: strVal_(gRaw('F7'), gDisp('F7'))
    },
    kpi: {
      overallStatus: String(gDisp('B11') || '✔ ALL CLEAR'),
      cashInBank: numVal_(gRaw('C11')) || 0,
      pendingDeposits: numVal_(gRaw('D11')) || 0,
      dueNext5Days: numVal_(gRaw('E11')) || 0,
      projectedCash: numVal_(gRaw('F11')) || 0
    },
    section1: {
      rows: cashAccounts,
      totalCashInBank: numVal_(gRaw('C18')) || 0
    },
    section2: {
      rows: pendingDeposits,
      totalPendingDeposits: numVal_(gRaw('C26')) || 0
    },
    section3: {
      rows: bills,
      totalDueNext5Days: numVal_(gRaw('C38')) || 0,
      paidFromGeneral: numVal_(gRaw('C39')) || 0,
      paidFromSchool: numVal_(gRaw('C40')) || 0
    },
    section4: {
      tip: String(gDisp('G44') || ''),
      columns: ['General Operating', 'School Operating', 'Other Accounts', 'Total'],
      cashToday: [numVal_(gRaw('C44')) || 0, numVal_(gRaw('D44')) || 0, numVal_(gRaw('E44')) || 0, numVal_(gRaw('F44')) || 0],
      pendingDeposits: [numVal_(gRaw('C45')) || 0, numVal_(gRaw('D45')) || 0, numVal_(gRaw('E45')) || 0, numVal_(gRaw('F45')) || 0],
      billsDue: [numVal_(gRaw('C46')) || 0, numVal_(gRaw('D46')) || 0, numVal_(gRaw('E46')) || 0, numVal_(gRaw('F46')) || 0],
      projectedCash: [numVal_(gRaw('C47')) || 0, numVal_(gRaw('D47')) || 0, numVal_(gRaw('E47')) || 0, numVal_(gRaw('F47')) || 0],
      cushion: {
        cells: ['C48', 'D48', 'E48'],
        values: [numVal_(gRaw('C48')), numVal_(gRaw('D48')), numVal_(gRaw('E48'))],
        hasCarryFormula: [Boolean(gForm('C48')), Boolean(gForm('D48')), Boolean(gForm('E48'))],
        total: numVal_(gRaw('F48')) || 0
      },
      status: [
        String(gDisp('C49') || '✔ OK'),
        String(gDisp('D49') || '✔ OK'),
        String(gDisp('E49') || '✔ OK'),
        String(gDisp('F49') || '✔ OK')
      ],
      lastWeekProjected: {
        cells: ['C50', 'D50', 'E50'],
        editable: tabIndex === 0 && !gForm('C50') && !gForm('D50') && !gForm('E50'),
        values: [numVal_(gRaw('C50')) || 0, numVal_(gRaw('D50')) || 0, numVal_(gRaw('E50')) || 0, numVal_(gRaw('F50')) || 0]
      },
      changeVsLastWeek: [numVal_(gRaw('C51')) || 0, numVal_(gRaw('D51')) || 0, numVal_(gRaw('E51')) || 0, numVal_(gRaw('F51')) || 0]
    },
    section5: {
      rows: checklist,
      sheetProgressRatio: numVal_(gRaw('C65')) || 0,
      sheetStatusText: String(gDisp('D65') || '')
    },
    section6: {
      actionItems: actionItems,
      discussionNotesCell: 'B76',
      discussionNotes: strVal_(gRaw('B76'), gDisp('B76'))
    }
  };
}

function formatIsoDateIfPossible_(val) {
  if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime())) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  return '';
}

/**
 * Apply dirty cell updates to a weekly Friday tab while strictly protecting formulas.
 */
function applyTabUpdates_(ss, tabName, updates) {
  if (!tabName) {
    throw new Error('Missing target tab name.');
  }
  var sheet = ss.getSheetByName(String(tabName));
  if (!sheet) {
    throw new Error('Tab not found: ' + tabName);
  }

  var allSheets = ss.getSheets().filter(function (s) { return !s.isSheetHidden(); });
  var sheetIdx = -1;
  for (var i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getName() === sheet.getName()) {
      sheetIdx = i;
      break;
    }
  }
  var prevTabName = sheetIdx > 0 ? allSheets[sheetIdx - 1].getName() : '';

  var updatedCells = [];
  var skippedFormulaCells = [];
  var keys = Object.keys(updates || {});

  for (var k = 0; k < keys.length; k++) {
    var a1 = String(keys[k]).toUpperCase().trim();
    var cellType = EDITABLE_CELL_TYPES[a1];
    if (!cellType) {
      // Reject any attempt to write outside the editable yellow/checklist cells
      skippedFormulaCells.push(a1);
      continue;
    }

    var cell = sheet.getRange(a1);
    var existingFormula = cell.getFormula();

    // Formula Protection Policy:
    // NEVER overwrite any formula cell, EXCEPT C48:E48 carry-forward cushion defaults
    // when the user explicitly enters a custom target cushion (or restores carry-forward if cleared).
    if (existingFormula && cellType !== 'cushion') {
      skippedFormulaCells.push(a1);
      continue;
    }

    var incoming = updates[keys[k]];

    if (cellType === 'number') {
      var n = numVal_(incoming);
      cell.setValue(n === null ? '' : n);
      updatedCells.push(a1);
    } else if (cellType === 'cushion') {
      var cVal = numVal_(incoming);
      if (cVal === null) {
        if (prevTabName) {
          var escapedPrev = prevTabName.replace(/'/g, "''");
          cell.setFormula("'" + escapedPrev + "'!" + a1);
        } else {
          cell.setValue('');
        }
      } else {
        cell.setValue(cVal);
      }
      updatedCells.push(a1);
    } else if (cellType === 'baseline_if_no_formula') {
      var bVal = numVal_(incoming);
      cell.setValue(bVal === null ? '' : bVal);
      updatedCells.push(a1);
    } else if (cellType === 'paid_from') {
      var pf = String(incoming || '').trim();
      if (pf === 'General Operating') pf = 'General';
      if (pf === 'School Operating') pf = 'School';
      if (pf !== '' && pf !== 'General' && pf !== 'School') {
        throw new Error('Invalid Paid From value at ' + a1 + ': must be General, School, or blank.');
      }
      cell.setValue(pf);
      updatedCells.push(a1);
    } else if (cellType === 'checklist_done') {
      var done = incoming === true || String(incoming).trim().toLowerCase() === 'done' || String(incoming).trim().toLowerCase() === 'true';
      var dv = cell.getDataValidation();
      if (dv && dv.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
        if (done) {
          cell.check();
        } else {
          cell.uncheck();
        }
      } else {
        cell.setValue(done ? 'Done' : false);
      }
      updatedCells.push(a1);
    } else {
      // string / date_or_string — sanitize leading '=' or '+'/'-'/'@' formula injection!
      var s = incoming === null || incoming === undefined ? '' : String(incoming);
      if (/^[=+\-@]/.test(s.trim())) {
        s = "'" + s;
      }
      cell.setValue(s);
      updatedCells.push(a1);
    }
  }

  return {
    savedCount: updatedCells.length,
    updatedCells: updatedCells,
    skippedFormulaCells: skippedFormulaCells
  };
}

/**
 * Create the next weekly Friday tab cloned from the latest Friday tab, clearing yellow inputs
 * while preserving all layout, formatting, validations, and cross-tab formulas.
 */
function createNextFridayTab_(ss, sourceTabName, requestedNewName) {
  var visibleSheets = ss.getSheets().filter(function (s) { return !s.isSheetHidden(); });
  var sourceSheet = sourceTabName ? ss.getSheetByName(sourceTabName) : visibleSheets[visibleSheets.length - 1];
  if (!sourceSheet) {
    sourceSheet = visibleSheets[visibleSheets.length - 1];
  }

  var prevName = sourceSheet.getName();
  var prevDate = sourceSheet.getRange('C6').getValue();
  var computedLabel = '';
  if (Object.prototype.toString.call(prevDate) === '[object Date]' && !isNaN(prevDate.getTime())) {
    var nextFriday = new Date(prevDate.getTime());
    nextFriday.setDate(nextFriday.getDate() + 7);
    computedLabel = Utilities.formatDate(nextFriday, ss.getSpreadsheetTimeZone() || 'America/New_York', 'MMM d');
  }

  var finalName = String(requestedNewName || computedLabel || (prevName + ' +7d')).trim();
  if (ss.getSheetByName(finalName)) {
    throw new Error('A Friday tab named "' + finalName + '" already exists.');
  }

  var cloned = sourceSheet.copyTo(ss);
  cloned.setName(finalName);
  ss.setActiveSheet(cloned);
  ss.moveActiveSheet(ss.getNumSheets());

  var escapedPrev = prevName.replace(/'/g, "''");

  // Chain formulas to previous Friday tab
  cloned.getRange('C6').setFormula("'" + escapedPrev + "'!C6+7");
  cloned.getRange('C7').setFormula('=C6+5');
  cloned.getRange('C48').setFormula("'" + escapedPrev + "'!C48");
  cloned.getRange('D48').setFormula("'" + escapedPrev + "'!D48");
  cloned.getRange('E48').setFormula("'" + escapedPrev + "'!E48");
  cloned.getRange('C50').setFormula("'" + escapedPrev + "'!C47");
  cloned.getRange('D50').setFormula("'" + escapedPrev + "'!D47");
  cloned.getRange('E50').setFormula("'" + escapedPrev + "'!E47");

  // Clear weekly yellow input ranges without touching formulas or formatting
  var clearRanges = [
    'C15:D17',
    'C22:D25',
    'C30:F37',
    'D55:D64',
    'B69:E73',
    'B76'
  ];
  for (var i = 0; i < clearRanges.length; i++) {
    cloned.getRange(clearRanges[i]).clearContent();
  }

  // Reset checklist toggles C55:C64 to unchecked FALSE
  for (var r = 55; r <= 64; r++) {
    var cCell = cloned.getRange('C' + r);
    var dv = cCell.getDataValidation();
    if (dv && dv.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
      cCell.uncheck();
    } else {
      cCell.setValue(false);
    }
  }

  return finalName;
}

/**
 * Output JSON response with Google Apps Script ContentService.
 */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
