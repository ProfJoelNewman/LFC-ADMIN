/**
 * LFC ADMIN — Main Application Controller (app.js)
 *
 * Security & Data Integrity:
 * - Zero hardcoded passcodes or financial figures exist in client code.
 * - Passcode is verified server-side on EVERY read/write request to Google Apps Script.
 * - Only explicitly dirtied yellow input cells / checklist toggles are transmitted on save;
 *   formula cells are never sent or overwritten.
 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    gasUrl: 'lfc_admin_gas_url',
    sessionPass: 'lfc_admin_session_v1',
    encBlob: 'lfc_admin_device_cipher_v1',
    autoSave: 'lfc_admin_autosave_v1'
  };

  const IDB_CFG = {
    dbName: 'lfc_admin_vault_db',
    storeName: 'keys',
    keyId: 'device_aes_key'
  };

  const state = {
    passcode: '',
    authenticated: false,
    tabs: [],
    activeTab: '',
    activeTabIndex: 0,
    sheetData: null,
    dirtyUpdates: {},
    isSyncing: false,
    autoSaveEnabled: true,
    autoSaveTimer: null,
    deferredInstallPrompt: null
  };

  const els = {};

  function cacheDom() {
    const ids = [
      'login-view', 'dashboard-view', 'login-form', 'passcode-input',
      'toggle-passcode-btn', 'persist-session-chk', 'remember-device-chk',
      'login-error', 'unlock-btn', 'unlock-btn-label',
      'vault-endpoint-details', 'endpoint-status-pill', 'vault-api-url',
      'save-vault-endpoint-btn', 'vault-install-btn',
      'sync-badge', 'autosave-chk', 'header-save-btn', 'header-save-label',
      'refresh-btn', 'install-app-btn', 'print-btn', 'open-sheet-btn', 'lock-btn',
      'print-meta',
      'kpi-status-badge', 'kpi-cash-bank', 'kpi-pending', 'kpi-due-5d', 'kpi-projected',
      'week-select', 'prev-week-btn', 'next-week-btn', 'week-pills', 'new-friday-tab-btn',
      'meta-meeting-date', 'meta-lookahead', 'input-treasurer', 'input-prepared-by',
      'sec1-rows', 'sec1-total',
      'sec2-rows', 'sec2-total',
      'sec3-rows', 'sec3-total-due', 'sec3-paid-general', 'sec3-paid-school',
      'sec4-tip', 'sec4-matrix-body', 'sec4-mobile-cards',
      'sec5-status-pill', 'sec5-progress-fill', 'sec5-progress-label', 'sec5-sheet-note', 'sec5-rows',
      'sec6-actions', 'input-discussion-notes', 'footer-save-btn',
      'unsaved-bar', 'unsaved-count-text', 'discard-btn', 'bar-save-btn',
      'footer-install-btn', 'footer-print-btn',
      'install-modal', 'native-install-banner', 'trigger-native-install-btn',
      'new-tab-modal', 'new-tab-form', 'new-tab-name-input', 'confirm-new-tab-btn',
      'toast-region'
    ];
    for (const id of ids) {
      els[id] = document.getElementById(id);
    }
  }

  /* ========================================================================
     Formatting & Sanitization Helpers
     ======================================================================== */
  const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const numberInputFmt = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function fmtCurrency(val) {
    const n = window.LFC_CALC.toNum(val);
    return currencyFmt.format(n);
  }

  function fmtSignedCurrency(val) {
    const n = window.LFC_CALC.toNum(val);
    if (Math.abs(n) < 0.005) return '$0.00';
    return (n > 0 ? '+' : '') + currencyFmt.format(n);
  }

  function fmtInputNumber(val) {
    const opt = window.LFC_CALC.toOptionalNum(val);
    if (opt === null) return '';
    return numberInputFmt.format(opt);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusPillClass(statusText) {
    const s = String(statusText || '').toUpperCase();
    if (s.includes('SHORTFALL')) return 'status-pill status-pill--alert';
    if (s.includes('BELOW')) return 'status-pill status-pill--warn';
    return 'status-pill status-pill--clear';
  }

  function showToast(message, variant = 'ok') {
    if (!els['toast-region']) return;
    const node = document.createElement('div');
    node.className = `toast ${variant === 'error' ? 'toast--error' : variant === 'info' ? 'toast--info' : ''}`;
    node.textContent = message;
    els['toast-region'].appendChild(node);
    setTimeout(() => {
      node.remove();
    }, 4200);
  }

  /* ========================================================================
     Endpoint Resolution & HTTPS / Localhost Validation
     ======================================================================== */
  function isAllowedApiUrl(rawUrl) {
    if (!rawUrl) return false;
    try {
      const u = new URL(rawUrl);
      if (u.protocol === 'https:') return true;
      if (u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost')) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  function resolveGasUrl() {
    const params = new URLSearchParams(window.location.search);
    const queryApi = params.get('api');
    if (queryApi && isAllowedApiUrl(queryApi)) {
      localStorage.setItem(STORAGE_KEYS.gasUrl, queryApi.trim());
      params.delete('api');
      const cleanQuery = params.toString();
      const cleanUrl = window.location.pathname + (cleanQuery ? '?' + cleanQuery : '') + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
      return queryApi.trim();
    }
    const saved = localStorage.getItem(STORAGE_KEYS.gasUrl);
    if (saved && isAllowedApiUrl(saved)) return saved.trim();
    const cfgUrl = window.LFC_ADMIN_CONFIG?.defaultGasWebAppUrl || '';
    if (cfgUrl && isAllowedApiUrl(cfgUrl)) return cfgUrl.trim();
    return '';
  }

  function syncEndpointUi() {
    const url = resolveGasUrl();
    if (els['vault-api-url']) {
      els['vault-api-url'].value = url;
    }
    if (els['endpoint-status-pill']) {
      if (url) {
        els['endpoint-status-pill'].textContent = 'Configured';
        els['endpoint-status-pill'].className = 'mini-pill mini-pill--ok';
      } else {
        els['endpoint-status-pill'].textContent = 'Setup Needed';
        els['endpoint-status-pill'].className = 'mini-pill';
        if (els['vault-endpoint-details']) {
          els['vault-endpoint-details'].open = true;
        }
      }
    }
  }

  /* ========================================================================
     Encrypted 12-Hour Device Session (WebCrypto AES-GCM + IndexedDB Key)
     Raw passcode is NEVER stored in plaintext in localStorage.
     ======================================================================== */
  function openVaultIdb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = indexedDB.open(IDB_CFG.dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_CFG.storeName)) {
          db.createObjectStore(IDB_CFG.storeName);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveEncryptedDevicePasscode(passcode) {
    if (!window.crypto?.subtle) return;
    try {
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false, // non-extractable CryptoKey
        ['encrypt', 'decrypt']
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const payload = JSON.stringify({
        p: passcode,
        exp: Date.now() + 12 * 60 * 60 * 1000
      });
      const cipherBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(payload)
      );

      const db = await openVaultIdb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_CFG.storeName, 'readwrite');
        tx.objectStore(IDB_CFG.storeName).put(key, IDB_CFG.keyId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();

      localStorage.setItem(
        STORAGE_KEYS.encBlob,
        JSON.stringify({
          iv: Array.from(iv),
          ct: Array.from(new Uint8Array(cipherBuf))
        })
      );
    } catch (_) {
      // Fallback silently to session-only if IndexedDB/WebCrypto restricted
    }
  }

  async function loadEncryptedDevicePasscode() {
    if (!window.crypto?.subtle) return '';
    try {
      const rawBlob = localStorage.getItem(STORAGE_KEYS.encBlob);
      if (!rawBlob) return '';
      const parsed = JSON.parse(rawBlob);
      const db = await openVaultIdb();
      const key = await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_CFG.storeName, 'readonly');
        const g = tx.objectStore(IDB_CFG.storeName).get(IDB_CFG.keyId);
        g.onsuccess = () => resolve(g.result);
        g.onerror = () => reject(g.error);
      });
      db.close();
      if (!key) return '';

      const plainBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(parsed.iv) },
        key,
        new Uint8Array(parsed.ct)
      );
      const data = JSON.parse(new TextDecoder().decode(plainBuf));
      if (!data.exp || Date.now() > data.exp) {
        await clearStoredSession();
        return '';
      }
      return String(data.p || '');
    } catch (_) {
      return '';
    }
  }

  async function clearStoredSession() {
    sessionStorage.removeItem(STORAGE_KEYS.sessionPass);
    localStorage.removeItem(STORAGE_KEYS.encBlob);
    try {
      const db = await openVaultIdb();
      await new Promise((resolve) => {
        const tx = db.transaction(IDB_CFG.storeName, 'readwrite');
        tx.objectStore(IDB_CFG.storeName).delete(IDB_CFG.keyId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    } catch (_) {
      // ignore
    }
  }

  /* ========================================================================
     Google Apps Script Network Transport (CORS Preflight-Free HTTPS POST)
     ======================================================================== */
  async function callGasBackend(action, payload = {}, passcodeOverride = null) {
    const apiUrl = resolveGasUrl();
    if (!apiUrl) {
      throw new Error(
        'Google Apps Script Web App URL is not configured yet. Open "Google Apps Script Sync Endpoint" below and paste your Web App /exec URL.'
      );
    }

    const activePass = passcodeOverride !== null ? passcodeOverride : state.passcode;
    const reqBody = JSON.stringify({
      ...payload,
      action,
      passcode: activePass
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        // text/plain avoids CORS OPTIONS preflight on Google Apps Script Web Apps
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: reqBody,
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Backend HTTP ${response.status} error.`);
    }

    const json = await response.json();
    if (!json || json.ok !== true) {
      const err = new Error(json?.error || 'Request rejected by Google Apps Script.');
      err.code = json?.code || 'API_ERROR';
      throw err;
    }
    return json;
  }

  /* ========================================================================
     Sync Status UI & Dirty Cell Tracking
     ======================================================================== */
  function setSyncPill(mode, customText) {
    const badge = els['sync-badge'];
    if (!badge) return;
    badge.className = 'sync-pill';
    if (mode === 'syncing') {
      badge.classList.add('sync-pill--syncing');
      badge.textContent = customText || 'SYNCING…';
    } else if (mode === 'dirty') {
      badge.classList.add('sync-pill--dirty');
      badge.textContent = customText || 'UNSAVED';
    } else if (mode === 'error') {
      badge.classList.add('sync-pill--error');
      badge.textContent = customText || 'SYNC ERROR';
    } else {
      badge.classList.add('sync-pill--synced');
      badge.textContent = customText || 'SYNCED';
    }
  }

  function updateDirtyIndicators() {
    const count = Object.keys(state.dirtyUpdates).length;
    if (count > 0) {
      setSyncPill('dirty', `${count} UNSAVED`);
      if (els['unsaved-bar']) {
        els['unsaved-bar'].hidden = false;
        els['unsaved-count-text'].textContent = `${count} unsaved ${count === 1 ? 'edit' : 'edits'} on ${state.activeTab}`;
      }
      if (els['header-save-label']) {
        els['header-save-label'].textContent = `Save & Sync (${count})`;
      }
    } else {
      if (!state.isSyncing) setSyncPill('synced', 'SYNCED');
      if (els['unsaved-bar']) els['unsaved-bar'].hidden = true;
      if (els['header-save-label']) els['header-save-label'].textContent = 'Save & Sync';
    }
  }

  function recordCellEdit(cell, value, domEl) {
    state.dirtyUpdates[cell] = value;
    if (domEl) domEl.classList.add('is-dirty');
    updateDirtyIndicators();
    refreshComputedViewsOnly();

    if (state.autoSaveEnabled) {
      if (state.autoSaveTimer) clearTimeout(state.autoSaveTimer);
      state.autoSaveTimer = setTimeout(() => {
        if (Object.keys(state.dirtyUpdates).length > 0 && !state.isSyncing) {
          saveCurrentTab({ isAuto: true });
        }
      }, 1800);
    }
  }

  /* ========================================================================
     Full Dashboard Rendering
     ======================================================================== */
  function applyWorkbookResponse(res) {
    state.tabs = Array.isArray(res.tabs) ? res.tabs : [];
    state.activeTab = res.activeTab || (state.tabs[0]?.name || '');
    state.activeTabIndex = typeof res.activeTabIndex === 'number' ? res.activeTabIndex : 0;
    state.sheetData = res.sheetData;
    state.dirtyUpdates = {};
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
      state.autoSaveTimer = null;
    }

    renderWeekSelector();
    renderMeetingHeader();
    renderSection1();
    renderSection2();
    renderSection3();
    renderSection4Full();
    renderSection5();
    renderSection6();
    refreshComputedViewsOnly();
    updateDirtyIndicators();
  }

  function renderWeekSelector() {
    // Dropdown
    els['week-select'].innerHTML = state.tabs
      .map(
        (t) =>
          `<option value="${escapeHtml(t.name)}" ${t.name === state.activeTab ? 'selected' : ''}>Friday — ${escapeHtml(t.name)}</option>`
      )
      .join('');

    // Prev / Next buttons
    els['prev-week-btn'].disabled = state.activeTabIndex <= 0;
    els['next-week-btn'].disabled = state.activeTabIndex >= state.tabs.length - 1;

    // Scrollable Friday Pills
    els['week-pills'].innerHTML = state.tabs
      .map((t) => {
        const active = t.name === state.activeTab;
        return `<button type="button" role="tab" aria-selected="${active}" class="week-pill ${active ? 'is-active' : ''}" data-tab-name="${escapeHtml(t.name)}">${escapeHtml(t.name)}</button>`;
      })
      .join('');

    const activePill = els['week-pills'].querySelector('.week-pill.is-active');
    if (activePill && typeof activePill.scrollIntoView === 'function') {
      activePill.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }

  function renderMeetingHeader() {
    const h = state.sheetData?.header || {};
    els['meta-meeting-date'].textContent = h.meetingDate || state.activeTab || '—';
    const windowStr =
      h.meetingDate && h.lookAheadEnd
        ? `${h.meetingDate} → ${h.lookAheadEnd}`
        : h.lookAheadEnd || '5 Days from Meeting';
    els['meta-lookahead'].textContent = windowStr;

    els['input-treasurer'].value = h.treasurer || '';
    els['input-treasurer'].classList.remove('is-dirty');
    els['input-prepared-by'].value = h.preparedBy || '';
    els['input-prepared-by'].classList.remove('is-dirty');
  }

  function renderSection1() {
    const rows = state.sheetData?.section1?.rows || [];
    els['sec1-rows'].innerHTML = rows
      .map(
        (r) => `
        <div class="item-card">
          <div class="item-card__header">
            <span class="item-card__title">${escapeHtml(r.label)}</span>
            <span class="editable-tag">EDIT ${escapeHtml(r.balanceCell)}</span>
          </div>
          <div class="item-card__inputs">
            <div class="currency-field">
              <span class="currency-prefix">$</span>
              <input
                type="text"
                inputmode="decimal"
                data-cell="${escapeHtml(r.balanceCell)}"
                data-kind="currency"
                class="sheet-input"
                aria-label="${escapeHtml(r.label)} Balance Today"
                placeholder="0.00"
                value="${escapeHtml(fmtInputNumber(r.balance))}"
              />
            </div>
            <input
              type="text"
              data-cell="${escapeHtml(r.notesCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="${escapeHtml(r.label)} Notes or Source"
              placeholder="Notes / bank source..."
              value="${escapeHtml(r.notes)}"
            />
          </div>
        </div>`
      )
      .join('');
  }

  function renderSection2() {
    const rows = state.sheetData?.section2?.rows || [];
    els['sec2-rows'].innerHTML = rows
      .map(
        (r) => `
        <div class="item-card">
          <div class="item-card__header">
            <span class="item-card__title">${escapeHtml(r.label)}</span>
            <span class="editable-tag">EDIT ${escapeHtml(r.amountCell)}</span>
          </div>
          <div class="item-card__inputs">
            <div class="currency-field">
              <span class="currency-prefix">$</span>
              <input
                type="text"
                inputmode="decimal"
                data-cell="${escapeHtml(r.amountCell)}"
                data-kind="currency"
                class="sheet-input"
                aria-label="${escapeHtml(r.label)} Amount"
                placeholder="0.00"
                value="${escapeHtml(fmtInputNumber(r.amount))}"
              />
            </div>
            <input
              type="text"
              data-cell="${escapeHtml(r.notesCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="${escapeHtml(r.label)} Notes"
              placeholder="Deposit timing / batch notes..."
              value="${escapeHtml(r.notes)}"
            />
          </div>
        </div>`
      )
      .join('');
  }

  function renderSection3() {
    const rows = state.sheetData?.section3?.rows || [];
    els['sec3-rows'].innerHTML = rows
      .map(
        (r) => `
        <div class="bill-row">
          <div class="bill-row__label">${escapeHtml(r.label)}</div>

          <div>
            <span class="mobile-field-caption">AMOUNT (${escapeHtml(r.amountCell)})</span>
            <div class="currency-field">
              <span class="currency-prefix">$</span>
              <input
                type="text"
                inputmode="decimal"
                data-cell="${escapeHtml(r.amountCell)}"
                data-kind="currency"
                class="sheet-input"
                aria-label="${escapeHtml(r.label)} Amount"
                placeholder="0.00"
                value="${escapeHtml(fmtInputNumber(r.amount))}"
              />
            </div>
          </div>

          <div>
            <span class="mobile-field-caption">PAID FROM (${escapeHtml(r.paidFromCell)})</span>
            <select
              data-cell="${escapeHtml(r.paidFromCell)}"
              data-kind="select"
              class="sheet-select"
              aria-label="${escapeHtml(r.label)} Paid From Account"
            >
              <option value="" ${r.paidFrom === '' ? 'selected' : ''}>General (Default)</option>
              <option value="General" ${r.paidFrom === 'General' ? 'selected' : ''}>General Operating</option>
              <option value="School" ${r.paidFrom === 'School' ? 'selected' : ''}>School Operating</option>
            </select>
          </div>

          <div>
            <span class="mobile-field-caption">DUE DATE (${escapeHtml(r.dueDateCell)})</span>
            <input
              type="text"
              data-cell="${escapeHtml(r.dueDateCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="${escapeHtml(r.label)} Due Date"
              placeholder="MM/DD"
              value="${escapeHtml(r.dueDate)}"
            />
          </div>

          <div class="bill-row__notes">
            <span class="mobile-field-caption">NOTES (${escapeHtml(r.notesCell)})</span>
            <input
              type="text"
              data-cell="${escapeHtml(r.notesCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="${escapeHtml(r.label)} Notes"
              placeholder="Payee / approval note..."
              value="${escapeHtml(r.notes)}"
            />
          </div>
        </div>`
      )
      .join('');
  }

  function renderSection4Full() {
    const s4 = state.sheetData?.section4;
    if (!s4) return;
    if (s4.tip) els['sec4-tip'].textContent = s4.tip;

    const cushCells = s4.cushion.cells; // ['C48', 'D48', 'E48']
    const cushVals = s4.cushion.values;

    els['sec4-matrix-body'].innerHTML = `
      <tr>
        <td><span class="matrix-metric-name">Cash in bank today <span class="formula-tag">R44</span></span></td>
        <td class="num-col" id="m-r44-0">$0.00</td>
        <td class="num-col" id="m-r44-1">$0.00</td>
        <td class="num-col" id="m-r44-2">$0.00</td>
        <td class="num-col total-col" id="m-r44-3">$0.00</td>
      </tr>
      <tr>
        <td><span class="matrix-metric-name">+ Pending deposits (to General) <span class="formula-tag">R45</span></span></td>
        <td class="num-col" id="m-r45-0">$0.00</td>
        <td class="num-col" id="m-r45-1">$0.00</td>
        <td class="num-col" id="m-r45-2">$0.00</td>
        <td class="num-col total-col" id="m-r45-3">$0.00</td>
      </tr>
      <tr>
        <td><span class="matrix-metric-name">&ndash; Bills &amp; payroll due in next 5 days <span class="formula-tag">R46</span></span></td>
        <td class="num-col" id="m-r46-0">$0.00</td>
        <td class="num-col" id="m-r46-1">$0.00</td>
        <td class="num-col" id="m-r46-2">$0.00</td>
        <td class="num-col total-col" id="m-r46-3">$0.00</td>
      </tr>
      <tr class="matrix-row--highlight">
        <td><span class="matrix-metric-name">PROJECTED CASH AFTER 5 DAYS <span class="formula-tag">R47</span></span></td>
        <td class="num-col" id="m-r47-0">$0.00</td>
        <td class="num-col" id="m-r47-1">$0.00</td>
        <td class="num-col" id="m-r47-2">$0.00</td>
        <td class="num-col total-col" id="m-r47-3">$0.00</td>
      </tr>
      <tr>
        <td><span class="matrix-metric-name">Minimum cash cushion (target) <span class="editable-tag">EDIT C48:E48</span></span></td>
        ${[0, 1, 2]
          .map(
            (idx) => `
          <td class="num-col">
            <div class="currency-field">
              <span class="currency-prefix">$</span>
              <input
                type="text"
                inputmode="decimal"
                data-cell="${escapeHtml(cushCells[idx])}"
                data-kind="currency"
                class="sheet-input"
                aria-label="Minimum cash cushion ${escapeHtml(s4.columns[idx])}"
                placeholder="0.00"
                value="${escapeHtml(fmtInputNumber(cushVals[idx]))}"
              />
            </div>
          </td>`
          )
          .join('')}
        <td class="num-col total-col" id="m-r48-3">$0.00</td>
      </tr>
      <tr>
        <td><span class="matrix-metric-name">Account Status <span class="formula-tag">R49</span></span></td>
        <td class="num-col"><span id="m-r49-0" class="status-pill status-pill--clear">&#10004; OK</span></td>
        <td class="num-col"><span id="m-r49-1" class="status-pill status-pill--clear">&#10004; OK</span></td>
        <td class="num-col"><span id="m-r49-2" class="status-pill status-pill--clear">&#10004; OK</span></td>
        <td class="num-col total-col"><span id="m-r49-3" class="status-pill status-pill--clear">&#10004; OK</span></td>
      </tr>
      <tr>
        <td><span class="matrix-metric-name">Last week&rsquo;s projected cash <span class="formula-tag">R50</span></span></td>
        <td class="num-col" id="m-r50-0">$0.00</td>
        <td class="num-col" id="m-r50-1">$0.00</td>
        <td class="num-col" id="m-r50-2">$0.00</td>
        <td class="num-col total-col" id="m-r50-3">$0.00</td>
      </tr>
      <tr>
        <td><span class="matrix-metric-name">Change vs. last week <span class="formula-tag">R51</span></span></td>
        <td class="num-col" id="m-r51-0">$0.00</td>
        <td class="num-col" id="m-r51-1">$0.00</td>
        <td class="num-col" id="m-r51-2">$0.00</td>
        <td class="num-col total-col" id="m-r51-3">$0.00</td>
      </tr>
    `;

    // Mobile Stacked Cards (Total first, then General, School, Other)
    const mobileOrder = [
      { idx: 3, title: 'TOTAL CHURCH CASH POSITION', isTotal: true, cushCell: null },
      { idx: 0, title: 'GENERAL OPERATING', isTotal: false, cushCell: 'C48' },
      { idx: 1, title: 'SCHOOL OPERATING', isTotal: false, cushCell: 'D48' },
      { idx: 2, title: 'OTHER ACCOUNTS (RESERVE)', isTotal: false, cushCell: 'E48' }
    ];

    els['sec4-mobile-cards'].innerHTML = mobileOrder
      .map(
        (m) => `
        <div class="acct-summary-card ${m.isTotal ? 'acct-summary-card--total' : ''}">
          <div class="acct-summary-card__head">
            <span class="acct-summary-card__title">${escapeHtml(m.title)}</span>
            <span id="mc-status-${m.idx}" class="status-pill status-pill--clear">&#10004; OK</span>
          </div>
          <div class="acct-kv"><span>Cash in bank today</span><strong id="mc-cash-${m.idx}">$0.00</strong></div>
          <div class="acct-kv"><span>+ Pending deposits</span><strong id="mc-pend-${m.idx}">$0.00</strong></div>
          <div class="acct-kv"><span>&ndash; Bills &amp; payroll (5d)</span><strong id="mc-bills-${m.idx}">$0.00</strong></div>
          <div class="acct-kv acct-kv--projected"><span>PROJECTED AFTER 5 DAYS</span><strong id="mc-proj-${m.idx}">$0.00</strong></div>
          ${
            m.cushCell
              ? `<div class="acct-kv">
                  <span>Target cushion (${m.cushCell})</span>
                  <div class="currency-field" style="max-width: 145px;">
                    <span class="currency-prefix">$</span>
                    <input
                      type="text"
                      inputmode="decimal"
                      data-cell="${m.cushCell}"
                      data-kind="currency"
                      class="sheet-input"
                      aria-label="${escapeHtml(m.title)} Minimum Cushion"
                      placeholder="0.00"
                      value="${escapeHtml(fmtInputNumber(cushVals[m.idx]))}"
                    />
                  </div>
                </div>`
              : `<div class="acct-kv"><span>Total minimum cushion</span><strong id="mc-cush-3">$0.00</strong></div>`
          }
          <div class="acct-kv"><span>Last week&rsquo;s projected</span><strong id="mc-lw-${m.idx}">$0.00</strong></div>
          <div class="acct-kv"><span>Change vs. last week</span><strong id="mc-chg-${m.idx}">$0.00</strong></div>
        </div>`
      )
      .join('');
  }

  function renderSection5() {
    const rows = state.sheetData?.section5?.rows || [];
    els['sec5-rows'].innerHTML = rows
      .map(
        (r) => `
        <div class="task-row ${r.done ? 'is-done' : ''}" data-task-row="${escapeHtml(r.doneCell)}">
          <div class="task-row__main">
            <button
              type="button"
              role="switch"
              aria-checked="${r.done ? 'true' : 'false'}"
              class="task-toggle-btn"
              data-toggle-cell="${escapeHtml(r.doneCell)}"
            >
              <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
              <span class="task-title">${escapeHtml(r.task)}</span>
            </button>
            <span class="task-state-tag" data-state-tag="${escapeHtml(r.doneCell)}">${r.done ? 'Done' : 'FALSE'}</span>
          </div>
          <input
            type="text"
            data-cell="${escapeHtml(r.notesCell)}"
            data-kind="text"
            class="sheet-input"
            aria-label="${escapeHtml(r.task)} Notes"
            placeholder="Optional checklist note..."
            value="${escapeHtml(r.notes)}"
          />
        </div>`
      )
      .join('');
  }

  function renderSection6() {
    const actions = state.sheetData?.section6?.actionItems || [];
    els['sec6-actions'].innerHTML = actions
      .map(
        (a, idx) => `
        <div class="action-row">
          <div class="action-row__item">
            <span class="mobile-field-caption">ACTION ITEM #${idx + 1} (${escapeHtml(a.itemCell)})</span>
            <input
              type="text"
              data-cell="${escapeHtml(a.itemCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="Action item ${idx + 1}"
              placeholder="Action item #${idx + 1}..."
              value="${escapeHtml(a.item)}"
            />
          </div>
          <div>
            <span class="mobile-field-caption">OWNER (${escapeHtml(a.ownerCell)})</span>
            <input
              type="text"
              data-cell="${escapeHtml(a.ownerCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="Action item ${idx + 1} Owner"
              placeholder="Owner"
              value="${escapeHtml(a.owner)}"
            />
          </div>
          <div>
            <span class="mobile-field-caption">DUE (${escapeHtml(a.dueCell)})</span>
            <input
              type="text"
              data-cell="${escapeHtml(a.dueCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="Action item ${idx + 1} Due Date"
              placeholder="Due"
              value="${escapeHtml(a.due)}"
            />
          </div>
          <div class="action-row__notes">
            <span class="mobile-field-caption">NOTES (${escapeHtml(a.notesCell)})</span>
            <input
              type="text"
              data-cell="${escapeHtml(a.notesCell)}"
              data-kind="text"
              class="sheet-input"
              aria-label="Action item ${idx + 1} Notes"
              placeholder="Notes..."
              value="${escapeHtml(a.notes)}"
            />
          </div>
        </div>`
      )
      .join('');

    els['input-discussion-notes'].value = state.sheetData?.section6?.discussionNotes || '';
    els['input-discussion-notes'].classList.remove('is-dirty');
  }

  /**
   * Instant 0ms update of all formula/KPI/progress readouts without re-creating focused inputs.
   */
  function refreshComputedViewsOnly() {
    const live = window.LFC_CALC.computeLiveState(state.sheetData, state.dirtyUpdates);
    if (!live) return;

    // Sticky KPI Strip
    els['kpi-status-badge'].textContent = live.kpi.overallStatus;
    els['kpi-status-badge'].className = statusPillClass(live.kpi.overallStatus);
    els['kpi-cash-bank'].textContent = fmtCurrency(live.kpi.cashInBank);
    els['kpi-pending'].textContent = fmtCurrency(live.kpi.pendingDeposits);
    els['kpi-due-5d'].textContent = fmtCurrency(live.kpi.dueNext5Days);
    els['kpi-projected'].textContent = fmtCurrency(live.kpi.projectedCash);
    els['kpi-projected'].className =
      'kpi-value ' +
      (live.kpi.projectedCash < 0
        ? 'kpi-value--crimson'
        : live.kpi.overallStatus.includes('BELOW')
        ? 'kpi-value--gold'
        : 'kpi-value--emerald');

    // Section 1, 2, 3 Totals
    els['sec1-total'].textContent = fmtCurrency(live.section1Total);
    els['sec2-total'].textContent = fmtCurrency(live.section2Total);
    els['sec3-total-due'].textContent = fmtCurrency(live.section3Totals.totalDueNext5Days);
    els['sec3-paid-general'].textContent = fmtCurrency(live.section3Totals.paidFromGeneral);
    els['sec3-paid-school'].textContent = fmtCurrency(live.section3Totals.paidFromSchool);

    // Section 4 Desktop + Mobile Formula Cells
    for (let i = 0; i < 4; i++) {
      const setTxt = (id, t) => {
        const el = document.getElementById(id);
        if (el) el.textContent = t;
      };
      setTxt(`m-r44-${i}`, fmtCurrency(live.section4.cashToday[i]));
      setTxt(`m-r45-${i}`, fmtCurrency(live.section4.pendingDeposits[i]));
      setTxt(`m-r46-${i}`, fmtCurrency(live.section4.billsDue[i]));
      setTxt(`m-r47-${i}`, fmtCurrency(live.section4.projectedCash[i]));
      setTxt(`m-r50-${i}`, fmtCurrency(live.section4.lastWeekProjected[i]));

      const chgVal = live.section4.changeVsLastWeek[i];
      const chgClass = chgVal > 0.004 ? 'delta-pos' : chgVal < -0.004 ? 'delta-neg' : '';
      const m51 = document.getElementById(`m-r51-${i}`);
      if (m51) {
        m51.textContent = fmtSignedCurrency(chgVal);
        m51.className = `num-col ${i === 3 ? 'total-col' : ''} ${chgClass}`;
      }

      const stEl = document.getElementById(`m-r49-${i}`);
      if (stEl) {
        stEl.textContent = live.section4.statuses[i];
        stEl.className = statusPillClass(live.section4.statuses[i]);
      }

      // Mobile card mirrors
      setTxt(`mc-cash-${i}`, fmtCurrency(live.section4.cashToday[i]));
      setTxt(`mc-pend-${i}`, fmtCurrency(live.section4.pendingDeposits[i]));
      setTxt(`mc-bills-${i}`, fmtCurrency(live.section4.billsDue[i]));
      setTxt(`mc-proj-${i}`, fmtCurrency(live.section4.projectedCash[i]));
      setTxt(`mc-lw-${i}`, fmtCurrency(live.section4.lastWeekProjected[i]));
      const mcChg = document.getElementById(`mc-chg-${i}`);
      if (mcChg) {
        mcChg.textContent = fmtSignedCurrency(chgVal);
        mcChg.className = chgClass;
      }
      const mcSt = document.getElementById(`mc-status-${i}`);
      if (mcSt) {
        mcSt.textContent = live.section4.statuses[i];
        mcSt.className = statusPillClass(live.section4.statuses[i]);
      }
    }
    const m48Total = document.getElementById('m-r48-3');
    if (m48Total) m48Total.textContent = fmtCurrency(live.section4.cushionTotal);
    const mcCush3 = document.getElementById('mc-cush-3');
    if (mcCush3) mcCush3.textContent = fmtCurrency(live.section4.cushionTotal);

    // Section 5 Live Progress Bar
    els['sec5-progress-fill'].style.width = `${live.section5.progressPct}%`;
    els['sec5-progress-label'].textContent = `${live.section5.doneCount} of ${live.section5.totalTasks} complete (${live.section5.progressPct}%)`;
    els['sec5-status-pill'].textContent = live.section5.checklistSummary;
    els['sec5-status-pill'].className =
      live.section5.doneCount === live.section5.totalTasks
        ? 'status-pill status-pill--clear'
        : 'status-pill status-pill--warn';

    // Print Summary Header Meta
    if (els['print-meta']) {
      const h = state.sheetData?.header || {};
      const treas = state.dirtyUpdates.F6 ?? h.treasurer ?? '—';
      const prep = state.dirtyUpdates.F7 ?? h.preparedBy ?? '—';
      els['print-meta'].innerHTML = `
        <div><strong>Friday Tab:</strong> ${escapeHtml(state.activeTab)} (${escapeHtml(h.meetingDate || '')})</div>
        <div><strong>Treasurer:</strong> ${escapeHtml(treas)} &bull; <strong>Prepared by:</strong> ${escapeHtml(prep)}</div>
      `;
    }
  }

  /* ========================================================================
     Actions: Unlock, Switch Tab, Save & Sync, Duplicate Friday Tab, Lock
     ======================================================================== */
  async function attemptUnlock(passcode, { fromSavedSession = false } = {}) {
    els['login-error'].hidden = true;
    els['unlock-btn'].disabled = true;
    els['unlock-btn-label'].textContent = 'VERIFYING & LOADING SHEET…';

    try {
      const res = await callGasBackend('init', {}, passcode);
      state.passcode = passcode;
      state.authenticated = true;

      if (!fromSavedSession) {
        if (els['persist-session-chk'].checked) {
          sessionStorage.setItem(STORAGE_KEYS.sessionPass, passcode);
        } else {
          sessionStorage.removeItem(STORAGE_KEYS.sessionPass);
        }
        if (els['remember-device-chk'].checked) {
          await saveEncryptedDevicePasscode(passcode);
        }
      }

      els['passcode-input'].value = '';
      els['login-view'].hidden = true;
      els['dashboard-view'].hidden = false;
      applyWorkbookResponse(res);
      showToast(`Loaded Friday tab "${state.activeTab}" from Google Sheets.`);
    } catch (err) {
      if (fromSavedSession) {
        await clearStoredSession();
      } else {
        els['login-error'].textContent = err.message || 'Authentication failed.';
        els['login-error'].hidden = false;
      }
    } finally {
      els['unlock-btn'].disabled = false;
      els['unlock-btn-label'].textContent = 'UNLOCK TREASURER VAULT';
    }
  }

  async function switchTab(targetTabName) {
    if (!targetTabName || targetTabName === state.activeTab || state.isSyncing) return;

    const dirtyCount = Object.keys(state.dirtyUpdates).length;
    if (dirtyCount > 0) {
      if (state.autoSaveEnabled) {
        const ok = await saveCurrentTab({ isAuto: true });
        if (!ok) return;
      } else {
        const proceed = window.confirm(
          `You have ${dirtyCount} unsaved edit(s) on ${state.activeTab}. Discard them and switch to ${targetTabName}?`
        );
        if (!proceed) {
          els['week-select'].value = state.activeTab;
          return;
        }
      }
    }

    state.isSyncing = true;
    setSyncPill('syncing', 'LOADING TAB…');
    try {
      const res = await callGasBackend('getTab', { tab: targetTabName });
      applyWorkbookResponse(res);
      setSyncPill('synced', 'SYNCED');
    } catch (err) {
      setSyncPill('error', 'LOAD ERROR');
      showToast(err.message || 'Could not load tab.', 'error');
      els['week-select'].value = state.activeTab;
    } finally {
      state.isSyncing = false;
    }
  }

  async function saveCurrentTab({ isAuto = false } = {}) {
    const updates = { ...state.dirtyUpdates };
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      if (!isAuto) showToast('All figures are already synced with Google Sheets.', 'info');
      return true;
    }
    if (state.isSyncing) return false;

    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
      state.autoSaveTimer = null;
    }

    state.isSyncing = true;
    setSyncPill('syncing', 'SYNCING…');
    els['header-save-btn'].disabled = true;
    els['footer-save-btn'].disabled = true;

    try {
      const res = await callGasBackend('saveTab', {
        tab: state.activeTab,
        updates
      });

      // Preserve focus if user is actively typing while auto-save finishes
      const activeEl = document.activeElement;
      const focusedCell = activeEl?.getAttribute?.('data-cell') || null;
      const selStart = activeEl?.selectionStart ?? null;
      const selEnd = activeEl?.selectionEnd ?? null;

      applyWorkbookResponse(res);

      if (focusedCell) {
        const restored = document.querySelector(`[data-cell="${focusedCell}"]`);
        if (restored) {
          restored.focus();
          if (selStart !== null && typeof restored.setSelectionRange === 'function') {
            try {
              restored.setSelectionRange(selStart, selEnd);
            } catch (_) {}
          }
        }
      }

      setSyncPill('synced', 'SYNCED');
      showToast(
        `Synced ${res.savedCount ?? keys.length} cell(s) to "${state.activeTab}" — Google Sheets recalculated!`
      );
      return true;
    } catch (err) {
      setSyncPill('error', 'SYNC ERROR');
      showToast(err.message || 'Failed to sync changes to Google Sheets.', 'error');
      return false;
    } finally {
      state.isSyncing = false;
      els['header-save-btn'].disabled = false;
      els['footer-save-btn'].disabled = false;
      updateDirtyIndicators();
    }
  }

  async function refreshCurrentTab() {
    if (state.isSyncing) return;
    if (Object.keys(state.dirtyUpdates).length > 0) {
      const ok = window.confirm('Discard unsaved local edits and pull latest figures from Google Sheets?');
      if (!ok) return;
    }
    state.isSyncing = true;
    setSyncPill('syncing', 'REFRESHING…');
    try {
      const res = await callGasBackend('getTab', { tab: state.activeTab });
      applyWorkbookResponse(res);
      showToast(`Refreshed "${state.activeTab}" from Google Sheets.`);
    } catch (err) {
      setSyncPill('error', 'REFRESH ERROR');
      showToast(err.message || 'Refresh failed.', 'error');
    } finally {
      state.isSyncing = false;
    }
  }

  async function lockAndSignOut() {
    if (state.autoSaveTimer) clearTimeout(state.autoSaveTimer);
    state.passcode = '';
    state.authenticated = false;
    state.sheetData = null;
    state.dirtyUpdates = {};
    await clearStoredSession();

    // Purge rendered financial DOM completely on lock
    els['sec1-rows'].innerHTML = '';
    els['sec2-rows'].innerHTML = '';
    els['sec3-rows'].innerHTML = '';
    els['sec4-matrix-body'].innerHTML = '';
    els['sec4-mobile-cards'].innerHTML = '';
    els['sec5-rows'].innerHTML = '';
    els['sec6-actions'].innerHTML = '';
    els['input-discussion-notes'].value = '';

    els['dashboard-view'].hidden = true;
    els['login-view'].hidden = false;
    els['passcode-input'].focus();
    showToast('Vault locked and session cleared.', 'info');
  }

  /* ========================================================================
     Event Delegation & Listeners
     ======================================================================== */
  function bindEvents() {
    // Passcode visibility toggle
    els['toggle-passcode-btn'].addEventListener('click', () => {
      const inp = els['passcode-input'];
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    // Save custom Apps Script endpoint
    els['save-vault-endpoint-btn'].addEventListener('click', () => {
      const raw = els['vault-api-url'].value.trim();
      if (!raw) {
        localStorage.removeItem(STORAGE_KEYS.gasUrl);
        syncEndpointUi();
        showToast('Cleared custom endpoint override.', 'info');
        return;
      }
      if (!isAllowedApiUrl(raw)) {
        showToast('Endpoint must be a valid HTTPS Google Apps Script Web App URL.', 'error');
        return;
      }
      localStorage.setItem(STORAGE_KEYS.gasUrl, raw);
      syncEndpointUi();
      showToast('Saved Google Apps Script Web App endpoint.');
    });

    // Login form submit
    els['login-form'].addEventListener('submit', (e) => {
      e.preventDefault();
      const code = els['passcode-input'].value.trim();
      if (!code) {
        els['login-error'].textContent = 'Please enter the admin passcode.';
        els['login-error'].hidden = false;
        return;
      }
      attemptUnlock(code);
    });

    // Auto-save preference
    const savedAuto = localStorage.getItem(STORAGE_KEYS.autoSave);
    if (savedAuto !== null) {
      state.autoSaveEnabled = savedAuto === '1';
      els['autosave-chk'].checked = state.autoSaveEnabled;
    }
    els['autosave-chk'].addEventListener('change', (e) => {
      state.autoSaveEnabled = e.target.checked;
      localStorage.setItem(STORAGE_KEYS.autoSave, state.autoSaveEnabled ? '1' : '0');
    });

    // Week switching
    els['week-select'].addEventListener('change', (e) => switchTab(e.target.value));
    els['prev-week-btn'].addEventListener('click', () => {
      if (state.activeTabIndex > 0) {
        switchTab(state.tabs[state.activeTabIndex - 1].name);
      }
    });
    els['next-week-btn'].addEventListener('click', () => {
      if (state.activeTabIndex < state.tabs.length - 1) {
        switchTab(state.tabs[state.activeTabIndex + 1].name);
      }
    });
    els['week-pills'].addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab-name]');
      if (btn) switchTab(btn.getAttribute('data-tab-name'));
    });

    // Delegated input handling across all editable sheet cells
    els['dashboard-view'].addEventListener('input', (e) => {
      const target = e.target;
      const cell = target?.getAttribute?.('data-cell');
      if (!cell) return;

      // Sync paired desktop/mobile cushion inputs (C48, D48, E48)
      if (cell === 'C48' || cell === 'D48' || cell === 'E48') {
        document.querySelectorAll(`[data-cell="${cell}"]`).forEach((peer) => {
          if (peer !== target) {
            peer.value = target.value;
            peer.classList.add('is-dirty');
          }
        });
      }

      const kind = target.getAttribute('data-kind');
      if (kind === 'currency') {
        const parsed = window.LFC_CALC.toOptionalNum(target.value);
        recordCellEdit(cell, parsed === null ? '' : parsed, target);
      } else {
        recordCellEdit(cell, target.value, target);
      }
    });

    // Format currency cleanly on blur
    els['dashboard-view'].addEventListener(
      'blur',
      (e) => {
        const target = e.target;
        if (target?.getAttribute?.('data-kind') === 'currency') {
          const formatted = fmtInputNumber(target.value);
          target.value = formatted;
          const cell = target.getAttribute('data-cell');
          if (cell === 'C48' || cell === 'D48' || cell === 'E48') {
            document.querySelectorAll(`[data-cell="${cell}"]`).forEach((peer) => {
              peer.value = formatted;
            });
          }
        }
      },
      true
    );

    // Checklist one-tap toggle switches (Done / FALSE)
    els['sec5-rows'].addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-toggle-cell]');
      if (!toggleBtn) return;
      const cell = toggleBtn.getAttribute('data-toggle-cell');
      const currentlyDone = toggleBtn.getAttribute('aria-checked') === 'true';
      const nextDone = !currentlyDone;

      toggleBtn.setAttribute('aria-checked', nextDone ? 'true' : 'false');
      const rowCard = els['sec5-rows'].querySelector(`[data-task-row="${cell}"]`);
      if (rowCard) rowCard.classList.toggle('is-done', nextDone);
      const stateTag = els['sec5-rows'].querySelector(`[data-state-tag="${cell}"]`);
      if (stateTag) stateTag.textContent = nextDone ? 'Done' : 'FALSE';

      recordCellEdit(cell, nextDone ? 'Done' : false, rowCard);
    });

    // Save, Refresh, Discard, Print, Open Sheet, Lock
    els['header-save-btn'].addEventListener('click', () => saveCurrentTab({ isAuto: false }));
    els['footer-save-btn'].addEventListener('click', () => saveCurrentTab({ isAuto: false }));
    els['bar-save-btn'].addEventListener('click', () => saveCurrentTab({ isAuto: false }));
    els['refresh-btn'].addEventListener('click', refreshCurrentTab);
    els['discard-btn'].addEventListener('click', () => {
      if (state.sheetData) {
        applyWorkbookResponse({
          tabs: state.tabs,
          activeTab: state.activeTab,
          activeTabIndex: state.activeTabIndex,
          sheetData: state.sheetData
        });
        showToast('Discarded unsaved local edits.', 'info');
      }
    });

    const triggerPrint = () => window.print();
    els['print-btn'].addEventListener('click', triggerPrint);
    els['footer-print-btn'].addEventListener('click', triggerPrint);

    els['open-sheet-btn'].addEventListener('click', () => {
      const id = window.LFC_ADMIN_CONFIG?.spreadsheetId;
      if (id) {
        window.open(`https://docs.google.com/spreadsheets/d/${id}/edit`, '_blank', 'noopener,noreferrer');
      }
    });

    els['lock-btn'].addEventListener('click', lockAndSignOut);

    // Modals: Install App & New Friday Tab
    const openModal = (id) => {
      const m = els[id];
      if (m) {
        m.hidden = false;
        m.setAttribute('aria-hidden', 'false');
      }
    };
    const closeModal = (id) => {
      const m = els[id];
      if (m) {
        m.hidden = true;
        m.setAttribute('aria-hidden', 'true');
      }
    };

    els['vault-install-btn'].addEventListener('click', () => openModal('install-modal'));
    els['install-app-btn'].addEventListener('click', () => openModal('install-modal'));
    els['footer-install-btn'].addEventListener('click', () => openModal('install-modal'));

    els['new-friday-tab-btn'].addEventListener('click', () => {
      els['new-tab-name-input'].value = '';
      openModal('new-tab-modal');
    });

    document.addEventListener('click', (e) => {
      const closeTarget = e.target.closest('[data-close-modal]');
      if (closeTarget) {
        closeModal(closeTarget.getAttribute('data-close-modal'));
      } else if (e.target.classList?.contains('modal-backdrop')) {
        e.target.hidden = true;
        e.target.setAttribute('aria-hidden', 'true');
      }
    });

    // Duplicate / New Friday Tab form submit
    els['new-tab-form'].addEventListener('submit', async (e) => {
      e.preventDefault();
      const customName = els['new-tab-name-input'].value.trim();
      els['confirm-new-tab-btn'].disabled = true;
      try {
        if (Object.keys(state.dirtyUpdates).length > 0) {
          await saveCurrentTab({ isAuto: true });
        }
        const res = await callGasBackend('duplicateTab', {
          sourceTab: state.tabs[state.tabs.length - 1]?.name || state.activeTab,
          newTabName: customName
        });
        closeModal('new-tab-modal');
        applyWorkbookResponse(res);
        showToast(`Created new Friday tab "${res.createdTab}" in Google Sheets!`);
      } catch (err) {
        showToast(err.message || 'Could not create Friday tab.', 'error');
      } finally {
        els['confirm-new-tab-btn'].disabled = false;
      }
    });

    // Native Android/Desktop PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
      if (els['native-install-banner']) {
        els['native-install-banner'].hidden = false;
      }
    });

    els['trigger-native-install-btn'].addEventListener('click', async () => {
      if (!state.deferredInstallPrompt) return;
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice;
      state.deferredInstallPrompt = null;
      els['native-install-banner'].hidden = true;
      closeModal('install-modal');
    });
  }

  /* ========================================================================
     Service Worker Registration & Session Resume
     ======================================================================== */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  async function init() {
    cacheDom();
    syncEndpointUi();
    bindEvents();
    registerServiceWorker();

    // Auto-resume saved session if available and backend URL is configured
    if (resolveGasUrl()) {
      const sessPass = sessionStorage.getItem(STORAGE_KEYS.sessionPass);
      if (sessPass) {
        await attemptUnlock(sessPass, { fromSavedSession: true });
        return;
      }
      const encPass = await loadEncryptedDevicePasscode();
      if (encPass) {
        await attemptUnlock(encPass, { fromSavedSession: true });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
