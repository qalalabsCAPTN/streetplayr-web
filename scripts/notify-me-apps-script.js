/**
 * StreetPlayR Notify Me → Google Sheet appender.
 * Spreadsheet: 11t9Lq0Uib-87tke66bATy0DkhDfvWe-E7snGGX5uc0M
 *
 * Deploy in the sheet: Extensions → Apps Script → paste this file → Deploy → New deployment
 *   Type: Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then set NOTIFY_ME_SHEETS_WEBHOOK_URL to the web app URL (server-only).
 * Optional: set Script property WEBHOOK_SECRET and NOTIFY_ME_WEBHOOK_SECRET to the same value.
 */
var SHEET_ID = '11t9Lq0Uib-87tke66bATy0DkhDfvWe-E7snGGX5uc0M';
var HEADERS = [
  'Name',
  'Email',
  'Phone',
  'Timestamp',
  'Product Name',
  'Product ID',
  'Product Handle',
  'Variants',
];

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var expected = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (expected) {
      var got = String(body.secret || '');
      if (got !== expected) {
        return json_({ ok: false }, 401);
      }
    }
    var name = String(body.name || '').trim();
    var email = String(body.email || '').trim();
    var phone = String(body.phone || '').trim();
    if (!name || !email || !phone) {
      return json_({ ok: false }, 400);
    }
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheets()[0];
    var existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    var mismatch = HEADERS.some(function (h, i) {
      return String(existing[i] || '').trim() !== h;
    });
    if (mismatch) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
    sheet.appendRow([
      name,
      email,
      phone,
      String(body.timestamp || new Date().toISOString()),
      String(body.productName || ''),
      String(body.productId || ''),
      String(body.productHandle || ''),
      String(body.variants || ''),
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false }, 500);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
