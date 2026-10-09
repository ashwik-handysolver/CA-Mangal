import { supabase } from '../lib/supabase';
import { fyRange } from '../lib/financialYear';
import { compactINR, count, growthText, inr, monthLabel, pctChange, sumOf } from '../components/report/format';

// Loads the financial years and returns date ("YYYY-MM-DD") => { label, range } | null
async function loadFyLookup() {
  const { data, error } = await supabase.from('mii_financial_years').select('label,start_date,end_date');
  if (error) throw error;
  const ranges = data.map((y) => ({ label: y.label, range: fyRange(y) })).filter((y) => y.range);
  return (date) => {
    const d = String(date || '').slice(0, 10);
    return d ? ranges.find((y) => d >= y.range[0] && d <= y.range[1]) ?? null : null;
  };
}

// Every report screen, keyed by its URL (/app/reports/:name). Each report reads one
// database view (see supabase/migrations) and is shown by <ReportView />.
//
//   source    view name; order: [[column, ascending, nullsFirst?], ...]
//   select    optional PostgREST select (default '*'); filters: [[column, operator, value], ...]
//   transform optional (rows) => rows (may be async)
//   emptyText optional hint shown when there are no rows
//   period    optional picker that shows one group at a time (e.g. financial year):
//             key = row field, sortKey = field ordering the groups (newest first),
//             noneLabel = name for rows whose key is empty
//   columns   { key, label, type, total, blankEmpty }
//             type: text | month | date | count | currency | growth | boolean
//             blankEmpty: empty cells stay blank instead of showing "-"
//             total: 'sum' | 'last' (running totals) | (rows) => value
//   stats     (rows) => summary cards for what is on screen
//   chart     optional (rows of one period) => props for <CompareChart />
//   mobile    how a row looks in the phone list

export const REPORTS = {
  cumulative: {
    title: 'Cumulative Report',
    source: 'mii_report_cumulative',
    order: [['fy_start', false, false], ['year_month', true]],
    period: { key: 'label', sortKey: 'fy_start', label: 'Financial year', allLabel: 'All financial years', noneLabel: 'No financial year' },
    columns: [
      { key: 'year_month', label: 'Month', type: 'month' },
      { key: 'monthly_fees_count', label: 'Entries', type: 'count', total: 'sum' },
      { key: 'monthly_fees_total', label: 'Fees', type: 'currency', total: 'sum' },
      { key: 'prev_year_monthly_fees_total', label: 'Same month last year', type: 'currency', total: 'sum' },
      {
        key: 'net_profit_percentage',
        label: 'YoY %',
        type: 'growth',
        total: (rows) => pctChange(sumOf(rows, 'monthly_fees_total'), sumOf(rows, 'prev_year_monthly_fees_total')),
      },
      { key: 'cumulative_monthly_count', label: 'Entries to date', type: 'count', total: 'last' },
      { key: 'cumulative_monthly_fees_total', label: 'Fees to date', type: 'currency', total: 'last' },
      { key: 'quarterly_count', label: 'Quarter entries', type: 'count' },
    ],
    stats: (rows) => {
      const fees = sumOf(rows, 'monthly_fees_total') || 0;
      const best = rows.reduce((b, r) => (Number(r.monthly_fees_total) > Number(b?.monthly_fees_total ?? -1) ? r : b), null);
      const growth = pctChange(fees, sumOf(rows, 'prev_year_monthly_fees_total'));
      return [
        { label: 'Total fees', value: compactINR(fees), tone: 'violet' },
        { label: 'Entries', value: count(sumOf(rows, 'monthly_fees_count') || 0) },
        { label: 'Vs same months last year', value: growthText(growth), tone: growth == null ? 'brand' : growth >= 0 ? 'green' : 'rose' },
        { label: 'Best month', value: best ? monthLabel(best.year_month) : '-', detail: best ? inr(best.monthly_fees_total) : '', tone: 'amber' },
      ];
    },
    // Whole financial year on the axis (12 months from its start), empty months included.
    // Not drawn for the "no financial year" group, which has no year to lay out.
    chart: (rows) => {
      if (!rows.length || !rows[0].fy_start) return null;
      const [y, m] = String(rows[0].fy_start).split('-').map(Number);
      const byMonth = Object.fromEntries(rows.map((r) => [r.year_month, r]));
      const groups = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(y, m - 1 + i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const r = byMonth[ym];
        return {
          key: ym,
          label: monthLabel(ym, true),
          fullLabel: monthLabel(ym),
          values: [r ? Number(r.monthly_fees_total) || 0 : 0, r ? Number(r.prev_year_monthly_fees_total) : null],
        };
      });
      return {
        title: 'Monthly fees',
        subtitle: 'Compared with the same month a year earlier',
        series: [{ label: 'This year' }, { label: 'Last year' }],
        groups,
        format: inr,
        axisFormat: (v) => compactINR(v).replace('.00', ''),
      };
    },
    mobile: {
      title: (r) => (r.year_month ? monthLabel(r.year_month) : 'No date of service'),
      subtitle: (r) => `${count(r.monthly_fees_count)} entries · ${compactINR(r.cumulative_monthly_fees_total)} to date`,
      value: (r) => inr(r.monthly_fees_total),
      growthKey: 'net_profit_percentage',
    },
  },

  'summary-of-income': {
    title: 'Summary Of Income',
    // Reads the table directly; the year column links to mii_financial_years
    source: 'mii_summary_of_income',
    select: 'id,year,amount,expenses,net_profit,growth_revenue,growth_profit,previous_year_amount,created_at,updated_at,fy:mii_financial_years(label,start_date)',
    order: [['year', false]],
    // Newest financial year first (by its start date, falling back to the year id)
    transform: (rows) =>
      rows
        .map(({ fy, ...r }) => ({ ...r, fy_label: fy?.label ?? null, fy_start: fy?.start_date ?? null }))
        .sort((a, b) => String(b.fy_start ?? '').localeCompare(String(a.fy_start ?? '')) || (b.year ?? 0) - (a.year ?? 0)),
    emptyText: 'It fills in as yearly income summaries are added.',
    columns: [
      { key: 'fy_label', label: 'Financial year', type: 'text' },
      { key: 'amount', label: 'Income', type: 'currency', total: 'sum' },
      { key: 'previous_year_amount', label: 'Previous year income', type: 'currency' },
      { key: 'growth_revenue', label: 'Revenue growth', type: 'growth' },
      { key: 'expenses', label: 'Expenses', type: 'currency', total: 'sum' },
      { key: 'net_profit', label: 'Net profit', type: 'currency', total: 'sum' },
      { key: 'growth_profit', label: 'Profit growth', type: 'growth' },
    ],
    stats: (rows) => {
      const latest = rows[0];
      const income = sumOf(rows, 'amount') || 0;
      const profit = sumOf(rows, 'net_profit') || 0;
      const g = latest?.growth_revenue == null ? null : Number(latest.growth_revenue);
      return [
        { label: 'Total income', value: compactINR(income), tone: 'violet' },
        { label: 'Total expenses', value: compactINR(sumOf(rows, 'expenses') || 0), tone: 'rose' },
        { label: 'Total net profit', value: compactINR(profit), detail: income ? `${((profit / income) * 100).toFixed(1)}% margin` : '', tone: 'green' },
        { label: latest?.fy_label ? `Revenue growth ${latest.fy_label}` : 'Latest revenue growth', value: growthText(g), tone: g == null ? 'brand' : g >= 0 ? 'green' : 'rose' },
      ];
    },
    // Oldest year on the left
    chart: (rows) => {
      if (!rows.length) return null;
      const groups = [...rows].reverse().map((r) => ({
        key: String(r.id),
        label: r.fy_label || '-',
        fullLabel: r.fy_label ? `FY ${r.fy_label}` : 'No financial year',
        values: [r.amount == null ? null : Number(r.amount), r.expenses == null ? null : Number(r.expenses)],
      }));
      return {
        title: 'Income and expenses',
        subtitle: 'By financial year',
        series: [{ label: 'Income' }, { label: 'Expenses' }],
        groups,
        format: inr,
        axisFormat: (v) => compactINR(v).replace('.00', ''),
      };
    },
    mobile: {
      title: (r) => r.fy_label || 'No financial year',
      subtitle: (r) => `Expenses ${compactINR(r.expenses)} · Profit ${compactINR(r.net_profit)}`,
      value: (r) => inr(r.amount),
      growthKey: 'growth_revenue',
    },
  },

  // Service entries of clients marked "New Client", grouped by the financial year of the service date
  'new-clients': {
    title: 'New Clients',
    source: 'mii_service_status',
    select:
      'id,fees,received,assigned_to,date_of_service,payment_status,job_completed,' +
      'client:mii_clients!inner(name,file_number,client_code,new_client),service:mii_service_types(name),mode:mii_modes_of_payment(name)',
    filters: [['client.new_client', 'eq', 1]],
    order: [['date_of_service', false, false], ['id', false]],
    transform: async (rows) => {
      const fyOf = await loadFyLookup();
      return rows.map(({ client, service, mode, ...r }) => {
        const fy = fyOf(r.date_of_service);
        return {
          ...r,
          client_name: client.client_code ? `${client.name} (${client.client_code})` : client.name,
          file_number: client.file_number,
          service_type: service?.name ?? null,
          mode_of_payment: mode?.name ?? null,
          balance: (Number(r.fees) || 0) - (Number(r.received) || 0),
          fy_label: fy?.label ?? null,
          fy_start: fy?.range[0] ?? null,
        };
      });
    },
    period: { key: 'fy_label', sortKey: 'fy_start', label: 'Financial year', allLabel: 'All financial years', noneLabel: 'No financial year' },
    emptyText: 'It fills in as service entries are added for clients marked as New Client.',
    columns: [
      { key: 'client_name', label: 'Client', type: 'text' },
      { key: 'file_number', label: 'File number', type: 'text' },
      { key: 'date_of_service', label: 'Date of service', type: 'date' },
      { key: 'fees', label: 'Fees', type: 'currency', total: 'sum' },
      { key: 'received', label: 'Received', type: 'currency', total: 'sum' },
      { key: 'balance', label: 'Balance', type: 'currency', total: 'sum' },
      { key: 'assigned_to', label: 'Assigned to', type: 'text' },
      { key: 'service_type', label: 'Type of service', type: 'text' },
      { key: 'mode_of_payment', label: 'Mode of payment', type: 'text' },
      { key: 'job_completed', label: 'Completed', type: 'boolean' },
      { key: 'payment_status', label: 'Payment status', type: 'boolean' },
    ],
    stats: (rows) => {
      const pending = rows.reduce((s, r) => s + Math.max(0, r.balance), 0);
      return [
        { label: 'New clients', value: count(new Set(rows.map((r) => r.client_name)).size), detail: `${count(rows.length)} entries` },
        { label: 'Billed', value: compactINR(sumOf(rows, 'fees') || 0), tone: 'violet' },
        { label: 'Collected', value: compactINR(sumOf(rows, 'received') || 0), tone: 'green' },
        { label: 'Pending', value: compactINR(pending), tone: pending > 0 ? 'amber' : 'brand' },
      ];
    },
    mobile: {
      title: (r) => r.client_name,
      subtitle: (r) => [r.service_type, r.date_of_service && String(r.date_of_service).split('-').reverse().join('/'), r.assigned_to].filter(Boolean).join(' · '),
      value: (r) => inr(r.fees),
    },
  },

  // Entries and fees per team member per month, by calendar year of the date of service.
  // The member's name and yearly figures are shown on their first row of each year.
  'team-contribution': {
    title: 'Team Members Contribution',
    source: 'mii_service_status',
    select: 'id,assigned_to,date_of_service,fees',
    order: [['id', true]],
    transform: (rows) => {
      const groups = new Map();
      const names = new Map(); // "fesal" -> "Fesal": one member however the name was typed
      for (const r of rows) {
        const d = String(r.date_of_service || '').slice(0, 10);
        const typed = String(r.assigned_to || '').trim().replace(/\s+/g, ' ');
        if (!typed) continue; // entries with no one assigned are not counted
        if (!names.has(typed.toLowerCase())) names.set(typed.toLowerCase(), typed);
        const member = names.get(typed.toLowerCase());
        const g = { year: d ? d.slice(0, 4) : null, member, year_month: d ? d.slice(0, 7) : null };
        const key = `${g.year}|${member}|${g.year_month}`;
        if (!groups.has(key)) groups.set(key, { ...g, monthly_count: 0, monthly_total: 0 });
        const row = groups.get(key);
        row.monthly_count += 1;
        row.monthly_total += Number(r.fees) || 0;
      }
      const list = [...groups.values()];
      const yearly = new Map();
      for (const r of list) {
        const k = `${r.year}|${r.member}`;
        const y = yearly.get(k) || { count: 0, total: 0 };
        yearly.set(k, { count: y.count + r.monthly_count, total: y.total + r.monthly_total });
      }
      // Members A-Z, newest year first, then months in order
      list.sort(
        (a, b) =>
          a.member.localeCompare(b.member, 'en', { sensitivity: 'base' }) ||
          String(b.year ?? '').localeCompare(String(a.year ?? '')) ||
          String(a.year_month ?? '').localeCompare(String(b.year_month ?? ''))
      );
      let prev = null;
      return list.map((r) => {
        const k = `${r.year}|${r.member}`;
        const first = k !== prev;
        prev = k;
        const y = yearly.get(k);
        return { ...r, member_label: first ? r.member : null, yearly_count: first ? y.count : null, yearly_total: first ? y.total : null };
      });
    },
    period: { key: 'year', sortKey: 'year', label: 'Year', allLabel: 'All years', noneLabel: 'No date of service' },
    emptyText: 'It fills in as service entries with a date of service are added.',
    columns: [
      { key: 'member_label', label: 'Assigned to', type: 'text', blankEmpty: true },
      { key: 'year_month', label: 'Month', type: 'month' },
      { key: 'monthly_count', label: 'Monthly count', type: 'count', total: 'sum' },
      { key: 'yearly_count', label: 'Yearly count', type: 'count', total: 'sum', blankEmpty: true },
      { key: 'monthly_total', label: 'Monthly total', type: 'currency', total: 'sum' },
      { key: 'yearly_total', label: 'Yearly total', type: 'currency', total: 'sum', blankEmpty: true },
    ],
    stats: (rows) => {
      const top = rows.reduce((b, r) => (r.yearly_total != null && r.yearly_total > (b?.yearly_total ?? -1) ? r : b), null);
      return [
        { label: 'Team members', value: count(new Set(rows.map((r) => r.member)).size) },
        { label: 'Entries', value: count(sumOf(rows, 'monthly_count') || 0) },
        { label: 'Fees', value: compactINR(sumOf(rows, 'monthly_total') || 0), tone: 'violet' },
        { label: 'Top contributor', value: top ? top.member : '-', detail: top ? `${inr(top.yearly_total)} · ${count(top.yearly_count)} entries` : '', tone: 'amber' },
      ];
    },
    mobile: {
      title: (r) => r.member,
      subtitle: (r) => `${r.year_month ? monthLabel(r.year_month) : 'No date'} · ${count(r.monthly_count)} entries`,
      value: (r) => inr(r.monthly_total),
    },
  },

  // New clients' entries and fees per month, by financial year (entries outside every financial year are left out)
  'new-clients-monthly': {
    title: 'New Clients Monthly',
    source: 'mii_service_status',
    select: 'id,date_of_service,fees,client:mii_clients!inner(new_client)',
    filters: [['client.new_client', 'eq', 1]],
    order: [['id', true]],
    transform: async (rows) => {
      const fyOf = await loadFyLookup();
      const groups = new Map();
      for (const r of rows) {
        const fy = fyOf(r.date_of_service);
        if (!fy) continue;
        const ym = String(r.date_of_service).slice(0, 7);
        const key = `${fy.label}|${ym}`;
        if (!groups.has(key)) groups.set(key, { label: fy.label, fy_start: fy.range[0], year_month: ym, monthly_count: 0, monthly_fees_total: 0 });
        const g = groups.get(key);
        g.monthly_count += 1;
        g.monthly_fees_total += Number(r.fees) || 0;
      }
      const list = [...groups.values()].sort((a, b) => a.fy_start.localeCompare(b.fy_start) || a.year_month.localeCompare(b.year_month));
      const yearly = new Map();
      for (const r of list) {
        const y = yearly.get(r.label) || { count: 0, total: 0 };
        yearly.set(r.label, { count: y.count + r.monthly_count, total: y.total + r.monthly_fees_total });
      }
      // Yearly figures on the first month of each financial year
      return list.map((r, i) => {
        const first = i === 0 || list[i - 1].label !== r.label;
        return { ...r, yearly_count_sum: first ? yearly.get(r.label).count : null, yearly_fees_total: first ? yearly.get(r.label).total : null };
      });
    },
    period: { key: 'label', sortKey: 'fy_start', label: 'Financial year', allLabel: 'All financial years' },
    emptyText: 'It fills in as service entries are added for clients marked as New Client.',
    columns: [
      { key: 'year_month', label: 'Month', type: 'month' },
      { key: 'monthly_count', label: 'Monthly count', type: 'count', total: 'sum' },
      { key: 'yearly_count_sum', label: 'Yearly count', type: 'count', total: 'sum', blankEmpty: true },
      { key: 'monthly_fees_total', label: 'Monthly fees', type: 'currency', total: 'sum' },
      { key: 'yearly_fees_total', label: 'Yearly fees', type: 'currency', total: 'sum', blankEmpty: true },
    ],
    stats: (rows) => {
      const best = rows.reduce((b, r) => (r.monthly_fees_total > (b?.monthly_fees_total ?? -1) ? r : b), null);
      return [
        { label: 'Entries', value: count(sumOf(rows, 'monthly_count') || 0) },
        { label: 'Fees', value: compactINR(sumOf(rows, 'monthly_fees_total') || 0), tone: 'violet' },
        { label: 'Best month', value: best ? monthLabel(best.year_month) : '-', detail: best ? inr(best.monthly_fees_total) : '', tone: 'amber' },
      ];
    },
    mobile: {
      title: (r) => monthLabel(r.year_month),
      subtitle: (r) => `${count(r.monthly_count)} entries`,
      value: (r) => inr(r.monthly_fees_total),
    },
  },
};
