// Formatting shared by the report screens.
const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const inr = (n) => inrFmt.format(Number(n) || 0);
export const count = (n) => (n == null ? '-' : Number(n).toLocaleString('en-IN'));

// ₹1.25 Cr / ₹4.50 L / ₹12,300
export function compactINR(n) {
  n = Number(n) || 0;
  const v = Math.abs(n);
  if (v >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return inr(n);
}

// "2025-04-01" -> "Apr 2025" (or "Apr" when short)
export function monthLabel(iso, short = false) {
  const [y, m] = String(iso).split('-').map(Number);
  if (!y || !m) return '-';
  return new Date(y, m - 1, 1).toLocaleString('en-IN', short ? { month: 'short' } : { month: 'short', year: 'numeric' });
}

export const growthText = (pct) => (pct == null ? '-' : `${pct > 0 ? '+' : ''}${Number(pct).toFixed(1)}%`);

// Sum of a field, or null when no row has a value
export function sumOf(rows, key) {
  let seen = false;
  const total = rows.reduce((s, r) => {
    if (r[key] == null) return s;
    seen = true;
    return s + Number(r[key]);
  }, 0);
  return seen ? total : null;
}

// Change from `before` to `after` in percent; null when there is nothing to compare with
export const pctChange = (after, before) => (before ? ((after - before) / before) * 100 : null);
