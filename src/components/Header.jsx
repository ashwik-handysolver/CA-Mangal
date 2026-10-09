import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toggleTheme, isDark } from '../lib/theme';
import Icon from './Icon';
import { NAV_ITEMS } from './nav';

export default function Header({ scrolled, email }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(isDark);

  const current = NAV_ITEMS.find((i) => i.path === location.pathname) || NAV_ITEMS[0];
  const isTable = location.pathname.startsWith('/app/tables/');
  const openAdd = () => window.dispatchEvent(new CustomEvent('open-add-modal'));

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile: compact nav bar; the title fades in once the large title scrolls away */}
      <header className={`md:hidden glass pt-safe z-20 shrink-0 border-b transition-colors duration-200 ${scrolled ? 'border-slate-200/80 dark:border-darkborder' : 'border-transparent'}`}>
        <div className="h-[52px] grid grid-cols-[1fr_auto_1fr] items-center px-4">
          <div />
          <span className={`font-display text-[17px] font-semibold text-slate-900 dark:text-white transition-all duration-200 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>{current.name}</span>
          <div className="flex justify-end">
            {isTable && (
              <button onClick={openAdd} className="press w-9 h-9 rounded-full bg-brand-600 text-white grid place-items-center shadow-md shadow-brand-600/30" aria-label="Add new">
                <Icon name="plus" className="w-5 h-5" strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop */}
      <header className="hidden md:block shrink-0 glass border-b border-slate-200/80 dark:border-darkborder z-20">
        <div className="h-[3px] bg-gradient-to-r from-saffron-500 via-brand-600 to-india-500" />
        <div className="h-[66px] flex items-center justify-between gap-4 px-8">
        <div className="min-w-0 flex items-center gap-3.5">
          <span className={`w-11 h-11 rounded-2xl grid place-items-center text-white shadow-lg ${current.tint}`}>
            <Icon name={current.icon} className="w-[22px] h-[22px]" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[22px] font-bold tracking-tight text-slate-900 dark:text-white truncate leading-tight">{current.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{current.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTable && (
            <button onClick={openAdd} title="Add new" aria-label="Add new" className="press mr-2 w-11 h-11 grid place-items-center rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 text-white shadow-lg shadow-saffron-500/40 hover:scale-105 transition-transform">
              <Icon name="plus" className="w-5 h-5" strokeWidth={2.6} />
            </button>
          )}

          <button onClick={() => setDark(toggleTheme())} className="press w-10 h-10 grid place-items-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5" title={dark ? 'Light mode' : 'Dark mode'}>
            <Icon name={dark ? 'sun' : 'moon'} className="w-[19px] h-[19px]" />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="press w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white grid place-items-center text-sm font-semibold uppercase ring-2 ring-white dark:ring-darkcard shadow"
            >
              {email.charAt(0) || '?'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard shadow-xl py-1.5 z-50 animate-pop origin-top-right">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-darkborder">
                  <div className="text-[11px] text-slate-400">Signed in as</div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{email || 'Unknown'}</div>
                </div>
                <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <Icon name="logout" className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
