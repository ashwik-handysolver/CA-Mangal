import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Lenis from 'lenis';

export default function Layout() {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    
    const lenis = new Lenis({
      wrapper: scrollRef.current,
      content: scrollRef.current.firstElementChild,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="bg-[#f8fafc] dark:bg-darkbg text-slate-900 dark:text-slate-100 flex h-screen overflow-hidden antialiased">
      
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="pt-4 px-4 pb-0 z-20 shrink-0">
          <div className="w-full max-w-[1500px] mx-auto">
            <Header />
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-24 md:pb-12 pt-6 custom-scrollbar">
          <div className="w-full max-w-[1500px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}









