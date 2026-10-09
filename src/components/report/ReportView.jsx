import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { exportRows } from '../../lib/excel';
import { notify } from '../../lib/notify';
import { ListSkeleton } from '../Skeleton';
import CustomDropdown from '../CustomDropdown';
import Icon from '../Icon';
import CompareChart from './CompareChart';
import { count, growthText, inr, monthLabel, sumOf } from './format';

const PAGE = 1000;

async function fetchReport({ source, select = '*', filters = [], order = [], transform }) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(source).select(select);
    for (const [col, op, value] of filters) q = q.filter(col, op, value);
    for (const [col, ascending, nullsFirst] of order) q = q.order(col, nullsFirst === undefined ? { ascending } : { ascending, nullsFirst });
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return transform ? await transform(rows) : rows;
}

const CARD_TONES = {
  brand: 'from-brand-50 to-white border-brand-100 dark:from-brand-600/15 dark:to-darkcard dark:border-brand-600/25',
  green: 'from-emerald-50 to-white border-emerald-100 dark:from-emerald-500/10 dark:to-darkcard dark:border-emerald-500/20',
  amber: 'from-saffron-50 to-white border-orange-100 dark:from-saffron-500/10 dark:to-darkcard dark:border-saffron-500/20',
  rose: 'from-rose-50 to-white border-rose-100 dark:from-rose-500/10 dark:to-darkcard dark:border-rose-500/20',
  violet: 'from-violet-50 to-white border-violet-100 dark:from-violet-500/10 dark:to-darkcard dark:border-violet-500/20',
};

// Growth shown with an arrow and sign, so it never depends on colour alone
function Growth({ value }) {
  if (value == null) return <span className="text-slate-300">-</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>
      {up ? '▲' : '▼'} {growthText(value)}
    </span>
  );
}

function cellText(col, v) {
  if (v == null || v === '') return null;
  if (col.type === 'month') return monthLabel(v);
  if (col.type === 'currency') return inr(v);
  if (col.type === 'count') return count(v);
  if (col.type === 'date') return String(v).split('-').reverse().join('/');
  return String(v);
}

function YesNo({ value }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${value ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

function Cell({ col, value }) {
  if (col.type === 'growth') return <Growth value={value} />;
  if (col.type === 'boolean') return <YesNo value={value} />;
  const text = cellText(col, value);
  if (text == null) return col.blankEmpty ? null : <span className="text-slate-300">-</span>;
  return text;
}

function totalOf(col, rows) {
  if (typeof col.total === 'function') return col.total(rows);
  if (col.total === 'sum') return sumOf(rows, col.key);
  if (col.total === 'last') return rows.length ? rows[rows.length - 1][col.key] : null;
  return undefined;
}

// Which period (e.g. financial year) a row belongs to
const periodOf = (p, r) => (r[p.key] == null || r[p.key] === '' ? p.noneLabel || '-' : String(r[p.key]));

const isNumeric = (col) => !['text', 'month', 'date', 'boolean'].includes(col.type);

// View-only report screen: period picker, summary cards, optional chart, table with totals.
export default function ReportView({ report }) {
  const [state, setState] = useState({ rows: null, error: null });
  const [period, setPeriod] = useState(null); // null until data arrives, '' = all
  const [exporting, setExporting] = useState(false);
  const p = report.period;

  useEffect(() => {
    let cancelled = false;
    fetchReport(report)
      .then((rows) => !cancelled && setState({ rows, error: null }))
      .catch((e) => !cancelled && setState({ rows: [], error: e.message }));
    return () => { cancelled = true; };
  }, [report]);

  // Periods newest first; default to the current one (latest that has started)
  const periods = useMemo(() => {
    if (!p || !state.rows) return [];
    const seen = new Map();
    for (const r of state.rows) if (!seen.has(periodOf(p, r))) seen.set(periodOf(p, r), r[p.sortKey]);
    // Newest first; groups without a start (e.g. "No financial year") last
    return [...seen]
      .sort((a, b) => (a[1] == null) - (b[1] == null) || String(b[1]).localeCompare(String(a[1])))
      .map(([label, start]) => ({ label, start }));
  }, [p, state.rows]);

  const today = new Date().toISOString().slice(0, 10);
  const selected = period ?? (periods.find((x) => x.start != null && String(x.start) <= today) || periods[0])?.label ?? '';

  const rows = useMemo(
    () => (state.rows || []).filter((r) => !p || !selected || periodOf(p, r) === selected),
    [state.rows, p, selected]
  );
  // With "all" selected, rows are shown in one section per period
  const sections = useMemo(() => {
    if (!p || selected) return [{ label: null, rows }];
    return periods.map((x) => ({ label: x.label, rows: rows.filter((r) => periodOf(p, r) === x.label) }));
  }, [p, selected, periods, rows]);

  if (!state.rows) return <ListSkeleton />;
  if (state.error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-darkcard border border-red-200 dark:border-red-500/30 py-14 px-6 text-center">
        <div className="text-[15px] font-semibold text-red-600">Could not load the report</div>
        <div className="mt-1 text-sm text-slate-500">{state.error}</div>
      </div>
    );
  }

  const cols = report.columns;
  const stats = report.stats ? report.stats(rows) : [];
  const chart = report.chart && (!p || selected) ? report.chart(rows) : null;
  const hasTotals = cols.some((c) => c.total);

  const doExport = async () => {
    if (!rows.length) return notify('Nothing to export', 'error');
    setExporting(true);
    try {
      const exportCols = [
        ...(p && !selected ? [{ key: p.key, label: p.label, type: 'text', computed: (r) => periodOf(p, r) }] : []),
        ...cols.map((c) => ({
          key: c.key,
          label: c.type === 'growth' ? `${c.label} %` : c.label,
          type: c.type === 'currency' ? 'currency' : 'text',
          computed: (r) => {
            const v = r[c.key];
            if (c.type === 'boolean') return v ? 'Yes' : 'No';
            if (v == null) return null;
            return isNumeric(c) ? Number(v) : c.type === 'text' ? v : cellText(c, v);
          },
        })),
      ];
      const slug = report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await exportRows(exportCols, rows, `${slug}-${(selected || 'all').replace(/[^a-z0-9-]+/gi, '')}-${today}.xlsx`);
    } catch (e) {
      notify('Could not export: ' + (e.message || e), 'error');
    } finally {
      setExporting(false);
    }
  };

  const toolBtn = 'press shrink-0 inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl border border-slate-300 dark:border-darkborder bg-white dark:bg-darkbg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50';

  const totalsRow = (list) => (
    <tr className="bg-brand-50/60 dark:bg-white/[0.03] font-semibold text-slate-900 dark:text-white">
      {cols.map((c, i) => {
        const t = totalOf(c, list);
        return (
          <td key={c.key} className={`px-4 py-3 text-[13px] whitespace-nowrap ${isNumeric(c) ? 'text-right tabular-nums' : ''}`}>
            {i === 0 ? 'Total' : t === undefined ? '' : <Cell col={c} value={t} />}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Filters: one row above everything they scope */}
      <div className="flex items-center gap-2">
        {p && (
          <div className="flex-1 md:flex-none md:w-60 min-w-0">
            <CustomDropdown
              label={p.label}
              placeholder={p.allLabel}
              allowAll
              value={selected}
              options={periods.map((x) => x.label)}
              onChange={(v) => setPeriod(v)}
            />
          </div>
        )}
        <span className="hidden md:block flex-1 text-sm text-slate-500 dark:text-slate-400">
          {rows.length.toLocaleString('en-IN')} {rows.length === 1 ? 'row' : 'rows'} · view only
        </span>
        <button type="button" onClick={doExport} disabled={exporting} className={toolBtn} title="Export to Excel">
          <Icon name="download" className="w-4 h-4" />
          <span>{exporting ? 'Exporting...' : 'Export'}</span>
        </button>
      </div>

      {stats.length > 0 && (
        <div className="flex md:grid gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] snap-x">
          {stats.map((s, i) => (
            <div key={s.label} className={`animate-rise snap-start shrink-0 min-w-[160px] md:min-w-0 rounded-2xl bg-gradient-to-br border px-4 py-3.5 shadow-sm ${CARD_TONES[s.tone || 'brand']}`} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
              <div className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{s.value}</div>
              {s.detail && <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{s.detail}</div>}
            </div>
          ))}
        </div>
      )}

      {chart && <CompareChart {...chart} />}

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-darkcard border border-slate-200/70 dark:border-darkborder py-14 text-center">
          <div className="text-[15px] font-medium text-slate-700 dark:text-slate-200">No data for this report yet</div>
          <div className="text-[13px] text-slate-500 mt-1">{report.emptyText || 'It fills in as service entries with a date of service are added.'}</div>
        </div>
      ) : (
        <>
          {/* ---------- Desktop table ---------- */}
          <div className="hidden md:block bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder shadow-md shadow-slate-900/5 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-brand-600 via-saffron-500 to-india-500" />
            <div className="overflow-auto max-h-[calc(100vh-260px)]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-brand-50 dark:bg-darkbg">
                  <tr>
                    {cols.map((c) => (
                      <th key={c.key} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-slate-400 border-b border-brand-100 dark:border-darkborder whitespace-nowrap ${isNumeric(c) ? 'text-right' : ''}`}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                {sections.map((s) => (
                  <tbody key={s.label ?? 'all'}>
                    {s.label && (
                      <tr className="bg-slate-50 dark:bg-white/[0.02]">
                        <td colSpan={cols.length} className="px-4 py-2.5 text-[13px] font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-darkborder">
                          {p.label} {s.label}
                        </td>
                      </tr>
                    )}
                    {s.rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-darkborder/60 hover:bg-brand-50/70 dark:hover:bg-white/[0.04] transition-colors">
                        {cols.map((c) => (
                          <td key={c.key} className={`px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 whitespace-nowrap ${isNumeric(c) ? 'text-right tabular-nums' : 'font-medium text-slate-900 dark:text-white'}`}>
                            <Cell col={c} value={r[c.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {hasTotals && totalsRow(s.rows)}
                  </tbody>
                ))}
              </table>
            </div>
          </div>

          {/* ---------- Mobile list ---------- */}
          <div className="md:hidden space-y-5">
            {sections.map((s) => (
              <div key={s.label ?? 'all'}>
                {s.label && <div className="px-4 mb-1.5 text-[12px] uppercase tracking-wide text-slate-500">{p.label} {s.label}</div>}
                <div className="rounded-2xl bg-white dark:bg-darkcard overflow-hidden shadow-sm">
                  {s.rows.map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < s.rows.length - 1 ? 'border-b border-slate-100 dark:border-darkborder' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-semibold text-slate-900 dark:text-white truncate">{report.mobile.title(r)}</div>
                        <div className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{report.mobile.subtitle(r)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-semibold tabular-nums text-slate-900 dark:text-white">{report.mobile.value(r)}</div>
                        {report.mobile.growthKey && <Growth value={r[report.mobile.growthKey]} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
