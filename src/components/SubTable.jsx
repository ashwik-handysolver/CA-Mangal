import { useState, useEffect, useMemo } from 'react';
import Icon from './Icon';
import ActionSheet from './ActionSheet';
import { Drawer, Field, TextInput } from './RecordForm';
import { confirmAction, notify } from '../lib/notify';

const ROWS_PER_PAGE = 25;

export default function SubTable({ title, itemLabel, initialData, onSave, onDelete }) {
  const [items, setItems] = useState(initialData || []);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sheetItem, setSheetItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const singular = title.endsWith('us') ? title : title.replace(/s$/, '');
  const modalOpen = isAddOpen || !!editing;

  useEffect(() => {
    const open = () => { setEditing(null); setName(''); setIsAddOpen(true); };
    window.addEventListener('open-add-modal', open);
    return () => window.removeEventListener('open-add-modal', open);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => String(i.name).toLowerCase().includes(q)) : items;
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * ROWS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ROWS_PER_PAGE);

  const closeModal = () => { setIsAddOpen(false); setEditing(null); setName(''); };
  const openEdit = (item) => { setEditing(item); setName(item.name); };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const value = name.trim();
    if (!value) { notify(`Enter a ${itemLabel.toLowerCase()}`, 'error'); return; }
    if (saving) return;
    try {
      setSaving(true);
      if (editing) {
        const saved = onSave ? await onSave({ ...editing, name: value }, false, items) : { ...editing, name: value };
        setItems(items.map((i) => (i.id === editing.id ? saved : i)));
        notify('Changes saved', 'success');
      } else {
        const saved = onSave ? await onSave({ name: value }, true, items) : { id: Date.now(), index: Date.now(), name: value };
        setItems([saved, ...items]);
        notify(`${singular} added`, 'success');
      }
      closeModal();
    } catch (err) {
      notify('Could not save: ' + (err.message || err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await confirmAction({ title: `Delete "${item.name}"?`, message: 'This cannot be undone.', confirmLabel: 'Delete', destructive: true });
    if (!ok) return;
    try {
      if (onDelete) await onDelete({ id: item.id });
      setItems((list) => list.filter((i) => i.id !== item.id));
      notify(`${singular} deleted`, 'success');
    } catch (err) {
      notify('Could not delete: ' + (err.message || err), 'error');
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Mobile */}
      <div className="md:hidden">
        <div className="sticky top-0 z-10 -mx-4 px-4 pb-2 pt-1 bg-canvas/90 dark:bg-darkbg/90 backdrop-blur">
          <div className="relative">
            <Icon name="search" className="w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}`} className="w-full h-10 rounded-xl bg-slate-200/70 dark:bg-white/10 pl-10 pr-3 text-slate-900 dark:text-slate-100 placeholder-slate-500 outline-none" />
          </div>
          <div className="mt-2 px-1 text-[12px] uppercase tracking-wide text-slate-500">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</div>
        </div>

        {filtered.length > 0 ? (
          <div className="rounded-2xl bg-white dark:bg-darkcard overflow-hidden shadow-sm">
            {filtered.slice(0, page * 40).map((item, i, arr) => (
              <button key={item.id} onClick={() => setSheetItem(item)} className="w-full flex items-center pl-4 text-left active:bg-slate-100 dark:active:bg-white/5">
                <span className={`flex-1 flex items-center justify-between gap-3 py-3.5 pr-4 ${i < arr.length - 1 ? 'border-b border-slate-100 dark:border-darkborder' : ''}`}>
                  <span className="text-[16px] text-slate-900 dark:text-white truncate">{item.name}</span>
                  <Icon name="chevronLeft" className="w-4 h-4 rotate-180 text-slate-300 shrink-0" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-darkcard py-14 text-center text-[15px] text-slate-500">{query ? 'No matching items' : 'Nothing here yet. Tap + to add one.'}</div>
        )}
        {filtered.length > page * 40 && (
          <button onClick={() => setPage(page + 1)} className="press mt-4 w-full rounded-xl bg-white dark:bg-darkcard py-3.5 text-[16px] font-medium text-brand-600">Show more</button>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-darkborder">
          <div className="relative w-full max-w-sm">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}...`} className="w-full h-10 rounded-xl border border-slate-300 dark:border-darkborder bg-white dark:bg-darkbg pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600" />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{filtered.length}</span> {filtered.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-darkbg">
            <tr>
              <th className="px-4 py-3 w-24 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-darkborder">Index</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-darkborder">{itemLabel}</th>
              <th className="px-4 py-3 w-28 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-darkborder">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, i) => (
              <tr key={item.id} className="animate-rise border-b border-slate-100 dark:border-darkborder/60 hover:bg-brand-50/40 dark:hover:bg-white/[0.03] transition-colors" style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }}>
                <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{item.index}</td>
                <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{item.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(item)} className="press p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-600/20" title="Edit"><Icon name="edit" className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item)} className="press p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15" title="Delete"><Icon name="trash" className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-14 text-center text-sm text-slate-500">{query ? 'No matching items' : 'Nothing here yet. Use "Add new" to create one.'}</td></tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 dark:border-darkborder bg-slate-50/60 dark:bg-darkbg/40 text-sm">
          <span className="text-slate-500">{filtered.length ? `${start + 1}-${Math.min(start + ROWS_PER_PAGE, filtered.length)}` : '0'} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="press px-3 py-1.5 rounded-lg border border-slate-300 dark:border-darkborder text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-white dark:hover:bg-white/5">Previous</button>
            <span className="text-slate-500 tabular-nums">{safePage} / {totalPages}</span>
            <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="press px-3 py-1.5 rounded-lg border border-slate-300 dark:border-darkborder text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-white dark:hover:bg-white/5">Next</button>
          </div>
        </div>
      </div>

      {sheetItem && (
        <ActionSheet
          title={sheetItem.name}
          onClose={() => setSheetItem(null)}
          actions={[
            { label: 'Rename', onClick: () => openEdit(sheetItem) },
            { label: 'Delete', destructive: true, onClick: () => handleDelete(sheetItem) },
          ]}
        />
      )}

      {modalOpen && (
        <Drawer
          compact
          title={`${editing ? 'Edit' : 'New'} ${singular.toLowerCase()}`}
          subtitle={editing ? 'Rename this entry.' : 'Give the new entry a name.'}
          onClose={closeModal}
          onSubmit={handleSave}
          saving={saving}
          submitLabel={editing ? 'Save changes' : `Add ${singular.toLowerCase()}`}
        >
          <Field label={itemLabel} required>
            <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={`Enter ${itemLabel.toLowerCase()}`} />
          </Field>
        </Drawer>
      )}
    </div>
  );
}
