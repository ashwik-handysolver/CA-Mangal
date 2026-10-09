import { useEffect, useState } from 'react';
import Icon from './Icon';

const TONES = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800',
};

export default function FeedbackHost() {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const onToast = (e) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, ...e.detail }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
    };
    const onConfirm = (e) => setDialog(e.detail);
    window.addEventListener('app:toast', onToast);
    window.addEventListener('app:confirm', onConfirm);
    return () => {
      window.removeEventListener('app:toast', onToast);
      window.removeEventListener('app:confirm', onConfirm);
    };
  }, []);

  const answer = (value) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  return (
    <>
      {/* Toasts: slide in from the top like iOS banners */}
      <div className="fixed inset-x-0 top-0 z-[300] flex flex-col items-center gap-2 px-4 pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-2xl ${TONES[t.type] || TONES.info}`} style={{ animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <Icon name={t.type === 'error' ? 'close' : 'note'} className="w-4 h-4 shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* iOS-style alert */}
      {dialog && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 animate-fade" onClick={() => answer(false)} />
          <div className="relative w-full max-w-[290px] overflow-hidden rounded-2xl bg-white/95 dark:bg-darkcard shadow-2xl animate-pop" role="alertdialog">
            <div className="px-5 pt-5 pb-4 text-center">
              <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white">{dialog.title}</h3>
              {dialog.message && <p className="mt-1 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{dialog.message}</p>}
            </div>
            <div className="grid grid-cols-2 border-t border-slate-200 dark:border-darkborder">
              <button onClick={() => answer(false)} className="py-3 text-[17px] text-brand-600 dark:text-brand-500 active:bg-slate-100 dark:active:bg-white/10">Cancel</button>
              <button onClick={() => answer(true)} className={`py-3 text-[17px] font-semibold border-l border-slate-200 dark:border-darkborder active:bg-slate-100 dark:active:bg-white/10 ${dialog.destructive ? 'text-red-600' : 'text-brand-600 dark:text-brand-500'}`}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
