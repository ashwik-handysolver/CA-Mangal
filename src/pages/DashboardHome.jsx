import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchAll } from '../lib/tables';
import { useCountUp } from '../lib/hooks';
import { DashboardSkeleton } from '../components/Skeleton';
import { FIRM } from '../components/nav';
import Icon from '../components/Icon';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const compact = (n) => {
  const v = Math.abs(n);
  if (v >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return inr.format(n);
};
const fmtDate = (v) => (v ? String(v).split('-').reverse().join('/') : '-');

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// Indian financial year (April - March) for today
function currentFY() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `FY ${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

function Count({ value, format }) {
  const v = useCountUp(value);
  return <>{format(v)}</>;
}

const CARD = {
  brand: 'from-brand-50 to-white border-brand-100 dark:from-brand-600/15 dark:to-darkcard dark:border-brand-600/25',
  green: 'from-emerald-50 to-white border-emerald-100 dark:from-emerald-500/10 dark:to-darkcard dark:border-emerald-500/20',
  amber: 'from-saffron-50 to-white border-orange-100 dark:from-saffron-500/10 dark:to-darkcard dark:border-saffron-500/20',
  rose: 'from-rose-50 to-white border-rose-100 dark:from-rose-500/10 dark:to-darkcard dark:border-rose-500/20',
};

const TONES = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-600/25 dark:text-brand-100',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-saffron-50 text-saffron-600 dark:bg-saffron-500/15 dark:text-saffron-500',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
};

function Stat({ label, value, format, hint, icon, tone = 'brand', delay = 0 }) {
  return (
    <div className={`animate-rise rounded-2xl bg-gradient-to-br border p-4 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${CARD[tone]}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`w-10 h-10 rounded-xl grid place-items-center shadow-sm ${TONES[tone]}`}><Icon name={icon} className="w-5 h-5" /></span>
      </div>
      <div className="mt-3 text-[22px] md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
        <Count value={value} format={format} />
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{hint}</div>
    </div>
  );
}

function Card({ title, action, children, delay = 0, flush }) {
  return (
    <section className="animate-rise rounded-2xl bg-white dark:bg-darkcard border border-slate-200/70 dark:border-darkborder shadow-sm overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-darkborder">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h2>
        {action}
      </div>
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

export default function DashboardHome() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [clientCount, services, expenses, types, clients] = await Promise.all([
          supabase.from('mii_clients').select('id', { count: 'exact', head: true }),
          fetchAll('mii_service_status', 'id,client_id,service_type_id,fees,received,job_completed,date_of_service'),
          fetchAll('mii_expenses', 'id,expense_amount'),
          fetchAll('mii_service_types', 'id,name'),
          fetchAll('mii_clients', 'id,name'),
        ]);
        if (clientCount.error) throw clientCount.error;
        if (!cancelled) setState({ loading: false, clients: clientCount.count || 0, services, expenses, types, clientList: clients });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return <DashboardSkeleton />;
  if (state.error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-darkcard border border-red-200 dark:border-red-500/30 py-14 px-6 text-center">
        <div className="text-[15px] font-semibold text-red-600">Could not load the dashboard</div>
        <div className="mt-1 text-sm text-slate-500">{state.error}</div>
      </div>
    );
  }

  const { services, expenses, types, clientList } = state;
  const empty = state.clients === 0 && services.length === 0;

  const billed = services.reduce((s, r) => s + (r.fees || 0), 0);
  const received = services.reduce((s, r) => s + (r.received || 0), 0);
  const outstanding = Math.max(0, billed - received);
  const spent = expenses.reduce((s, r) => s + (r.expense_amount || 0), 0);
  const open = services.filter((r) => !r.job_completed).length;
  const collectedPct = billed ? Math.min(100, Math.round((received / billed) * 100)) : 0;

  const clientName = Object.fromEntries(clientList.map((c) => [c.id, c.name]));
  const typeName = Object.fromEntries(types.map((t) => [t.id, t.name]));

  const byType = {};
  services.forEach((r) => {
    const k = typeName[r.service_type_id] || 'Unspecified';
    byType[k] = (byType[k] || 0) + (r.fees || 0);
  });
  const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = topTypes[0]?.[1] || 1;

  const byMonth = {};
  services.forEach((r) => {
    if (!r.date_of_service) return;
    const k = r.date_of_service.slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + (r.received || 0);
  });
  const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const monthMax = Math.max(1, ...months.map((m) => m[1]));
  const monthLabel = (k) => new Date(k + '-01').toLocaleString('en-IN', { month: 'short', year: '2-digit' });

  const recent = services.slice(0, 6);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4 md:space-y-6">
      {empty && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 px-5 py-4 text-sm text-amber-800 dark:text-amber-200">
          No data is visible. If you expect records here, make sure you are signed in and that the table policies allow signed-in users to read.
        </div>
      )}

      {/* Hero */}
      <section className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink text-white p-6 md:p-8 shadow-xl shadow-brand-700/20">
        <div className="ledger absolute inset-0 pointer-events-none" />
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-saffron-500/25 blur-3xl animate-float" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-india-500/20 blur-3xl animate-float" style={{ animationDelay: '-4s' }} />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-blue-100/90">
              <span>{today}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">{currentFY()}</span>
            </div>
            <h2 className="mt-2 font-display text-[26px] md:text-3xl font-bold leading-tight">{greeting()}, {FIRM.name.split(' &')[0]}</h2>
            <p className="mt-1 text-sm text-blue-100/80">{open.toLocaleString('en-IN')} service jobs are still open.</p>
          </div>

          <div className="md:text-right md:min-w-[280px]">
            <div className="text-[12px] uppercase tracking-[0.14em] text-blue-100/70">Outstanding to collect</div>
            <div className="mt-1 font-display text-4xl md:text-[44px] font-bold tabular-nums leading-none"><Count value={outstanding} format={compact} /></div>
            <div className="mt-4">
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="bar-fill h-full rounded-full bg-gradient-to-r from-saffron-500 to-amber-300" style={{ width: `${collectedPct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[12px] text-blue-100/80">
                <span>{collectedPct}% collected</span>
                <span>{compact(received)} of {compact(billed)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <div className="animate-rise grid grid-cols-3 gap-2 md:gap-3" style={{ animationDelay: '80ms' }}>
        {[
          { to: '/app/tables/service-status', icon: 'status', label: 'Services', tint: 'bg-emerald-500' },
          { to: '/app/tables/clients', icon: 'clients', label: 'Clients', tint: 'bg-indigo-500' },
          { to: '/app/tables/expense', icon: 'expense', label: 'Expenses', tint: 'bg-rose-500' },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="press flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2.5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200/70 dark:border-darkborder px-3 py-3 md:px-4 shadow-sm hover:shadow-md transition-shadow">
            <span className={`w-8 h-8 rounded-lg grid place-items-center text-white ${q.tint}`}><Icon name={q.icon} className="w-[17px] h-[17px]" /></span>
            <span className="text-[12px] md:text-sm font-medium text-slate-800 dark:text-slate-100">{q.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Clients" value={state.clients} format={(v) => Math.round(v).toLocaleString('en-IN')} hint="Total on record" icon="clients" delay={120} />
        <Stat label="Total billed" value={billed} format={compact} hint={`${services.length.toLocaleString('en-IN')} service entries`} icon="status" tone="green" delay={170} />
        <Stat label="Collected" value={received} format={compact} hint={`${collectedPct}% of billing`} icon="trend" tone="amber" delay={220} />
        <Stat label="Expenses" value={spent} format={compact} hint={`${expenses.length.toLocaleString('en-IN')} entries`} icon="expense" tone="rose" delay={270} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <Card title="Collections by month" delay={300}>
            {months.length === 0 ? (
              <p className="text-sm text-slate-500">No dated service entries yet.</p>
            ) : (
              <div className="flex items-end gap-2 sm:gap-4 h-56">
                {months.map(([k, v], i) => (
                  <div key={k} className="flex-1 flex flex-col items-center justify-end gap-2 h-full min-w-0">
                    <span className="text-[10px] sm:text-[11px] text-slate-500 tabular-nums truncate max-w-full">{compact(v)}</span>
                    <div className="bar-grow w-full max-w-[56px] rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-500" style={{ height: `${Math.max(6, (v / monthMax) * 150)}px`, animationDelay: `${350 + i * 90}ms` }} />
                    <span className="text-xs text-slate-500">{monthLabel(k)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="Top services by billing" delay={350}>
          {topTypes.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing billed yet.</p>
          ) : (
            <ul className="space-y-4">
              {topTypes.map(([name, v], i) => (
                <li key={name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200 truncate pr-3">{name}</span>
                    <span className="text-slate-500 tabular-nums">{compact(v)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div className="bar-fill h-full rounded-full bg-gradient-to-r from-saffron-500 to-brand-600" style={{ width: `${(v / topMax) * 100}%`, animationDelay: `${400 + i * 80}ms` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Recent service entries"
        delay={400}
        flush
        action={<Link to="/app/tables/service-status" className="text-sm font-medium text-brand-600 dark:text-brand-500">View all</Link>}
      >
        {recent.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No service entries yet.</p>
        ) : (
          <>
            {/* Mobile: list */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-darkborder">
              {recent.map((r) => {
                const bal = (r.fees || 0) - (r.received || 0);
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{clientName[r.client_id] || '-'}</div>
                      <div className="text-[12px] text-slate-500 truncate">{[typeName[r.service_type_id], fmtDate(r.date_of_service)].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-semibold tabular-nums text-slate-900 dark:text-white">{inr.format(r.fees || 0)}</div>
                      <div className={`text-[11px] tabular-nums ${bal > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{bal > 0 ? `Due ${inr.format(bal)}` : 'Paid'}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-darkbg">
                    <th className="px-5 py-3 font-semibold">Client</th>
                    <th className="px-5 py-3 font-semibold">Service</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold text-right">Fees</th>
                    <th className="px-5 py-3 font-semibold text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => {
                    const bal = (r.fees || 0) - (r.received || 0);
                    return (
                      <tr key={r.id} className="border-t border-slate-100 dark:border-darkborder/60 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-brand-50/40 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3 font-medium">{clientName[r.client_id] || '-'}</td>
                        <td className="px-5 py-3">{typeName[r.service_type_id] || '-'}</td>
                        <td className="px-5 py-3 tabular-nums">{fmtDate(r.date_of_service)}</td>
                        <td className="px-5 py-3 text-right tabular-nums">{inr.format(r.fees || 0)}</td>
                        <td className={`px-5 py-3 text-right tabular-nums font-medium ${bal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{inr.format(bal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
