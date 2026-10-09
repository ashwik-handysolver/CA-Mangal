import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import Sheet from './Sheet';
import { useIsMobile } from '../lib/hooks';

const MAX_VISIBLE = 200;

// Searchable select. Options are plain strings; value is the selected string.
// Desktop: popover under the field. Mobile: iOS-style picker sheet.
export default function CustomDropdown({ options = [], value, onChange, placeholder = 'Select', label, allowAll = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openUp, setOpenUp] = useState(false);
  const mobile = useIsMobile();
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open || mobile) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, mobile]);

  const toggle = () => {
    if (!open) {
      const rect = ref.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 300 && rect.top > 300);
      setQuery('');
      if (!mobile) setTimeout(() => searchRef.current?.focus(), 0);
    }
    setOpen(!open);
  };

  const pick = (v) => { onChange(v); setOpen(false); };

  const q = query.trim().toLowerCase();
  const matches = q ? options.filter((o) => String(o).toLowerCase().includes(q)) : options;
  const shown = matches.slice(0, MAX_VISIBLE);

  const search = (
    <div className="relative">
      <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); if (shown[0] !== undefined) pick(shown[0]); }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search"
        className="w-full h-10 rounded-xl bg-slate-100 dark:bg-darkbg pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
      />
    </div>
  );

  const list = (
    <>
      {allowAll && <button type="button" onClick={() => pick('')} className="w-full text-left px-4 py-3 text-[15px] text-slate-600 active:bg-slate-100">All</button>}
      {shown.map((opt, i) => (
        <button
          type="button"
          key={`${opt}-${i}`}
          onClick={() => pick(opt)}
          className={`w-full flex items-center justify-between gap-2 text-left px-4 py-3 md:py-2 text-[15px] md:text-sm active:bg-slate-100 dark:active:bg-white/10 md:hover:bg-slate-50 dark:md:hover:bg-white/5 ${value === opt ? 'text-brand-700 dark:text-brand-100 font-medium' : 'text-slate-800 dark:text-slate-200'}`}
        >
          <span className="truncate">{opt}</span>
          {value === opt && <span className="text-brand-600">&#10003;</span>}
        </button>
      ))}
      {shown.length === 0 && <div className="px-4 py-4 text-sm text-slate-400">No matches</div>}
      {matches.length > MAX_VISIBLE && (
        <div className="px-4 py-2 text-xs text-slate-400">Showing first {MAX_VISIBLE} of {matches.length}. Type to narrow down.</div>
      )}
    </>
  );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className={`w-full h-12 md:h-11 flex items-center justify-between gap-2 rounded-xl md:rounded-lg border bg-white dark:bg-darkbg px-3.5 text-left text-sm transition ${open ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-slate-300 dark:border-darkborder hover:border-slate-400'}`}
      >
        <span className={`truncate ${value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{value || placeholder}</span>
        <span className="flex items-center gap-1 shrink-0">
          {value && (
            <span role="button" tabIndex={-1} onClick={(e) => { e.stopPropagation(); onChange(''); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10" title="Clear">
              <Icon name="close" className="w-3.5 h-3.5" />
            </span>
          )}
          <Icon name="chevron" className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && mobile && (
        <Sheet onClose={() => setOpen(false)} title={label || placeholder} z={160}>
          <div className="mb-3">{search}</div>
          <div className="rounded-2xl bg-white dark:bg-darkbg overflow-hidden divide-y divide-slate-100 dark:divide-darkborder max-h-[55dvh] overflow-y-auto">{list}</div>
        </Sheet>
      )}

      {open && !mobile && (
        <div className={`absolute z-[120] left-0 right-0 rounded-xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard shadow-xl overflow-hidden animate-pop ${openUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'}`}>
          <div className="p-2 border-b border-slate-100 dark:border-darkborder">{search}</div>
          <div className="max-h-56 overflow-y-auto py-1">{list}</div>
        </div>
      )}
    </div>
  );
}
