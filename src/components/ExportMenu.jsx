import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import ActionSheet from './ActionSheet';
import { useIsMobile } from '../lib/hooks';

// Export button with a choice of what to export.
// options: [{ label, detail, onClick }]. Desktop: popover. Mobile: action sheet.
export default function ExportMenu({ options, busy, className = '' }) {
  const [open, setOpen] = useState(false);
  const mobile = useIsMobile();
  const ref = useRef(null);

  useEffect(() => {
    if (!open || mobile) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, mobile]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" disabled={busy} onClick={() => setOpen(!open)} className={className} title="Export to Excel" aria-haspopup="menu" aria-expanded={open}>
        <Icon name="download" className="w-4 h-4" />
        <span className="hidden md:inline">{busy ? 'Exporting...' : 'Export'}</span>
        <Icon name="chevron" className="hidden md:block w-3.5 h-3.5 opacity-60" />
      </button>

      {open && mobile && (
        <ActionSheet
          title="Export to Excel"
          onClose={() => setOpen(false)}
          actions={options.map((o) => ({ label: `${o.label} (${o.detail})`, onClick: o.onClick }))}
        />
      )}

      {open && !mobile && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 z-[120] w-64 rounded-xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard shadow-xl overflow-hidden animate-pop origin-top-right py-1">
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); o.onClick(); }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{o.label}</span>
              <span className="block text-xs text-slate-500">{o.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
