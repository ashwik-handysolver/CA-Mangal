import { useState, useEffect, useMemo, useRef } from 'react';
import RecordForm, { Drawer } from './RecordForm';
import { autoValue } from '../lib/autoValue';
import ActionSheet from './ActionSheet';
import ExportMenu from './ExportMenu';
import ImportDialog from './ImportDialog';
import CustomDropdown from './CustomDropdown';
import Icon from './Icon';
import { confirmAction, notify } from '../lib/notify';
import { useIsMobile } from '../lib/hooks';
import { readSheet, exportRows } from '../lib/excel';

const ROWS_PER_PAGE = 25;
const MOBILE_STEP = 30;
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmtDate = (v) => (v ? String(v).split('-').reverse().join('/') : '');

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
};

const CARD_TONES = {
  brand: 'from-brand-50 to-white border-brand-100 dark:from-brand-600/15 dark:to-darkcard dark:border-brand-600/25',
  green: 'from-emerald-50 to-white border-emerald-100 dark:from-emerald-500/10 dark:to-darkcard dark:border-emerald-500/20',
  amber: 'from-saffron-50 to-white border-orange-100 dark:from-saffron-500/10 dark:to-darkcard dark:border-saffron-500/20',
  rose: 'from-rose-50 to-white border-rose-100 dark:from-rose-500/10 dark:to-darkcard dark:border-rose-500/20',
  violet: 'from-violet-50 to-white border-violet-100 dark:from-violet-500/10 dark:to-darkcard dark:border-violet-500/20',
};
const VALUE_TONES = {
  brand: 'text-brand-700 dark:text-brand-100',
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-saffron-600 dark:text-saffron-500',
  rose: 'text-rose-600 dark:text-rose-400',
  violet: 'text-violet-600 dark:text-violet-300',
};
const PRIMARY_KEYS = new Set(['name', 'clientName', 'expenseName']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (v) => (v == null ? '' : String(v).trim());

const AVATARS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-600', 'bg-indigo-500', 'bg-pink-500'];
const avatarColor = (s = '') => AVATARS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];

function Pill({ tone = 'slate', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

// onImport(list of new records) -> saved rows: shows the Import button. exportable: shows Export.
// selectFilter: { label, allLabel, options: [{ value, detail, test(row) }] } adds a dropdown filter.
export default function AdvancedTable({ title, columns, initialData, onSave, onDelete, onImport, exportable, mobile, stats, filters, selectFilter }) {
  const [data, setData] = useState(initialData || []);
  const [page, setPage] = useState(1);
  const [shown, setShown] = useState(MOBILE_STEP);
  const [query, setQuery] = useState('');
  const [filterIdx, setFilterIdx] = useState(0);
  const [selectValue, setSelectValue] = useState(''); // '' = all
  // Add / edit form: { original: saved row (null when adding), values: draft }
  const [form, setForm] = useState(null);
  const [sheetRow, setSheetRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const confirmingClose = useRef(false);
  const [sheet, setSheet] = useState(null); // parsed Excel file waiting to be imported
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef(null);
  const isMobile = useIsMobile();

  const singular = title.endsWith('us') ? title : title.replace(/s$/, '');
  const isEdit = !!form?.original;
  const editable = columns.filter((c) => c.type !== 'action' && c.key !== 'index' && !c.computed && !c.autoGenerate && !c.readOnly);

  const openEdit = (row) => setForm({ original: row, values: { ...row } });

  // "Add new" button in the header
  useEffect(() => {
    const open = () => setForm({ original: null, values: {} });
    window.addEventListener('open-add-modal', open);
    return () => window.removeEventListener('open-add-modal', open);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const chip = filters?.[filterIdx];
    const pick = selectFilter?.options.find((o) => o.value === selectValue);
    return data.filter((row) => {
      if (chip?.test && !chip.test(row)) return false;
      if (pick && !pick.test(row)) return false;
      if (!q) return true;
      return Object.values(row).some((v) => typeof v !== 'object' && String(v ?? '').toLowerCase().includes(q));
    });
  }, [data, query, filters, filterIdx, selectFilter, selectValue]);

  // Dropdown filter (e.g. financial year), applied together with search and chips
  const selectOption = selectFilter?.options.find((o) => o.value === selectValue);
  const dropdown = selectFilter && (
    <div className="w-full md:w-52 shrink-0">
      <CustomDropdown
        label={selectFilter.label}
        placeholder={selectFilter.allLabel}
        allowAll
        value={selectValue}
        options={selectFilter.options.map((o) => o.value)}
        onChange={(v) => { setSelectValue(v); setPage(1); setShown(MOBILE_STEP); }}
      />
      {selectOption?.detail && <div className="mt-1 px-1 text-[11px] text-slate-400 md:hidden">{selectOption.detail}</div>}
    </div>
  );

  const summary = stats ? stats(filtered) : [];
  const chips = filters && (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
      {filters.map((f, i) => (
        <button
          key={f.label}
          onClick={() => { setFilterIdx(i); setPage(1); setShown(MOBILE_STEP); }}
          className={`press shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${i === filterIdx ? 'bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent hover:bg-slate-50'}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
  const strip = summary.length > 0 && (
    <div className="flex md:grid gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] snap-x">
      {summary.map((s, i) => (
        <div key={s.label} className={`animate-rise snap-start shrink-0 min-w-[150px] md:min-w-0 rounded-2xl bg-gradient-to-br border px-4 py-3.5 shadow-sm ${CARD_TONES[s.tone || 'brand']}`} style={{ animationDelay: `${i * 50}ms` }}>
          <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
          <div className={`mt-1 text-[22px] font-bold tabular-nums tracking-tight ${VALUE_TONES[s.tone || 'brand']}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * ROWS_PER_PAGE;
  const pageRows = filtered.slice(start, start + ROWS_PER_PAGE);
  const mobileRows = filtered.slice(0, shown);

  const setField = (key, value) => setForm((f) => ({ ...f, values: { ...f.values, [key]: value } }));

  const isDirty = (f) => {
    if (!f) return false;
    if (!f.original) return editable.some((c) => f.values[c.key] !== false && norm(f.values[c.key]));
    return editable.some((c) => norm(f.values[c.key]) !== norm(f.original[c.key]));
  };

  // Cancel / backdrop / Esc / drag-down: ask before throwing away edits
  const requestClose = async () => {
    if (saving || confirmingClose.current) return;
    if (isDirty(form)) {
      confirmingClose.current = true;
      const ok = await confirmAction({
        title: 'Discard changes?',
        message: 'Your unsaved changes will be lost.',
        confirmLabel: 'Discard',
        destructive: true,
      });
      confirmingClose.current = false;
      if (!ok) return;
    }
    setForm(null);
  };

  const validate = ({ original, values }) => {
    for (const c of editable) {
      const v = norm(values[c.key]);
      if (c.required && !v) return `${c.label} is required`;
      // Only check what was typed in this form, so old imported values never block a save
      if (c.type === 'email' && v && (!original || v !== norm(original[c.key])) && !EMAIL_RE.test(v)) {
        return `Enter a valid ${c.label.toLowerCase()}`;
      }
    }
    return null;
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (saving || !form) return;
    const { original, values } = form;

    if (!original && !isDirty(form)) {
      notify('Fill in at least one field', 'error');
      return;
    }
    const error = validate(form);
    if (error) {
      notify(error, 'error');
      return;
    }

    const row = { ...values };
    columns.forEach((c) => { if (c.autoGenerate) row[c.key] = autoValue(c, data, values, original); });

    // Nothing changed (including auto-generated fields): just close
    if (original && !columns.some((c) => c.type !== 'action' && !c.computed && norm(row[c.key]) !== norm(original[c.key]))) {
      setForm(null);
      return;
    }

    try {
      setSaving(true);
      const saved = onSave ? await onSave(row, !original, data) : { ...row, id: original?.id ?? Date.now() };
      setData((d) => (original ? d.map((r) => (r.id === original.id ? saved : r)) : [saved, ...d]));
      notify(original ? 'Changes saved' : `${singular} added`, 'success');
      setForm(null);
    } catch (err) {
      notify('Could not save: ' + (err.message || err), 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Excel ----------

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again
    if (!file) return;
    try {
      const parsed = await readSheet(file);
      if (!parsed.rows.length) return notify('No data rows found under the header row', 'error');
      setSheet({ ...parsed, fileName: file.name });
    } catch (err) {
      notify('Could not read the file: ' + (err.message || err), 'error');
    }
  };

  const handleImport = async (records) => {
    try {
      const saved = await onImport(records);
      setData((d) => [...[...saved].reverse(), ...d]);
      notify(`${saved.length.toLocaleString('en-IN')} rows imported`, 'success');
      setSheet(null);
    } catch (err) {
      // Rows are saved in batches; keep whatever made it in before the error
      const saved = err.saved || [];
      if (saved.length) setData((d) => [...[...saved].reverse(), ...d]);
      notify(`Import stopped after ${saved.length} of ${records.length} rows: ${err.message || err}`, 'error');
      if (saved.length) setSheet(null);
    }
  };

  const doExport = async (rows, scope) => {
    if (!rows.length) return notify('Nothing to export', 'error');
    setExporting(true);
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await exportRows(columns, rows, `${slug}-${scope}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      notify('Could not export: ' + (err.message || err), 'error');
    } finally {
      setExporting(false);
    }
  };

  // Import / Export buttons (icon-only on mobile)
  const currentRows = isMobile ? mobileRows : pageRows;
  const toolBtn = 'press shrink-0 inline-flex items-center justify-center gap-1.5 h-10 w-10 md:w-auto md:px-3.5 rounded-xl border border-slate-300 dark:border-darkborder bg-white dark:bg-darkbg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50';
  const transfer = (onImport || exportable) && (
    <div className="flex items-center gap-2 shrink-0">
      {onImport && (
        <>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={pickFile} />
          <button type="button" onClick={() => fileRef.current?.click()} className={toolBtn} title="Import from Excel">
            <Icon name="upload" className="w-4 h-4" />
            <span className="hidden md:inline">Import</span>
          </button>
        </>
      )}
      {exportable && (
        <ExportMenu
          busy={exporting}
          className={toolBtn}
          options={[
            { label: 'All data', detail: `${data.length.toLocaleString('en-IN')} records`, onClick: () => doExport(data, 'all') },
            {
              label: isMobile ? 'Current view' : 'Current page',
              detail: isMobile
                ? `${currentRows.length.toLocaleString('en-IN')} records shown`
                : `Page ${safePage} · ${currentRows.length.toLocaleString('en-IN')} records`,
              onClick: () => doExport(currentRows, isMobile ? 'view' : `page-${safePage}`),
            },
          ]}
        />
      )}
    </div>
  );

  const handleDelete = async (row) => {
    const ok = await confirmAction({
      title: `Delete this ${singular.toLowerCase()}?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      if (onDelete) await onDelete({ id: row.id });
      setData((d) => d.filter((r) => r.id !== row.id));
      notify(`${singular} deleted`, 'success');
    } catch (err) {
      notify('Could not delete: ' + (err.message || err), 'error');
    }
  };

  const renderCell = (col, row) => {
    const value = col.computed ? col.computed(row) : row[col.key];
    switch (col.type) {
      case 'action':
        return (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(row)} className="press p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-600/20" title="Edit">
              <Icon name="edit" className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(row)} className="press p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15" title="Delete">
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </div>
        );
      case 'date':
        return <span className="tabular-nums">{fmtDate(value) || <span className="text-slate-300">-</span>}</span>;
      case 'toggle':
        return value ? <Pill tone="green">Yes</Pill> : <Pill>No</Pill>;
      case 'currency':
        if (col.key === 'balance') {
          return <span className={`tabular-nums font-medium ${value > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{inr.format(value || 0)}</span>;
        }
        return <span className="tabular-nums">{inr.format(value || 0)}</span>;
      case 'textarea':
        return value ? <span className="block max-w-[220px] truncate" title={value}>{value}</span> : <span className="text-slate-300">-</span>;
      default:
        if (col.key === 'index') return <span className="text-xs text-slate-400 tabular-nums">{value}</span>;
        if (PRIMARY_KEYS.has(col.key) && value) {
          return (
            <span className="flex items-center gap-2.5 min-w-0">
              <span className={`w-8 h-8 rounded-full grid place-items-center text-white text-[12px] font-semibold shrink-0 ${avatarColor(value)}`}>{String(value).trim().charAt(0).toUpperCase()}</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[220px]" title={String(value)}>{value}</span>
            </span>
          );
        }
        if (col.key === 'serviceType' && value) return <Pill tone="brand">{value}</Pill>;
        if ((col.key === 'modeOfPayment' || col.key === 'services') && value) return <Pill tone="violet">{value}</Pill>;
        if (col.key === 'clientType') return <Pill tone={value === 'New Client' ? 'green' : 'amber'}>{value}</Pill>;
        if (col.key === 'tags' && value) return <Pill tone="brand">{value}</Pill>;
        if (!value && value !== 0) return <span className="text-slate-300">-</span>;
        return <span className="block max-w-[260px] truncate" title={String(value)}>{value}</span>;
    }
  };

  const emptyText = query ? 'No matching records' : 'Nothing here yet';

  return (
    <div className="space-y-4">
      {strip}
      {/* ---------- Mobile: iOS search + inset grouped list ---------- */}
      <div className="md:hidden">
        <div className="sticky top-0 z-10 -mx-4 px-4 pb-2 pt-1 bg-canvas/90 dark:bg-darkbg/90 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Icon name="search" className="w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShown(MOBILE_STEP); }}
                placeholder={`Search ${title.toLowerCase()}`}
                className="w-full h-10 rounded-xl bg-slate-200/70 dark:bg-white/10 pl-10 pr-3 text-slate-900 dark:text-slate-100 placeholder-slate-500 outline-none"
              />
            </div>
            {isMobile && transfer}
          </div>
          {dropdown && <div className="mt-2">{dropdown}</div>}
          {chips && <div className="mt-2">{chips}</div>}
          <div className="mt-2 px-1 text-[12px] uppercase tracking-wide text-slate-500">{filtered.length.toLocaleString('en-IN')} {filtered.length === 1 ? 'record' : 'records'}</div>
        </div>

        {mobileRows.length > 0 ? (
          <div className="rounded-2xl bg-white dark:bg-darkcard overflow-hidden shadow-sm">
            {mobileRows.map((row, i) => {
              const m = mobile || {};
              const rowTitle = m.title ? m.title(row) : String(row[columns[1]?.key] ?? '');
              const sub = m.subtitle ? m.subtitle(row) : '';
              const right = m.right ? m.right(row) : null;
              const badges = m.badges ? m.badges(row) : [];
              return (
                <button
                  key={row.id}
                  onClick={() => setSheetRow(row)}
                  className="w-full flex items-center gap-3 pl-4 text-left active:bg-slate-100 dark:active:bg-white/5 animate-rise"
                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                >
                  <span className={`w-10 h-10 rounded-full grid place-items-center text-white text-[15px] font-semibold shrink-0 ${avatarColor(rowTitle)}`}>
                    {(rowTitle || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <span className={`flex-1 min-w-0 flex items-center gap-2 py-3 pr-4 ${i < mobileRows.length - 1 ? 'border-b border-slate-100 dark:border-darkborder' : ''}`}>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[16px] font-semibold text-slate-900 dark:text-white truncate">{rowTitle || '-'}</span>
                      {sub && <span className="block text-[13px] text-slate-500 dark:text-slate-400 truncate">{sub}</span>}
                      {badges.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {badges.map((b) => <Pill key={b.text} tone={b.tone}>{b.text}</Pill>)}
                        </span>
                      )}
                    </span>
                    {right && (
                      <span className="text-right shrink-0">
                        <span className="block text-[15px] font-semibold tabular-nums text-slate-900 dark:text-white">{right.main}</span>
                        {right.sub && <span className={`block text-[12px] tabular-nums ${right.tone === 'amber' ? 'text-amber-600' : 'text-slate-400'}`}>{right.sub}</span>}
                      </span>
                    )}
                    <Icon name="chevronLeft" className="w-4 h-4 rotate-180 text-slate-300 shrink-0" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-darkcard py-14 text-center">
            <div className="text-[15px] font-medium text-slate-700 dark:text-slate-200">{emptyText}</div>
            <div className="text-[13px] text-slate-500 mt-1">{query ? 'Try a different search.' : 'Tap + to add the first record.'}</div>
          </div>
        )}

        {filtered.length > shown && (
          <button onClick={() => setShown(shown + MOBILE_STEP)} className="press mt-4 w-full rounded-xl bg-white dark:bg-darkcard py-3.5 text-[16px] font-medium text-brand-600 dark:text-brand-500">
            Show more ({(filtered.length - shown).toLocaleString('en-IN')} left)
          </button>
        )}
      </div>

      {/* ---------- Desktop ---------- */}
      <div className="hidden md:block bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder shadow-md shadow-slate-900/5 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-600 via-saffron-500 to-india-500" />
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-darkborder">
          <div className="relative w-full max-w-sm">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-darkborder bg-white dark:bg-darkbg pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
            />
          </div>
          {!isMobile && dropdown && <div title={selectOption?.detail}>{dropdown}</div>}
          {chips && <div className="flex-1 min-w-0">{chips}</div>}
          <div className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{filtered.length.toLocaleString('en-IN')}</span> {filtered.length === 1 ? 'record' : 'records'}
            {data.length !== filtered.length && <> of {data.length.toLocaleString('en-IN')}</>}
          </div>
          {!isMobile && transfer}
        </div>

        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-brand-50 dark:bg-darkbg">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-slate-400 border-b border-brand-100 dark:border-darkborder whitespace-nowrap ${col.type === 'action' ? 'text-right' : ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr key={row.id} className="animate-rise border-b border-slate-100 dark:border-darkborder/60 even:bg-slate-50/60 dark:even:bg-white/[0.015] hover:bg-brand-50/70 dark:hover:bg-white/[0.04] transition-colors" style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200">{renderCell(col, row)}</td>
                  ))}
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{emptyText}</div>
                    <div className="text-xs text-slate-500 mt-1">{query ? 'Try a different search.' : 'Use "Add new" to create the first record.'}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 dark:border-darkborder bg-slate-50/60 dark:bg-darkbg/40 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {filtered.length ? `${start + 1}-${Math.min(start + ROWS_PER_PAGE, filtered.length)}` : '0'} of {filtered.length.toLocaleString('en-IN')}
          </span>
          <div className="flex items-center gap-2">
            <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="press px-3 py-1.5 rounded-lg border border-slate-300 dark:border-darkborder text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-white dark:hover:bg-white/5">Previous</button>
            <span className="text-slate-500 tabular-nums">{safePage} / {totalPages}</span>
            <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="press px-3 py-1.5 rounded-lg border border-slate-300 dark:border-darkborder text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-white dark:hover:bg-white/5">Next</button>
          </div>
        </div>
      </div>

      {sheetRow && (
        <ActionSheet
          title={mobile?.title ? mobile.title(sheetRow) : singular}
          message={mobile?.subtitle ? mobile.subtitle(sheetRow) : undefined}
          onClose={() => setSheetRow(null)}
          actions={[
            { label: 'Edit', onClick: () => openEdit(sheetRow) },
            { label: 'Delete', destructive: true, onClick: () => handleDelete(sheetRow) },
          ]}
        />
      )}

      {form && (
        <Drawer
          compact={columns.filter((c) => c.type !== 'action' && c.key !== 'index').length <= 4}
          title={`${isEdit ? 'Edit' : 'New'} ${singular.toLowerCase()}`}
          subtitle={isEdit ? 'Update the details below and save.' : 'Fill in the details below to add a record.'}
          onClose={requestClose}
          onSubmit={handleSave}
          saving={saving}
          submitLabel={isEdit ? 'Save changes' : `Add ${singular.toLowerCase()}`}
          noValidate
        >
          <RecordForm columns={columns} values={form.values} onChange={setField} data={data} original={form.original} />
        </Drawer>
      )}

      {sheet && (
        <ImportDialog title={title} columns={columns} sheet={sheet} onClose={() => setSheet(null)} onImport={handleImport} />
      )}
    </div>
  );
}
