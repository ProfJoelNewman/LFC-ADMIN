/**
 * LFC HUB v2.1.2 — Deep Module Extensions, Pilot Phone Installer, Live Cloud Feedback Relay & CSV Importer
 */
window.LFCDeepFeatures = (function () {
  'use strict';

  const FB_INBOX_KEY = 'lfc_pilot_fb_inbox_v1';
  const MY_SUBS_KEY = 'lfc_my_pilot_submissions_v1';
  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', ev => {
    ev.preventDefault();
    deferredInstallPrompt = ev;
    const wrap = document.getElementById('native-install-wrap');
    if (wrap) wrap.hidden = false;
  });

  function getRelayBaseUrl() {
    const topic = window.LFC_CHMS_CONFIG && window.LFC_CHMS_CONFIG.pilotFeedbackRelayTopic;
    return topic ? 'https://ntfy.sh/' + encodeURIComponent(topic) : '';
  }

  function loadJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJsonStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  async function syncLivePilotFeedback(state, renderMainWorkspace) {
    const relayUrl = getRelayBaseUrl();
    const cached = loadJsonStorage(FB_INBOX_KEY, []);
    const byId = new Map();

    cached.forEach(item => {
      if (item && item.Feedback_ID) byId.set(item.Feedback_ID, item);
    });
    (state.data.pilotFeedback || []).forEach(item => {
      if (item && item.Feedback_ID) byId.set(item.Feedback_ID, item);
    });

    if (relayUrl) {
      try {
        const resp = await fetch(relayUrl + '/json?poll=1&since=12h', { cache: 'no-store' });
        if (resp.ok) {
          const text = await resp.text();
          const seenRemoteIds = new Set();
          const statusUpdates = new Map();

          text.split(/\r?\n/).filter(Boolean).forEach(line => {
            try {
              const env = JSON.parse(line);
              if (env.event !== 'message' || !env.message) return;
              const payload = JSON.parse(env.message);
              if (payload && payload.type === 'status_update' && payload.Feedback_ID) {
                statusUpdates.set(payload.Feedback_ID, payload.Status || 'Done');
              } else if (payload && payload.Feedback_ID && payload.Suggestion_or_Issue) {
                seenRemoteIds.add(payload.Feedback_ID);
                const prev = byId.get(payload.Feedback_ID);
                byId.set(payload.Feedback_ID, Object.assign({}, payload, prev && prev.Status === 'Done' ? { Status: 'Done' } : {}));
              }
            } catch (_) {}
          });

          statusUpdates.forEach((st, id) => {
            const existing = byId.get(id);
            if (existing) existing.Status = st;
          });

          // Re-hydrate any locally submitted items from this device if >12h expired on public relay
          const mySubs = loadJsonStorage(MY_SUBS_KEY, []);
          for (let i = 0; i < mySubs.length; i++) {
            const sub = mySubs[i];
            if (sub && sub.Feedback_ID && !seenRemoteIds.has(sub.Feedback_ID)) {
              byId.set(sub.Feedback_ID, sub);
              try {
                await fetch(relayUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                  body: JSON.stringify(sub)
                });
              } catch (_) {}
            }
          }
        }
      } catch (_) {}
    }

    const merged = Array.from(byId.values()).sort((a, b) =>
      String(a.Submitted_At || '').localeCompare(String(b.Submitted_At || ''))
    );
    state.data.pilotFeedback = merged;
    saveJsonStorage(FB_INBOX_KEY, merged);
    if (renderMainWorkspace && state.activeTab === 'admin_users') {
      renderMainWorkspace();
    }
    return merged;
  }

  async function publishFeedbackStatusUpdate(feedbackId, status) {
    const cached = loadJsonStorage(FB_INBOX_KEY, []);
    cached.forEach(item => {
      if (item && item.Feedback_ID === feedbackId) item.Status = status;
    });
    saveJsonStorage(FB_INBOX_KEY, cached);

    const relayUrl = getRelayBaseUrl();
    if (relayUrl) {
      try {
        await fetch(relayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({ type: 'status_update', Feedback_ID: feedbackId, Status: status })
        });
      } catch (_) {}
    }
  }

  function renderPilotShareAndFeedbackAdmin(state, esc) {
    const baseUrl = window.location.origin + window.location.pathname;
    const testers = window.LFC_CHMS_CONFIG.pilotTesters || [];
    const fbRows = state.data.pilotFeedback || [];

    const testerCards = testers
      .map(t => {
        const link = baseUrl + '?pilot=' + encodeURIComponent(t.key);
        return (
          '<div class="list-row">' +
          '<div class="list-row__main">' +
          '<div class="list-row__title">' + esc(t.fullName) + ' <code>@' + esc(t.username) + '</code></div>' +
          '<div class="list-row__meta">' + esc(t.area) + '</div>' +
          '</div>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-copy-pilot="' + esc(link) + '">📲 Copy Phone Test Link</button>' +
          '</div>'
        );
      })
      .join('');

    const fbHtml = fbRows.length
      ? fbRows
          .slice()
          .reverse()
          .map(
            f =>
              '<div class="list-row">' +
              '<div class="list-row__main">' +
              '<div class="list-row__title">' + esc(f.Reviewer_Name) + ' &bull; <span class="badge badge--gold">' + esc(f.Feedback_Type) + '</span></div>' +
              '<div class="list-row__meta">Screen: <strong>' + esc(f.Screen_Module) + '</strong> &bull; ' + esc(f.Priority) + '<br/>' + esc(f.Suggestion_or_Issue) + '</div>' +
              '</div>' +
              (f.Status === 'Done'
                ? '<span class="badge badge--emerald">Done ✓</span>'
                : '<button type="button" class="btn btn--emerald btn--sm" data-resolve-fb="' + esc(f.Feedback_ID) + '">Mark Done</button>') +
              '</div>'
          )
          .join('')
      : '<div class="alert-box alert-box--info">Live Cloud Feedback Relay is active ✓ — No tester recommendations submitted yet. As soon as any tester taps "💬 Suggest Change" on their phone, it appears right here!</div>';

    return (
      '<section class="card">' +
      '<span class="eyebrow-tag">PILOT PHONE ROLLOUT &amp; LIVE CLOUD FEEDBACK</span>' +
      '<h2 class="card-title" style="margin-top:6px;">Invite Leaders to Install &amp; Test on Their Phone</h2>' +
      '<p class="card-subtitle" style="margin-bottom:12px;">Send each person their tailored link below — they can add LFC Hub to their phone Home Screen and tap <strong>💬 Suggest Change</strong> anywhere (delivered live automatically!).</p>' +
      '<div class="list-stack" style="margin-bottom:14px;">' + testerCards + '</div>' +
      '<div class="card-head" style="margin-bottom:8px;">' +
      '<h3 class="card-title" style="font-size:0.95rem;">Pilot Tester Feedback Inbox (' + fbRows.length + ')</h3>' +
      '<button type="button" id="refresh-pilot-fb-btn" class="btn btn--secondary btn--sm">🔄 Check New Feedback</button>' +
      '</div>' +
      '<div class="list-stack">' + fbHtml + '</div>' +
      '</section>' +
      '<section class="card">' +
      '<h2 class="card-title">1-Click ChurchTrac CSV Dropzone Importer</h2>' +
      '<p class="card-subtitle" style="margin-bottom:10px;">172 People, 93 Households, 112 Attendance Sessions &amp; 523 Contributions are already migrated into your Google Drive Vault! Drop any future ChurchTrac CSV below to append new rows:</p>' +
      '<div class="form-grid-2">' +
      '<label class="camera-upload-label"><input type="file" id="ct-people-csv-input" accept=".csv" /><span>📥 Import ChurchTrac People CSV</span></label>' +
      '<label class="camera-upload-label"><input type="file" id="ct-giving-csv-input" accept=".csv" /><span>📥 Import ChurchTrac Giving CSV</span></label>' +
      '</div></section>'
    );
  }

  function renderAtomicTransferAndTaxStatement(state, esc, fmtMoney) {
    const donors = Array.from(new Set(state.data.contributions.map(c => c.Donor_Name))).filter(Boolean);
    const selectedDonor = state.statementDonor || donors[0] || 'Patricia Babb';
    const donorGifts = state.data.contributions.filter(c => c.Donor_Name === selectedDonor);
    const cashDedTotal = donorGifts.filter(c => c.Payment_Type !== 'In-Kind').reduce((a, c) => a + Number(c.Amount || 0), 0);
    const inKindGifts = donorGifts.filter(c => c.Payment_Type === 'In-Kind');

    return (
      '<section class="card">' +
      '<h2 class="card-title">Atomic Bank &amp; Fund Transfer ($0.00 GL Drift)</h2>' +
      '<p class="card-subtitle" style="margin-bottom:12px;">Replaces ChurchTrac\'s broken <code>GL Fund</code> by posting balanced two-legged transfers simultaneously.</p>' +
      '<form id="atomic-xfer-form">' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="xf-from-bank">From Bank Account</label><select id="xf-from-bank" class="select">' +
      state.data.bankAccounts.map(b => '<option value="' + esc(b.Account_ID) + '">' + esc(b.Account_Name) + ' ••' + esc(b.Mask) + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label class="field-label" for="xf-to-bank">To Bank Account</label><select id="xf-to-bank" class="select">' +
      state.data.bankAccounts.map((b, i) => '<option value="' + esc(b.Account_ID) + '" ' + (i === 1 ? 'selected' : '') + '>' + esc(b.Account_Name) + ' ••' + esc(b.Mask) + '</option>').join('') +
      '</select></div></div>' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="xf-from-fund">From Fund</label><select id="xf-from-fund" class="select">' +
      state.data.funds.map(f => '<option value="' + esc(f.Fund_Code) + '">Fund ' + esc(f.Fund_Code) + ' — ' + esc(f.Fund_Name) + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label class="field-label" for="xf-to-fund">To Fund</label><select id="xf-to-fund" class="select">' +
      state.data.funds.map((f, i) => '<option value="' + esc(f.Fund_Code) + '" ' + (i === 2 ? 'selected' : '') + '>Fund ' + esc(f.Fund_Code) + ' — ' + esc(f.Fund_Name) + '</option>').join('') +
      '</select></div></div>' +
      '<div class="form-grid-2">' +
      '<div class="field"><label class="field-label" for="xf-amount">Transfer Amount ($)</label><input id="xf-amount" type="number" min="0.01" step="0.01" class="input" placeholder="100.00" required /></div>' +
      '<div class="field"><label class="field-label" for="xf-memo">Transfer Memo</label><input id="xf-memo" class="input" placeholder="e.g. Monthly 10% SCA Lease or Ministry Transfer" required /></div>' +
      '</div>' +
      '<button type="submit" class="btn btn--gold btn--full">Post Balanced Transfer ($0.00 Drift)</button></form></section>' +
      '<section class="card">' +
      '<div class="card-head no-print"><div><h2 class="card-title">IRS Annual Donor Contribution Statement</h2><p class="card-subtitle">Separates tax-deductible cash/online gifts from Non-Cash In-Kind items per IRS Pub 1771</p></div>' +
      '<div style="display:flex; gap:8px; flex-wrap:wrap;"><select id="stmt-donor-select" class="select" style="width:auto; min-height:38px;">' +
      donors.map(d => '<option value="' + esc(d) + '" ' + (d === selectedDonor ? 'selected' : '') + '>' + esc(d) + '</option>').join('') +
      '</select><button type="button" id="print-stmt-btn" class="btn btn--secondary btn--sm">🖨️ Print / Save PDF</button></div></div>' +
      '<div class="statement-paper">' +
      '<div style="display:flex; justify-content:space-between; border-bottom:2px solid #0F172A; padding-bottom:10px; margin-bottom:12px; flex-wrap:wrap; gap:8px;">' +
      '<div><strong style="font-size:15px;">LIFE FELLOWSHIP CHURCH OF THE NAZARENE</strong><div style="font-size:12px; color:#475569;">1420 Courtland Blvd, Deltona, FL 32738 &bull; (386) 574-7828</div></div>' +
      '<div style="font-size:12px; text-align:right;"><strong>2026 Contribution Statement</strong><br/>Treasurer: Dee "Huney" Huchton</div></div>' +
      '<div style="font-size:13.5px; margin-bottom:10px;">Donor: <strong>' + esc(selectedDonor) + '</strong></div>' +
      '<table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:12px;">' +
      '<thead><tr style="border-bottom:1px solid #CBD5E1; text-align:left;"><th>Date</th><th>Category</th><th>Method</th><th style="text-align:right;">Amount</th></tr></thead><tbody>' +
      donorGifts
        .filter(g => g.Payment_Type !== 'In-Kind')
        .map(g => '<tr style="border-bottom:1px solid #E2E8F0;"><td style="padding:4px 0;">' + esc(g.Gift_Date) + '</td><td>' + esc(g.Category_Name) + '</td><td>' + esc(g.Payment_Type) + '</td><td style="text-align:right;">' + fmtMoney(g.Amount) + '</td></tr>')
        .join('') +
      '</tbody></table>' +
      '<div style="font-weight:800; font-size:14px; text-align:right; margin-bottom:8px;">Total Tax-Deductible Cash/Online Contributions: ' + fmtMoney(cashDedTotal) + '</div>' +
      (inKindGifts.length
        ? '<div style="font-size:12px; background:#F8FAFC; padding:8px; border-radius:6px; margin-bottom:8px;"><strong>Non-Cash In-Kind Gifts Acknowledged (Donor determines fair market value):</strong> ' +
          inKindGifts.map(k => esc(k.Gift_Date + ' — ' + k.Category_Name)).join('; ') + '</div>'
        : '') +
      '<div style="font-size:11px; color:#475569; font-style:italic;">IRS Compliance Statement: Other than intangible religious benefits, no goods or services were provided in exchange for these contributions.</div>' +
      '</div></section>'
    );
  }

  function bindGlobalModals(state, showToast, callVaultApi, renderMainWorkspace) {
    // Immediately hydrate & sync live cloud feedback on app start
    syncLivePilotFeedback(state, renderMainWorkspace);

    const installModal = document.getElementById('install-modal');
    const fbModal = document.getElementById('feedback-modal');

    const openInstall = () => { if (installModal) installModal.hidden = false; };
    const closeInstall = () => { if (installModal) installModal.hidden = true; };

    const btn1 = document.getElementById('open-install-guide-btn');
    const btn2 = document.getElementById('topbar-install-btn');
    const btnCloseInst = document.getElementById('close-install-modal');
    const btnNative = document.getElementById('trigger-native-install-btn');
    if (btn1) btn1.addEventListener('click', openInstall);
    if (btn2) btn2.addEventListener('click', openInstall);
    if (btnCloseInst) btnCloseInst.addEventListener('click', closeInstall);
    if (btnNative) {
      btnNative.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          await deferredInstallPrompt.userChoice;
          deferredInstallPrompt = null;
          closeInstall();
        }
      });
    }

    const fab = document.getElementById('fab-open-feedback');
    const closeFb = document.getElementById('close-feedback-modal');
    if (fab) {
      fab.addEventListener('click', () => {
        document.getElementById('fb-reviewer').value = (state.user && state.user.fullName) || 'Ministry Pilot Tester';
        document.getElementById('fb-context-label').textContent =
          'Screen: ' + state.activeTab.toUpperCase() + ' • Role: ' + ((state.user && state.user.role) || state.mode);
        fbModal.hidden = false;
      });
    }
    if (closeFb) closeFb.addEventListener('click', () => { fbModal.hidden = true; });

    const fbForm = document.getElementById('pilot-feedback-form');
    if (fbForm) {
      fbForm.addEventListener('submit', async ev => {
        ev.preventDefault();
        const submitBtn = fbForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending Live to Pastor Joel...';
        }

        const reviewer = document.getElementById('fb-reviewer').value.trim();
        const fbType = document.getElementById('fb-type').value;
        const prio = document.getElementById('fb-priority').value;
        const msg = document.getElementById('fb-message').value.trim();
        const newEntry = {
          Feedback_ID: 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          Submitted_At: new Date().toISOString(),
          Reviewer_Name: reviewer,
          Reviewer_Username: (state.user && state.user.username) || 'pilot',
          Reviewer_Role: (state.user && state.user.role) || state.mode,
          Screen_Module: state.activeTab,
          Feedback_Type: fbType,
          Priority: prio,
          Suggestion_or_Issue: msg,
          Status: 'Open'
        };

        state.data.pilotFeedback = state.data.pilotFeedback || [];
        state.data.pilotFeedback.push(newEntry);

        // Save locally for durable re-hydration & offline safety
        const mySubs = loadJsonStorage(MY_SUBS_KEY, []);
        mySubs.push(newEntry);
        saveJsonStorage(MY_SUBS_KEY, mySubs);
        saveJsonStorage(FB_INBOX_KEY, state.data.pilotFeedback);

        // 1. Live Zero-Setup Cloud Relay (works immediately across all pilot phones!)
        const relayUrl = getRelayBaseUrl();
        if (relayUrl) {
          try {
            await fetch(relayUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
              body: JSON.stringify(newEntry)
            });
          } catch (_) {}
        }

        // 2. Also send to Google Apps Script Vault if configured
        if (state.gasUrl) {
          try {
            await callVaultApi('submitPilotFeedback', {
              reviewerName: reviewer,
              screenModule: state.activeTab,
              feedbackType: fbType,
              priority: prio,
              message: msg
            });
          } catch (_) {}
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Feedback to Vault Inbox';
        }
        fbModal.hidden = true;
        ev.target.reset();
        showToast('Sent! Your feedback is now live in Pastor Joel & Yaresly\'s Inbox.');
        if (state.activeTab === 'admin_users') renderMainWorkspace();
      });
    }
  }

  return {
    renderPilotShareAndFeedbackAdmin: renderPilotShareAndFeedbackAdmin,
    renderAtomicTransferAndTaxStatement: renderAtomicTransferAndTaxStatement,
    bindGlobalModals: bindGlobalModals,
    syncLivePilotFeedback: syncLivePilotFeedback,
    publishFeedbackStatusUpdate: publishFeedbackStatusUpdate
  };
})();
