const fmt = (iso) => iso.split('-').reverse().join('/');

// Date range of a mii_financial_years row as ["YYYY-MM-DD", "YYYY-MM-DD"] (both ends included).
// Uses the saved start/end dates; when missing, reads the label as an Indian
// financial year: "2025-26" or "2025-2026" -> 1 Apr 2025 to 31 Mar 2026.
export function fyRange(year) {
  const start = year.start_date?.slice(0, 10);
  const end = year.end_date?.slice(0, 10);
  if (start && end) return [start, end];

  const m = String(year.label ?? '').match(/(\d{4})\s*[-–/]\s*(\d{2}|\d{4})\b/);
  if (!m) return null;
  const from = Number(m[1]);
  let to = Number(m[2]);
  if (m[2].length === 2) to += Math.floor(from / 100) * 100 + (to < from % 100 ? 100 : 0); // "26" -> 2026, "2099-00" -> 2100
  if (to !== from + 1) return null;
  return [start || `${from}-04-01`, end || `${to}-03-31`];
}

// Options for AdvancedTable's selectFilter: one per financial year, newest first.
// A row matches when its date (row[dateKey], "YYYY-MM-DD") falls inside the year.
export function fyFilterOptions(years, dateKey) {
  return (years || [])
    .map((y) => ({ label: String(y.label ?? '').trim(), range: fyRange(y) }))
    .filter((y) => y.label)
    .sort((a, b) => (b.range?.[0] || '').localeCompare(a.range?.[0] || '') || b.label.localeCompare(a.label))
    .map(({ label, range }) => ({
      value: label,
      detail: range ? `${fmt(range[0])} – ${fmt(range[1])}` : 'No dates set for this year',
      test: (row) => {
        const d = String(row[dateKey] || '').slice(0, 10);
        return !!(range && d && d >= range[0] && d <= range[1]);
      },
    }));
}
