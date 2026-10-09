// Excel import / export for AdvancedTable screens.
// SheetJS is loaded only when a file is actually read or written.
const loadXLSX = () => import('xlsx');

const normKey = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const normText = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const isBlank = (v) => v == null || String(v).trim() === '';

// Fields a user can fill in, and so the ones an import can map to
export const importableColumns = (columns) =>
  columns.filter((c) => c.type !== 'action' && c.key !== 'index' && !c.computed && !c.autoGenerate && !c.readOnly);

// ---------- Reading ----------

// First sheet of the file -> { sheetName, headers, rows: [{ line, cells: {header: value} }] }
export async function readSheet(file) {
  const XLSX = await loadXLSX();
  const wb = XLSX.read(await file.arrayBuffer());
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('The file has no sheets');
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: true });

  // Header = the fullest of the first 20 rows (skips title rows like "Service register 2026")
  const filled = (r) => r.filter((v) => !isBlank(v)).length;
  let headerIdx = -1;
  for (let i = 0; i < Math.min(20, aoa.length); i++) {
    if (filled(aoa[i]) > (headerIdx < 0 ? 0 : filled(aoa[headerIdx]))) headerIdx = i;
  }
  if (headerIdx < 0) throw new Error('The sheet is empty');

  const seen = {};
  const headers = aoa[headerIdx].map((h, i) => {
    let name = String(h ?? '').trim() || `Column ${i + 1}`;
    if (seen[name]) name = `${name} (${++seen[name]})`;
    else seen[name] = 1;
    return name;
  });

  const rows = [];
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const r = aoa[i];
    if (!r.some((v) => !isBlank(v))) continue;
    rows.push({ line: i + 1, cells: Object.fromEntries(headers.map((h, j) => [h, r[j] ?? ''])) });
  }
  return { sheetName, headers, rows };
}

// Suggest which sheet column feeds each field: exact label/key first, then aliases
export function autoMap(columns, headers) {
  const mapping = {};
  const used = new Set();
  const byKey = Object.fromEntries(headers.map((h) => [normKey(h), h]));
  const passes = [(c) => [c.label, c.key], (c) => c.aliases || []];
  for (const names of passes) {
    for (const col of importableColumns(columns)) {
      if (mapping[col.key]) continue;
      const hit = names(col).map((n) => byKey[normKey(n)]).find((h) => h && !used.has(h));
      if (hit) { mapping[col.key] = hit; used.add(hit); }
    }
  }
  return mapping;
}

// ---------- Value conversion ----------

const pad = (n) => String(n).padStart(2, '0');
function ymd(y, m, d) {
  y = Number(y); m = Number(m); d = Number(d);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Excel date serial, "2026-10-05", or day-first "05/10/2026", "5-10-26" -> "2026-10-05" (null if not a date)
export function toISODate(v) {
  if (typeof v === 'number') {
    if (v < 1 || v > 2958465) return null;
    return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/);
  if (m) return ymd(m[1], m[2], m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (m) return ymd(m[3].length === 2 ? `20${m[3]}` : m[3], m[2], m[1]);
  const t = new Date(s); // e.g. "5 Oct 2026"
  return /[a-z]/i.test(s) && !isNaN(t) ? `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}` : null;
}

// "₹ 1,25,000.50" / "Rs. 500" / 500 -> number (null if not a number)
export function toNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/rs\.?|inr|₹|,|\s/gi, '');
  return s !== '' && Number.isFinite(Number(s)) ? Number(s) : null;
}

const TRUE_WORDS = new Set(['yes', 'y', 'true', '1', 'paid', 'done', 'completed', 'complete', '✓', '✔']);
const FALSE_WORDS = new Set(['no', 'n', 'false', '0', 'pending', 'unpaid', 'notpaid', 'inprogress', 'incomplete', '']);
export function toBool(v) {
  if (typeof v === 'boolean') return v;
  const s = normKey(v) || String(v).trim();
  if (TRUE_WORDS.has(s)) return true;
  if (FALSE_WORDS.has(s)) return false;
  return null;
}

// ---------- Turning sheet rows into records ----------

// Returns { ready: [values], skipped: [{ line, reason }], warnings: [{ label, values, note }] }
export function buildImport(columns, mapping, rows) {
  const cols = importableColumns(columns).filter((c) => mapping[c.key]);
  const lookup = Object.fromEntries(
    cols.filter((c) => c.type === 'select').map((c) => [c.key, new Map((c.options || []).map((o) => [normText(o), o]))])
  );
  const ready = [];
  const skipped = [];
  const bad = {}; // col.key -> Set of values that could not be used

  for (const { line, cells } of rows) {
    const values = {};
    let reason = null;

    for (const col of cols) {
      const raw = cells[mapping[col.key]];
      if (isBlank(raw)) {
        if (col.importRequired) reason ||= `${col.label} is empty`;
        continue;
      }
      let value;
      if (col.type === 'select') value = lookup[col.key].get(normText(raw)) ?? null;
      else if (col.type === 'currency') value = toNumber(raw);
      else if (col.type === 'date') value = toISODate(raw);
      else if (col.type === 'toggle') value = toBool(raw);
      else value = String(raw).trim();

      if (value === null) {
        if (col.importRequired) reason ||= `${col.label} "${String(raw).trim()}" not found`;
        else (bad[col.key] ||= new Set()).add(String(raw).trim());
        continue;
      }
      values[col.key] = value;
    }

    if (reason) skipped.push({ line, reason });
    else if (Object.keys(values).length) ready.push(values);
  }

  const warnings = cols
    .filter((c) => bad[c.key])
    .map((c) => ({
      label: c.label,
      values: [...bad[c.key]],
      note: c.type === 'select' ? 'not in the list, left blank' : 'not understood, left blank',
    }));
  return { ready, skipped, warnings };
}

// ---------- Writing ----------

export async function exportRows(columns, rows, fileName) {
  const XLSX = await loadXLSX();
  const cols = columns.filter((c) => c.type !== 'action');
  const cell = (col, row) => {
    const v = col.computed ? col.computed(row) : row[col.key];
    if (col.type === 'toggle') return v ? 'Yes' : 'No';
    if (col.type === 'currency') return v === '' || v == null ? null : Number(v);
    if (col.type === 'date') {
      const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
    }
    return v === '' || v == null ? null : v;
  };

  const aoa = [cols.map((c) => c.label), ...rows.map((r) => cols.map((c) => cell(c, r)))];
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true, dateNF: 'dd/mm/yyyy' });
  ws['!cols'] = cols.map((c, i) => ({
    wch: Math.min(40, Math.max(c.label.length, ...aoa.slice(1, 200).map((r) => (r[i] instanceof Date ? 10 : String(r[i] ?? '').length))) + 2),
  }));
  ws['!autofilter'] = { ref: ws['!ref'] };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, fileName);
}
