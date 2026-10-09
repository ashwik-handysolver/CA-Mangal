import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toggleTheme, isDark, currentEmail } from '../lib/theme';
import Icon from './Icon';
import Sheet from './Sheet';
import { NAV_GROUPS, TAB_ITEMS, MASTER_ITEMS, FIRM } from './nav';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

function TintIcon({ item }) {
  return (
    <span className={`w-8 h-8 rounded-lg grid place-items-center text-white ${item.tint}`}>
      <Icon name={item.icon} className="w-[18px] h-[18px]" />
    </span>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [dark, setDark] = useState(isDark);
  const email = currentEmail();

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `group press relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${
      isActive ? 'bg-gradient-to-r from-white/15 to-white/5 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
    }`;

  return (
    <>
      {/* ---------- Desktop sidebar ---------- */}
      <aside className={`hidden md:flex shrink-0 flex-col relative bg-ink border-r border-white/5 transition-[width] duration-300 ${collapsed ? 'w-[76px]' : 'w-[268px]'}`}>
        <div className="ledger absolute inset-0 pointer-events-none" />
        <div className={`relative flex items-center border-b border-white/10 ${collapsed ? 'h-[68px] justify-center' : 'px-4 py-4'}`}>
          {collapsed ? (
            <img src="/icons/icon-192.png" alt={FIRM.name} className="w-10 h-10 rounded-xl" />
          ) : (
            <div className="w-full rounded-xl bg-white px-3 py-2 shadow-lg">
              <img src="/logo.png" alt={`${FIRM.name}, ${FIRM.tagline}`} className="w-full h-11 object-contain" />
            </div>
          )}
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && <div className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</div>}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.path} to={item.path} className={linkClass} title={collapsed ? item.name : undefined}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-saffron-500" />}
                        <span className={`w-8 h-8 rounded-lg grid place-items-center text-white shrink-0 shadow-sm transition-opacity ${item.tint} ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                          <Icon name={item.icon} className="w-[17px] h-[17px]" />
                        </span>
                        {!collapsed && <span>{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="relative mx-4 mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
            <div className="text-[11px] font-medium text-saffron-500">{FIRM.motto}</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="press relative mx-3 mb-3 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white">
          <Icon name="chevronLeft" className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && 'Collapse'}
        </button>
      </aside>

      {/* ---------- Mobile: iOS tab bar ---------- */}
      <nav className="md:hidden glass fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 dark:border-darkborder pb-safe">
        <div className="grid grid-cols-5 px-1 pt-1.5 pb-1">
          {TAB_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} className="press flex flex-col items-center gap-0.5 py-1 min-w-0">
              {({ isActive }) => (
                <>
                  <span key={isActive ? 'on' : 'off'} className={`grid place-items-center h-7 ${isActive ? 'text-brand-600 dark:text-brand-500 tab-pop' : 'text-slate-400'}`}>
                    <Icon name={item.icon} className="w-[25px] h-[25px]" strokeWidth={isActive ? 2.2 : 1.7} />
                  </span>
                  <span className={`text-[10px] font-medium truncate ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-slate-400'}`}>{item.short}</span>
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMoreOpen(true)} className="press flex flex-col items-center gap-0.5 py-1">
            <span className="grid place-items-center h-7 text-slate-400"><Icon name="menu" className="w-[25px] h-[25px]" strokeWidth={1.7} /></span>
            <span className="text-[10px] font-medium text-slate-400">More</span>
          </button>
        </div>
      </nav>

      {/* ---------- Mobile: More sheet (iOS Settings style) ---------- */}
      {moreOpen && (
        <Sheet onClose={() => setMoreOpen(false)} title="More">
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-darkbg p-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white grid place-items-center text-lg font-semibold uppercase">{email.charAt(0) || '?'}</div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{email || 'Signed in'}</div>
                <div className="text-xs text-slate-500">{FIRM.name}</div>
              </div>
            </div>

            <div>
              <div className="px-4 mb-1.5 text-[12px] uppercase tracking-wide text-slate-500">Masters</div>
              <div className="rounded-2xl bg-white dark:bg-darkbg overflow-hidden">
                {MASTER_ITEMS.map((item, i) => (
                  <button
                    key={item.path}
                    onClick={() => { setMoreOpen(false); navigate(item.path); }}
                    className="w-full flex items-center gap-3 pl-4 text-left active:bg-slate-100 dark:active:bg-white/5"
                  >
                    <TintIcon item={item} />
                    <span className={`flex-1 flex items-center justify-between py-3 pr-4 text-[16px] text-slate-900 dark:text-slate-100 ${i < MASTER_ITEMS.length - 1 ? 'border-b border-slate-200 dark:border-darkborder' : ''}`}>
                      {item.name}
                      <Icon name="chevronLeft" className="w-4 h-4 rotate-180 text-slate-300" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-darkbg overflow-hidden">
              <button onClick={() => setDark(toggleTheme())} className="w-full flex items-center gap-3 pl-4 text-left active:bg-slate-100 dark:active:bg-white/5">
                <span className="w-8 h-8 rounded-lg grid place-items-center text-white bg-slate-700"><Icon name={dark ? 'sun' : 'moon'} className="w-[18px] h-[18px]" /></span>
                <span className="flex-1 flex items-center justify-between py-3 pr-4 text-[16px] text-slate-900 dark:text-slate-100">
                  Dark mode
                  <span className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors ${dark ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </span>
                </span>
              </button>
            </div>

            {isIOS() && !isStandalone() && (
              <div className="rounded-2xl bg-white dark:bg-darkbg p-4 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-white mb-1">Install on your iPhone</div>
                Tap the Share button in Safari, then <b>Add to Home Screen</b>. The app will open full screen like a native app.
              </div>
            )}

            <div className="rounded-2xl bg-white dark:bg-darkbg overflow-hidden">
              <button onClick={logout} className="w-full py-3.5 text-center text-[16px] font-medium text-red-600 active:bg-slate-100 dark:active:bg-white/5">Log out</button>
            </div>
          </div>
        </Sheet>
      )}
    </>
  );
}
