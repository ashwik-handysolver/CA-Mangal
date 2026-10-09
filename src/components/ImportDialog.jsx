import { useMemo, useState } from 'react';
import { Drawer, Field } from './RecordForm';
import CustomDropdown from './CustomDropdown';
import Icon from './Icon';
import { notify } from '../lib/notify';
import { autoMap, buildImport, importableColumns } from '../lib/excel';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmtDate = (v) => (v ? String(v).split('-').reverse().join('/') : '');
const SHOW = 5;

function preview(col, v) {
  if (v === undefined || v === '') return '-';
  if (col.type === 'currency') return inr.format(v);
  if (col.type === 'date') return fmtDate(v);
  if (col.type === 'toggle') return v ? 'Yes' : 'No';
  return String(v);
}

// Step after picking a file: match sheet columns to fields, review, import.
export default function ImportDialog({ title, columns, sheet, onClose, onImport }) {
  const fields = importableColumns(columns);
  const [mapping, setMapping] = useState(() => autoMap(columns, sheet.headers));
  const [importing, setImporting] = useState(false);

  const result = useMemo(() => buildImport(columns, mapping, sheet.rows), [columns, mapping, sheet.rows]);
  const mapped = fields.filter((c) => mapping[c.key]);
  const missingRequired = fields.filter((c) => c.importRequired && !mapping[c.key]);
  const unused = sheet.headers.filter((h) => !Object.values(mapping).includes(h));

  const setColumn = (key, header) => setMapping((m) => {
    const next = { ...m };
    // One sheet column feeds one field
    for (const k of Object.keys(next)) if (next[k] === header) delete next[k];
    if (header) next[key] = header;
    else delete next[key];
    return next;
  });

  const submit = async (e) => {
    e.preventDefault();
    if (importing) return;
    if (missingRequired.length) return notify(`Choose a column for ${missingRequired.map((c) => c.label).join(', ')}`, 'error');
    if (!result.ready.length) return notify('No rows to import', 'error');
    setImporting(true);
    try {
      await onImport(result.ready);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Drawer
      title={`Import ${title.toLowerCase()}`}
      subtitle={`${sheet.fileName} · sheet "${sheet.sheetName}" · ${sheet.rows.length.toLocaleString('en-IN')} rows`}
      onClose={() => !importing && onClose()}
      onSubmit={submit}
      saving={importing}
      submitLabel={`Import ${result.ready.length.toLocaleString('en-IN')} ${result.ready.length === 1 ? 'row' : 'rows'}`}
      noValidate
    >
      <div className="space-y-7">
        {/* 1. Column matching */}
        <section>
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Match columns</h3>
          <p className="mt-0.5 mb-4 text-[13px] text-slate-500">Pick the sheet column for each field. Matching names were filled in for you.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {fields.map((col) => (
              <Field key={col.key} label={col.label} required={col.importRequired}>
                <CustomDropdown
                  label={col.label}
                  placeholder="Not imported"
                  value={mapping[col.key] || ''}
                  options={sheet.headers}
                  onChange={(h) => setColumn(col.key, h)}
                />
              </Field>
            ))}
          </div>
          {unused.length > 0 && (
            <p className="mt-4 text-xs text-slate-400">Not imported from the sheet: {unused.join(', ')}</p>
          )}
        </section>

        {/* 2. What will happen */}
        <section className="space-y-2.5">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Review</h3>
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
            <Icon name="status" className="w-4 h-4 shrink-0" />
            <span><b>{result.ready.length.toLocaleString('en-IN')}</b> rows ready to import</span>
          </div>
          {result.skipped.length > 0 && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5 text-sm text-red-800 dark:text-red-300">
              <div><b>{result.skipped.length.toLocaleString('en-IN')}</b> rows will be skipped</div>
              <ul className="mt-1 text-[13px] space-y-0.5">
                {result.skipped.slice(0, SHOW).map((s) => <li key={s.line}>Row {s.line}: {s.reason}</li>)}
                {result.skipped.length > SHOW && <li>…and {result.skipped.length - SHOW} more</li>}
              </ul>
            </div>
          )}
          {result.warnings.map((w) => (
            <div key={w.label} className="rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2.5 text-[13px] text-amber-800 dark:text-amber-300">
              <b>{w.label}</b>: {w.values.slice(0, SHOW).map((v) => `"${v}"`).join(', ')}
              {w.values.length > SHOW && ` and ${w.values.length - SHOW} more`} {w.note}
            </div>
          ))}
        </section>

        {/* 3. Preview */}
        {result.ready.length > 0 && mapped.length > 0 && (
          <section>
            <h3 className="mb-2.5 text-[15px] font-semibold text-slate-900 dark:text-white">Preview</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-darkborder">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-50 dark:bg-darkbg">
                  <tr>{mapped.map((c) => <th key={c.key} className="px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">{c.label}</th>)}</tr>
                </thead>
                <tbody>
                  {result.ready.slice(0, SHOW).map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-darkborder">
                      {mapped.map((c) => <td key={c.key} className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate text-slate-700 dark:text-slate-200">{preview(c, r[c.key])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.ready.length > SHOW && <p className="mt-1.5 text-xs text-slate-400">First {SHOW} of {result.ready.length.toLocaleString('en-IN')} rows</p>}
          </section>
        )}
      </div>
    </Drawer>
  );
}
