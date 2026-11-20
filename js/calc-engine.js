/**
 * LFC ADMIN — Live Preview Formula Engine (calc-engine.js)
 *
 * Mirrors the exact Google Sheets formulas in `Weekly Treasurer Meeting Breakdown`
 * for instant 0ms client-side recalculation while typing.
 * NOTE: Spreadsheet formula cells are NEVER written back to Google Sheets;
 * on Save & Sync, Google Sheets recalculates its own formulas authoritatively.
 */
(function (global) {
  'use strict';

  function toNum(v) {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const cleaned = String(v).replace(/[$,\s]/g, '');
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function toOptionalNum(v) {
    if (v === null || v === undefined || String(v).trim() === '') return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const cleaned = String(v).replace(/[$,\s]/g, '');
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function evalAccountStatus(projected, cushionOrNull) {
    const c = cushionOrNull === null ? 0 : toNum(cushionOrNull);
    if (projected < -0.004) return '⚠ SHORTFALL';
    if (cushionOrNull !== null && projected < c - 0.004) return '⚠ BELOW CUSHION';
    if (cushionOrNull === null && projected < 0) return '⚠ SHORTFALL';
    return '✔ OK';
  }

  /**
   * Compute live derived totals, Section 4 matrix, KPI strip, and Section 5 progress
   * from the current in-memory `sheetData` + `dirtyUpdates` map.
   */
  function computeLiveState(sheetData, dirtyUpdates) {
    if (!sheetData) return null;
    const u = dirtyUpdates || {};

    function valFor(cell, fallback) {
      return Object.prototype.hasOwnProperty.call(u, cell) ? u[cell] : fallback;
    }

    // Section 1: Cash in the Bank (C15, C16, C17 -> C18 = SUM(C15:C17))
    const c15 = toNum(valFor('C15', sheetData.section1.rows[0]?.balance));
    const c16 = toNum(valFor('C16', sheetData.section1.rows[1]?.balance));
    const c17 = toNum(valFor('C17', sheetData.section1.rows[2]?.balance));
    const c18 = round2(c15 + c16 + c17);

    // Section 2: Money on the Way In (C22..C25 -> C26 = SUM(C22:C25))
    const c22 = toNum(valFor('C22', sheetData.section2.rows[0]?.amount));
    const c23 = toNum(valFor('C23', sheetData.section2.rows[1]?.amount));
    const c24 = toNum(valFor('C24', sheetData.section2.rows[2]?.amount));
    const c25 = toNum(valFor('C25', sheetData.section2.rows[3]?.amount));
    const c26 = round2(c22 + c23 + c24 + c25);

    // Section 3: Bills & Payroll Due in Next 5 Days (C30..C37, D30..D37)
    // C38 = SUM(C30:C37), C40 = SUMIF(D30:D37, "School", C30:C37), C39 = C38 - C40
    let c38 = 0;
    let c40 = 0;
    for (let i = 0; i < sheetData.section3.rows.length; i++) {
      const row = sheetData.section3.rows[i];
      const amt = toNum(valFor(row.amountCell, row.amount));
      const pf = String(valFor(row.paidFromCell, row.paidFrom) || '').trim();
      c38 += amt;
      if (pf.toLowerCase() === 'school' || pf.toLowerCase() === 'school operating') {
        c40 += amt;
      }
    }
    c38 = round2(c38);
    c40 = round2(c40);
    const c39 = round2(c38 - c40);

    // Section 4: Cash Position Summary Matrix [General, School, Other, Total]
    const cashToday = [round2(c15), round2(c16), round2(c17), c18];
    const pendingDeposits = [c26, 0, 0, c26];
    const billsDue = [round2(-c39), round2(-c40), 0, round2(-c38)];
    const projectedCash = [
      round2(cashToday[0] + pendingDeposits[0] + billsDue[0]),
      round2(cashToday[1] + pendingDeposits[1] + billsDue[1]),
      round2(cashToday[2] + pendingDeposits[2] + billsDue[2]),
      round2(cashToday[3] + pendingDeposits[3] + billsDue[3])
    ];

    const cushC = toOptionalNum(valFor('C48', sheetData.section4.cushion.values[0]));
    const cushD = toOptionalNum(valFor('D48', sheetData.section4.cushion.values[1]));
    const cushE = toOptionalNum(valFor('E48', sheetData.section4.cushion.values[2]));
    const cushionTotal = round2(toNum(cushC) + toNum(cushD) + toNum(cushE));

    const statusC = evalAccountStatus(projectedCash[0], cushC);
    const statusD = evalAccountStatus(projectedCash[1], cushD);
    const statusE = evalAccountStatus(projectedCash[2], cushE);
    const hasAnyCushion = cushC !== null || cushD !== null || cushE !== null;
    const statusF = evalAccountStatus(projectedCash[3], hasAnyCushion ? cushionTotal : 0);
    const statuses = [statusC, statusD, statusE, statusF];

    // Overall KPI Status (B11):
    // =IF(COUNTIF(C49:F49,"*SHORTFALL*")>0,"⚠ SHORTFALL – REVIEW",IF(COUNTIF(C49:F49,"*BELOW*")>0,"⚠ BELOW CUSHION","✔ ALL CLEAR"))
    let overallStatus = '✔ ALL CLEAR';
    if (statuses.some((s) => s.includes('SHORTFALL'))) {
      overallStatus = '⚠ SHORTFALL – REVIEW';
    } else if (statuses.some((s) => s.includes('BELOW'))) {
      overallStatus = '⚠ BELOW CUSHION';
    }

    // Last week's projected cash (Row 50) & Change vs. last week (Row 51)
    const lwEditable = Boolean(sheetData.section4.lastWeekProjected?.editable);
    const lwC = lwEditable ? toNum(valFor('C50', sheetData.section4.lastWeekProjected.values[0])) : toNum(sheetData.section4.lastWeekProjected.values[0]);
    const lwD = lwEditable ? toNum(valFor('D50', sheetData.section4.lastWeekProjected.values[1])) : toNum(sheetData.section4.lastWeekProjected.values[1]);
    const lwE = lwEditable ? toNum(valFor('E50', sheetData.section4.lastWeekProjected.values[2])) : toNum(sheetData.section4.lastWeekProjected.values[2]);
    const lwF = round2(lwC + lwD + lwE);
    const lastWeekProjected = [round2(lwC), round2(lwD), round2(lwE), lwF];

    const changeVsLastWeek = [
      round2(projectedCash[0] - lastWeekProjected[0]),
      round2(projectedCash[1] - lastWeekProjected[1]),
      round2(projectedCash[2] - lastWeekProjected[2]),
      round2(projectedCash[3] - lastWeekProjected[3])
    ];

    // Section 5: Checklist Progress (10 tasks, supporting both TRUE and 'Done')
    let doneCount = 0;
    const totalTasks = sheetData.section5.rows.length || 10;
    for (let i = 0; i < sheetData.section5.rows.length; i++) {
      const r = sheetData.section5.rows[i];
      const rawDone = valFor(r.doneCell, r.done);
      const isDone =
        rawDone === true ||
        String(rawDone).trim().toLowerCase() === 'done' ||
        String(rawDone).trim().toLowerCase() === 'true';
      if (isDone) doneCount++;
    }
    const openCount = Math.max(0, totalTasks - doneCount);
    const progressPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
    const checklistSummary =
      doneCount === totalTasks ? '✔ All items complete' : `${openCount} item(s) still open`;

    return {
      kpi: {
        overallStatus,
        cashInBank: cashToday[3],
        pendingDeposits: pendingDeposits[3],
        dueNext5Days: c38,
        projectedCash: projectedCash[3]
      },
      section1Total: c18,
      section2Total: c26,
      section3Totals: {
        totalDueNext5Days: c38,
        paidFromGeneral: c39,
        paidFromSchool: c40
      },
      section4: {
        cashToday,
        pendingDeposits,
        billsDue,
        projectedCash,
        cushionValues: [cushC, cushD, cushE],
        cushionTotal,
        statuses,
        lastWeekProjected,
        changeVsLastWeek
      },
      section5: {
        doneCount,
        openCount,
        totalTasks,
        progressPct,
        checklistSummary
      }
    };
  }

  global.LFC_CALC = {
    toNum,
    toOptionalNum,
    round2,
    computeLiveState
  };
})(window);
