// Value of an auto-generated column (e.g. client number / code).
// New record: always generated. Existing record: the saved value is kept unless
// one of the column's `dependsOn` fields changed or nothing was saved yet; the
// record itself is left out when working out the next number.
export function autoValue(col, data, row, original) {
  if (!original) return col.autoGenerate(data, row) || '';
  const stored = original[col.key] || '';
  const changed = (col.dependsOn || []).some((k) => String(row[k] ?? '') !== String(original[k] ?? ''));
  if (stored && !changed) return stored;
  const others = data.filter((r) => r.id !== original.id);
  return col.autoGenerate(others, row) || stored;
}
