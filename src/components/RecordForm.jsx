import { createPortal } from 'react-dom';
import CustomDropdown from './CustomDropdown';
import Icon from './Icon';
import { Grabber } from './Sheet';
import { useSheetDrag, useLockBodyScroll } from '../lib/hooks';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const control =
  'w-full h-12 md:h-11 rounded-xl md:rounded-lg border border-slate-300 dark:border-darkborder bg-white dark:bg-darkbg px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30';

const WIDE_KEYS = new Set(['name', 'address', 'notes', 'remarks', 'clientName', 'expenseName']);

// Add / edit container.
// Mobile: iOS modal sheet (Cancel | Title | Save, drag down to dismiss).
// Desktop: slide-over from the right.
export function Drawer({ title, subtitle, onClose, onSubmit, saving, submitLabel, children, compact = false }) {
  const { handlers, style } = useSheetDrag(onClose);
  useLockBodyScroll(onClose);

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex items-end ${compact ? 'md:items-center md:justify-center' : 'md:items-stretch md:justify-end'}`}>
      <div className="absolute inset-0 bg-black/45 animate-fade" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        style={style}
        className={`relative flex w-full flex-col bg-[#f2f2f7] md:bg-white dark:bg-darkcard shadow-2xl animate-sheet rounded-t-[28px] ${compact ? 'max-h-[93dvh] md:max-w-[520px] md:rounded-2xl md:animate-pop' : 'h-[93dvh] md:h-full md:max-w-[560px] md:rounded-none md:animate-drawer'}`}
      >
        {/* Mobile header */}
        <div {...handlers} className="md:hidden touch-none shrink-0">
          <Grabber />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pt-2 pb-3">
            <button type="button" onClick={onClose} className="justify-self-start text-[17px] text-brand-600 dark:text-brand-500">Cancel</button>
            <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">{title}</h2>
            <button type="submit" disabled={saving} className="justify-self-end text-[17px] font-semibold text-brand-600 dark:text-brand-500 disabled:opacity-40">
              {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-start justify-between gap-4 px-8 pt-7 pb-5 border-b border-slate-200 dark:border-darkborder">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="press -mr-2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-8 py-2 md:py-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="rounded-2xl bg-white dark:bg-darkcard md:bg-transparent p-4 md:p-0">{children}</div>
        </div>

        {/* Desktop footer */}
        <div className="hidden md:flex items-center justify-end gap-3 px-8 py-4 border-t border-slate-200 dark:border-darkborder bg-slate-50/70 dark:bg-darkbg/40">
          <button type="button" onClick={onClose} className="press h-10 px-4 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10">Cancel</button>
          <button type="submit" disabled={saving} className="press h-10 px-5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 shadow-md shadow-brand-600/25">
            {saving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export function Field({ label, required, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={control} />;
}

// Form body for AdvancedTable rows, driven by the column definitions.
export default function RecordForm({ columns, values, onChange, data }) {
  const fields = columns.filter((c) => c.type !== 'action' && c.key !== 'index');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
      {fields.map((col) => {
        const value = values[col.key];
        const wide = col.type === 'textarea' || WIDE_KEYS.has(col.key);
        const common = { label: col.label, required: col.required, className: wide ? 'sm:col-span-2' : '' };

        if (col.computed || col.autoGenerate) {
          const auto = col.computed ? col.computed(values) : col.autoGenerate(data, values);
          return (
            <Field key={col.key} {...common} hint="Calculated automatically">
              <div className="h-12 md:h-11 flex items-center rounded-xl md:rounded-lg border border-dashed border-slate-300 dark:border-darkborder bg-slate-50 dark:bg-darkbg/60 px-3.5 text-sm text-slate-500">
                {col.type === 'currency' ? inr.format(auto || 0) : auto || '-'}
              </div>
            </Field>
          );
        }

        if (col.type === 'select' || col.type === 'user') {
          return (
            <Field key={col.key} {...common}>
              <CustomDropdown label={col.label} placeholder={`Select ${col.label.toLowerCase()}`} value={value || ''} options={col.options || []} onChange={(v) => onChange(col.key, v)} />
            </Field>
          );
        }

        if (col.type === 'toggle') {
          return (
            <div key={col.key} className="sm:col-span-2">
              <button
                type="button"
                onClick={() => onChange(col.key, !value)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-300 dark:border-darkborder px-4 py-3 text-left transition active:bg-slate-50 dark:active:bg-white/5"
              >
                <span className="text-[15px] md:text-sm font-medium text-slate-800 dark:text-slate-100">{col.label}</span>
                <span className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors duration-200 ${value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`inline-block h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-200 ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </span>
              </button>
            </div>
          );
        }

        if (col.type === 'textarea') {
          return (
            <Field key={col.key} {...common}>
              <textarea rows="3" value={value || ''} onChange={(e) => onChange(col.key, e.target.value)} placeholder={`Add ${col.label.toLowerCase()}`} className={`${control} h-auto py-2.5 resize-none`} />
            </Field>
          );
        }

        if (col.type === 'currency') {
          return (
            <Field key={col.key} {...common}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">&#8377;</span>
                <input type="number" inputMode="decimal" min="0" step="any" value={value ?? ''} onChange={(e) => onChange(col.key, e.target.value)} placeholder="0" className={`${control} pl-8 tabular-nums`} />
              </div>
            </Field>
          );
        }

        return (
          <Field key={col.key} {...common}>
            <TextInput
              type={col.type === 'date' ? 'date' : col.type === 'email' ? 'email' : 'text'}
              inputMode={col.key === 'phoneNumber' ? 'tel' : undefined}
              value={value ?? ''}
              onChange={(e) => onChange(col.key, e.target.value)}
              placeholder={col.type === 'date' ? undefined : `Enter ${col.label.toLowerCase()}`}
            />
          </Field>
        );
      })}
    </div>
  );
}
