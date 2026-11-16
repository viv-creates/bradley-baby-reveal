/**
 * Baby Bradley #1 — Gender Reveal backend (Google Apps Script)
 * Paste this whole file into Extensions → Apps Script of your Google Sheet.
 * See SETUP.md for the step-by-step.
 *
 * Sheet tabs (created automatically by running setup()):
 *   Guesses : Timestamp | Name | Guess | Note
 *   Config  : revealAt | gender | revealNow
 *
 * The baby's gender lives ONLY in the Config tab, never in the HTML,
 * so nobody can peek by viewing the page source. It's sent to visitors
 * only once the reveal is live.
 */

const GUESSES = 'Guesses';
const CONFIG = 'Config';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let g = ss.getSheetByName(GUESSES) || ss.insertSheet(GUESSES);
  if (g.getLastRow() === 0) {
    g.appendRow(['Timestamp', 'Name', 'Guess', 'Note']);
    g.setFrozenRows(1);
    g.getRange('A1:D1').setFontWeight('bold');
  }
  let c = ss.getSheetByName(CONFIG) || ss.insertSheet(CONFIG);
  if (c.getLastRow() === 0) {
    c.getRange('A1:C1').setValues([['Setting', 'Value', 'Notes']]).setFontWeight('bold');
    c.getRange('A2:C4').setValues([
      ['revealAt', new Date('2026-11-27T16:00:00'), 'Date/time the reveal goes live (sheet time zone).'],
      ['gender', '', 'Type boy or girl. Leave blank until you know — reveal will not happen while blank.'],
      ['revealNow', false, 'Set TRUE to reveal immediately (overrides revealAt). Needs gender filled in.'],
    ]);
    c.autoResizeColumns(1, 3);
  }
}

function readConfig_() {
  const c = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG);
  const out = {};
  c.getRange(2, 1, Math.max(c.getLastRow() - 1, 1), 2).getValues()
    .forEach(([k, v]) => { if (k) out[String(k).trim()] = v; });
  const gender = String(out.gender || '').trim().toLowerCase();
  const revealAt = out.revealAt instanceof Date ? out.revealAt : new Date(out.revealAt);
  const now = new Date();
  const timeUp = !isNaN(revealAt) && now >= revealAt;
  const forced = out.revealNow === true || String(out.revealNow).toUpperCase() === 'TRUE';
  const validGender = gender === 'boy' || gender === 'girl';
  const revealed = validGender && (forced || timeUp);
  return { revealAt, gender, revealed, closed: revealed || timeUp };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const cfg = readConfig_();
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GUESSES);
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues() : [];
    const guesses = rows
      .filter(r => r[1] && (r[2] === 'boy' || r[2] === 'girl'))
      .map(r => ({ ts: new Date(r[0]).getTime(), name: String(r[1]), guess: r[2], note: String(r[3] || '') }));
    return json_({
      ok: true,
      guesses,
      revealed: cfg.revealed,
      gender: cfg.revealed ? cfg.gender : '',          // secret stays secret until reveal
      revealAt: isNaN(cfg.revealAt) ? null : cfg.revealAt.toISOString(),
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    // Guesses are accepted even after reveal time, so late arrivals can still
    // guess before they pop the balloon on their own screen.
    const d = JSON.parse(e.postData.contents || '{}');
    const name = String(d.name || '').trim().slice(0, 60);
    const guess = String(d.guess || '').toLowerCase();
    const note = String(d.note || '').trim().slice(0, 240);
    if (!name) return json_({ ok: false, error: 'Name is required' });
    if (guess !== 'boy' && guess !== 'girl') return json_({ ok: false, error: 'Guess must be boy or girl' });
    // Prefix text that a spreadsheet might treat as a formula.
    const safe = s => (/^[=+\-@]/.test(s) ? "'" + s : s);
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GUESSES)
      .appendRow([new Date(), safe(name), guess, safe(note)]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
