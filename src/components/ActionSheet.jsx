import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '../lib/hooks';

// iOS action sheet: floating options card + separate Cancel card.
export default function ActionSheet({ title, message, actions, onClose }) {
  useLockBodyScroll(onClose);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
      <div className="absolute inset-0 bg-black/40 animate-fade" onClick={onClose} />
      <div className="relative w-full max-w-md space-y-2 animate-sheet">
        <div className="overflow-hidden rounded-2xl bg-white/95 dark:bg-darkcard backdrop-blur-xl">
          {(title || message) && (
            <div className="px-4 py-3 text-center border-b border-slate-200 dark:border-darkborder">
              {title && <div className="text-[13px] font-semibold text-slate-500">{title}</div>}
              {message && <div className="text-[13px] text-slate-400 mt-0.5">{message}</div>}
            </div>
          )}
          {actions.map((a, i) => (
            <button
              key={a.label}
              onClick={() => { onClose(); a.onClick(); }}
              className={`flex w-full items-center justify-center gap-2 py-4 text-[19px] active:bg-slate-100 dark:active:bg-white/10 ${i > 0 || title ? 'border-t border-slate-200 dark:border-darkborder' : ''} ${a.destructive ? 'text-red-600' : 'text-brand-600 dark:text-brand-500'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full rounded-2xl bg-white/95 dark:bg-darkcard py-4 text-[19px] font-semibold text-brand-600 dark:text-brand-500 active:bg-slate-100 dark:active:bg-white/10">
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
