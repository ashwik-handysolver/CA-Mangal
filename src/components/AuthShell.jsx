import { FIRM } from './nav';

export const authInput =
  'block w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30';

const GLYPHS = [
  { c: '₹', x: '8%', y: '14%', s: 64, d: '0s' },
  { c: '%', x: '78%', y: '10%', s: 48, d: '-2s' },
  { c: '₹', x: '66%', y: '46%', s: 88, d: '-5s' },
  { c: '=', x: '14%', y: '58%', s: 56, d: '-3s' },
  { c: '+', x: '40%', y: '78%', s: 52, d: '-6s' },
  { c: '%', x: '84%', y: '80%', s: 60, d: '-1s' },
];

function Brand() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-ink text-white">
      <div className="ledger absolute inset-0 pointer-events-none" />
      <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-saffron-500/25 blur-3xl animate-float" />
      <div className="absolute -bottom-28 -left-16 w-96 h-96 rounded-full bg-india-500/20 blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      {GLYPHS.map((g, i) => (
        <span key={i} className="absolute font-display font-bold text-white/[0.07] select-none animate-float" style={{ left: g.x, top: g.y, fontSize: g.s, animationDelay: g.d }}>
          {g.c}
        </span>
      ))}
      <div className="relative h-full flex flex-col justify-between p-8 md:p-12">
        <div className="rounded-2xl bg-white px-4 py-3 w-fit shadow-xl animate-rise">
          <img src="/logo.png" alt={`${FIRM.name}, ${FIRM.tagline}`} className="h-12 md:h-14 w-auto object-contain" />
        </div>
        <div className="hidden lg:block max-w-md">
          <h2 className="animate-rise font-display text-4xl font-bold leading-tight" style={{ animationDelay: '120ms' }}>
            Books, filings and fees, all in one place.
          </h2>
          <p className="animate-rise mt-4 text-blue-100/85 leading-relaxed" style={{ animationDelay: '220ms' }}>
            Track every client, every service and every rupee collected for the firm.
          </p>
          <div className="animate-rise mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-saffron-500 font-medium" style={{ animationDelay: '320ms' }}>
            {FIRM.motto}
          </div>
        </div>
        <p className="hidden lg:block text-xs text-blue-100/50">&copy; {new Date().getFullYear()} {FIRM.name}</p>
      </div>
    </div>
  );
}

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-2 bg-canvas">
      {/* Mobile: brand banner on top, form card rises over it (iOS sheet style) */}
      <div className="lg:h-auto h-[260px] pt-safe lg:pt-0 relative">
        <Brand />
      </div>

      <div className="relative -mt-8 lg:mt-0 rounded-t-[28px] lg:rounded-none bg-canvas dark:bg-darkbg flex items-start lg:items-center justify-center px-6 pt-8 pb-12 animate-sheet lg:animate-none">
        <div className="w-full max-w-sm">
          <h1 className="animate-rise font-display text-[30px] font-bold tracking-tight text-slate-900 dark:text-white" style={{ animationDelay: '100ms' }}>{title}</h1>
          <p className="animate-rise mt-1.5 text-sm text-slate-500" style={{ animationDelay: '160ms' }}>{subtitle}</p>
          <div className="animate-rise mt-8" style={{ animationDelay: '220ms' }}>{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
