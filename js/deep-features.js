/**
 * LFC HUB v2.1 — Deep Module Extensions, Pilot Phone Installer, Feedback Inbox & CSV Importer
 */
window.LFCDeepFeatures = (function () {
  'use strict';

  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', ev => {
    ev.preventDefault();
    deferredInstallPrompt = ev;
    const wrap = document.getElementById('native-install-wrap');
    if (wrap) wrap.hidden = false;
  });

  function renderPilotShareAndFeedbackAdmin(state, esc, showToast, callVaultApi, refreshUi) {
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
      : '<div class="alert-box alert-box--info">No pilot feedback items submitted yet. Testers tap "💬 Suggest Change" on any phone screen!</div>';

    return (
      '<section class="card">' +
      '<span class="eyebrow-tag">PILOT PHONE ROLLOUT &amp; FEEDBACK</span>' +
      '<h2 class="card-title" style="margin-top:6px;">Invite Leaders to Install &amp; Test on Their Phone</h2>' +
      '<p class="card-subtitle" style="margin-bottom:12px;">Send each person their tailored link below — they can add LFC Hub to their phone home screen and tap <strong>💬 Suggest Change</strong> anywhere.</p>' +
      '<div class="list-stack" style="margin-bottom:14px;">' + testerCards + '</div>' +
      '<h3 class="card-title" style="font-size:0.95rem; margin-bottom:8px;">Pilot Tester Feedback Inbox (' + fbRows.length + ')</h3>' +
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
        const reviewer = document.getElementById('fb-reviewer').value.trim();
        const fbType = document.getElementById('fb-type').value;
        const prio = document.getElementById('fb-priority').value;
        const msg = document.getElementById('fb-message').value.trim();
        const newEntry = {
          Feedback_ID: 'fb_' + Date.now(),
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
        fbModal.hidden = true;
        ev.target.reset();
        showToast('Thank you! Feedback logged in Pastor Joel & Yaresly\'s Vault Inbox.');
        if (state.activeTab === 'admin_users') renderMainWorkspace();
      });
    }
  }

  return {
    renderPilotShareAndFeedbackAdmin: renderPilotShareAndFeedbackAdmin,
    renderAtomicTransferAndTaxStatement: renderAtomicTransferAndTaxStatement,
    bindGlobalModals: bindGlobalModals
  };
})();
