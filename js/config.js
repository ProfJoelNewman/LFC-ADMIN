/**
 * LFC ADMIN — Public Non-Secret Client Configuration
 *
 * SECURITY NOTE:
 * - Never store passcodes, tokens, or raw financial figures in this file.
 * - All authentication and Google Sheet reads/writes are gated server-side in Google Apps Script.
 */
window.LFC_ADMIN_CONFIG = {
  appName: 'LFC ADMIN',
  churchName: 'Life Fellowship Church',
  churchSiteUrl: 'https://deltonanaz.com',
  spreadsheetId: '1GHBm-XbHH04f4CfpogAdPxg90_WQrWe2LzaJKBVTiY4',
  // Live Google Apps Script Web App bound to Weekly Treasurer Meeting Breakdown
  defaultGasWebAppUrl: 'https://script.google.com/macros/s/AKfycbzV3wDOmy_HKl0IfDhEipuhrza7SkgN-w6a_rSg1MhT5xgHqWp4JB2IbyYsaJlq3JrsEQ/exec',
  version: '1.0.0'
};
