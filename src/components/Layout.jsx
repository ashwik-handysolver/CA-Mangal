import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FeedbackHost from './FeedbackHost';
import { NAV_ITEMS } from './nav';

export default function Layout() {
  const { pathname } = useLocation();
  const scrollRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const current = NAV_ITEMS.find((i) => i.path === pathname) || NAV_ITEMS[0];

  // New page -> start at the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="relative bg-canvas dark:bg-darkbg text-slate-900 dark:text-slate-100 flex h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_32rem_at_100%_0%,rgba(240,138,36,0.13),transparent),radial-gradient(44rem_34rem_at_0%_100%,rgba(31,74,158,0.13),transparent),radial-gradient(34rem_26rem_at_60%_55%,rgba(19,136,8,0.06),transparent)] dark:opacity-40" />
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        <Header scrolled={scrolled} />
        <div
          ref={scrollRef}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}
          className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 pt-2 md:pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-10"
        >
          <div className="w-full max-w-[1500px] mx-auto">
            {/* iOS-style large title (mobile only) */}
            <div className="md:hidden mb-4 px-1">
              <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight text-slate-900 dark:text-white">{current.name}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{current.subtitle}</p>
            </div>
            <div key={pathname} className="animate-rise">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <FeedbackHost />
    </div>
  );
}
