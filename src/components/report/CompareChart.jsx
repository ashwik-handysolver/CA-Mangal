import { useState } from 'react';

// Two-series column chart (e.g. this year vs last year per month).
// Colours checked for colour-blind separation and contrast on the light and dark card surfaces.
const SERIES_CLASS = ['bg-[#1f4a9e] dark:bg-[#5b86d6]', 'bg-[#d9730d]'];

// Round the axis top up to a clean step (1, 2, 2.5, 5 × 10^n)
function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw);
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

// groups: [{ key, label, fullLabel, values: [number|null, number|null] }]
// series: [{ label }], format: value -> tooltip text, axisFormat: value -> axis text
export default function CompareChart({ title, subtitle, groups, series, format, axisFormat = format }) {
  const [active, setActive] = useState(null);
  const ticks = niceTicks(Math.max(0, ...groups.flatMap((g) => g.values.map((v) => v || 0))));
  const top = ticks[ticks.length - 1];
  const pct = (v) => `${Math.max(0, (v / top) * 100)}%`;

  return (
    <section className="rounded-2xl bg-white dark:bg-darkcard border border-slate-200/70 dark:border-darkborder shadow-sm p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 mb-5">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-[13px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {/* Legend: identity never relies on colour alone */}
        <div className="flex items-center gap-4 text-[13px] text-slate-600 dark:text-slate-300">
          {series.map((s, i) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-[3px] ${SERIES_CLASS[i]}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {/* Y axis */}
        <div className="relative w-14 shrink-0 h-[220px] text-right text-[11px] text-slate-400 tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: pct(t) }}>{axisFormat(t)}</span>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          {/* Gridlines */}
          <div className="absolute inset-x-0 top-0 h-[220px] pointer-events-none">
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 h-px bg-slate-100 dark:bg-white/[0.06]" style={{ bottom: pct(t) }} />
            ))}
          </div>

          <div className="relative flex">
            {groups.map((g, gi) => (
              <div key={g.key} className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onMouseEnter={() => setActive(gi)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(gi)}
                  onBlur={() => setActive(null)}
                  aria-label={`${g.fullLabel}: ${series.map((s, i) => `${s.label} ${g.values[i] == null ? 'no data' : format(g.values[i])}`).join(', ')}`}
                  className={`w-full h-[220px] flex items-end justify-center gap-[2px] rounded-t-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/40 ${active === gi ? 'bg-slate-100/70 dark:bg-white/[0.04]' : ''}`}
                >
                  {g.values.map((v, i) => (
                    <span
                      key={i}
                      className={`w-[38%] max-w-[24px] rounded-t-[4px] transition-[height,opacity] duration-500 ${SERIES_CLASS[i]} ${active != null && active !== gi ? 'opacity-60' : ''}`}
                      style={{ height: v ? pct(v) : 0 }}
                    />
                  ))}
                </button>
                <div className="mt-1.5 text-center text-[10.5px] md:text-[11px] text-slate-500 dark:text-slate-400 truncate">{g.label}</div>

                {/* Tooltip: values lead, series names follow */}
                {active === gi && (
                  <div
                    className={`absolute z-10 top-1 min-w-[150px] rounded-xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkbg shadow-lg px-3 py-2 pointer-events-none ${
                      gi < groups.length / 2 ? 'left-1/2' : 'right-1/2'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500 mb-1">{g.fullLabel}</div>
                    {series.map((s, i) => (
                      <div key={s.label} className="flex items-center gap-2 text-[12px] whitespace-nowrap">
                        <span className={`w-3 h-[3px] rounded-full ${SERIES_CLASS[i]}`} />
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{g.values[i] == null ? '-' : format(g.values[i])}</span>
                        <span className="text-slate-500">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
