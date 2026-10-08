import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tablesExpanded, setTablesExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-menu', handleToggle);
    return () => window.removeEventListener('toggle-mobile-menu', handleToggle);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false); // Close on navigation
  }, [location.pathname]);


  useEffect(() => {
    // Check system preference / local storage on load
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    
    // Auto-expand tables dropdown if we are currently on a table route
    if (location.pathname.includes('/app/tables/')) {
      setTablesExpanded(true);
    }
  }, [location.pathname]);



  const tables = [
    
    
    { name: 'Expense', path: '/app/tables/expense' },
    { name: 'Financial Years', path: '/app/tables/financial-years' },
    { name: 'Service Types', path: '/app/tables/service-types' },
    { name: 'Mode Of Payment', path: '/app/tables/mode-of-payment' },
    { name: 'Tags', path: '/app/tables/tags' }
  ];

return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen py-4 pl-4 z-30 transition-layout duration-300 relative">
        <aside className={`h-full ${isCollapsed ? 'w-20' : 'w-60'} border border-slate-200 dark:border-darkborder bg-white/90 dark:bg-darkcard/90 backdrop-blur-md flex flex-col justify-between shadow-xl rounded-2xl relative transition-layout duration-300 ease-in-out`}>
          
          {/* Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden md:flex absolute -right-3.5 top-8 w-7 h-7 rounded-full bg-white dark:bg-darkbg border border-slate-200 dark:border-darkborder shadow-sm hover:shadow-md hover:scale-105 items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 z-50 group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3.5'} border-b border-slate-100 dark:border-darkborder shrink-0 transition-layout duration-300`}>
              {isCollapsed ? (
                <div className="w-12 h-12 bg-white dark:bg-slate-900/90 dark:border-slate-800 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/logo.png" alt="CA Mangal & Co" className="w-[44px] h-[44px] object-cover object-left max-w-none scale-[1.0] translate-x-1.6 dark:brightness-[0.92] dark:contrast-[1.05]" />
                  </div>
              ) : (
                <div className="w-full flex items-center justify-center py-2 px-3 bg-white/95 dark:bg-slate-900/80 dark:border-slate-800/90 rounded-xl shadow-sm border border-slate-200/80 transition-all">
                  <img src="/logo.png" alt="CA Mangal & Co" className="h-11 w-full object-contain rounded dark:brightness-[0.92] dark:contrast-[1.05]" />
                </div>
              )}
            </div>

            <nav className={`p-4 space-y-1.5 mt-2 flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? 'px-2' : ''}`}>
              <div>
                <button 
                  onClick={() => navigate('/app/dashboard')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/app/dashboard' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-darkborder/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    {!isCollapsed && <span>Dashboard</span>}
                  </div>
                </button>
              </div>

              <div>
                <button 
                  onClick={() => navigate('/app/tables/service-status')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/app/tables/service-status' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-darkborder/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    {!isCollapsed && <span>Service Status</span>}
                  </div>
                </button>
              </div>

              <div>
                <button 
                  onClick={() => navigate('/app/tables/clients')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/app/tables/clients' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-darkborder/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 opacity-80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    {!isCollapsed && <span>Clients</span>}
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    if (isCollapsed) setIsCollapsed(false);
                    setTablesExpanded(!tablesExpanded);
                  }} 
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors transition-colors group ${location.pathname.includes('/app/tables/') && location.pathname !== '/app/tables/clients' && location.pathname !== '/app/tables/service-status' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-darkborder/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z"></path></svg>
                    {!isCollapsed && <span>Tables</span>}
                  </div>
                  {!isCollapsed && <svg className={`w-3.5 h-3.5 transition-all duration-200 ${tablesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>}
                </button>
                
                {!isCollapsed && (
                  <div className={`overflow-hidden transition-layout duration-300 ease-in-out ml-9 mt-1 space-y-0.5 ${tablesExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {tables.map((table) => (
                      <button 
                        key={table.name}
                        onClick={() => navigate(table.path)}
                        className={`block w-full text-left px-3 py-2 text-xs font-medium transition-colors rounded-md transition-colors transition-colors ${location.pathname === table.path ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-darkborder/30'}`}
                      >
                        {table.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[40] bg-white/95 dark:bg-darkcard/95 backdrop-blur-lg border-t border-slate-200 dark:border-darkborder pb-safe pt-1">
        <div className="flex items-center justify-between px-2 py-1">
          
          <button onClick={() => { setIsMobileOpen(false); setIsMoreOpen(false); navigate('/app/dashboard'); }} className={`flex flex-col items-center gap-1 p-2 flex-1 ${location.pathname === '/app/dashboard' && !isMobileOpen && !isMoreOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span className="text-[10px] font-medium tracking-tight">Dashboard</span>
          </button>
          
          <button onClick={() => { setIsMobileOpen(false); setIsMoreOpen(false); navigate('/app/tables/clients'); }} className={`flex flex-col items-center gap-1 p-2 flex-1 ${location.pathname === '/app/tables/clients' && !isMobileOpen && !isMoreOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-[10px] font-medium tracking-tight">Clients</span>
          </button>

          <button onClick={() => { setIsMobileOpen(false); setIsMoreOpen(false); navigate('/app/tables/service-status'); }} className={`flex flex-col items-center gap-1 p-2 flex-1 ${location.pathname === '/app/tables/service-status' && !isMobileOpen && !isMoreOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <span className="text-[10px] font-medium tracking-tight">Status</span>
          </button>

          <button onClick={() => { setIsMobileOpen(!isMobileOpen); setIsMoreOpen(false); }} className={`flex flex-col items-center gap-1 p-2 flex-1 ${isMobileOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            <span className="text-[10px] font-medium tracking-tight">Tables</span>
          </button>

          <button onClick={() => { setIsMoreOpen(!isMoreOpen); setIsMobileOpen(false); }} className={`flex flex-col items-center gap-1 p-2 flex-1 ${isMoreOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
            <span className="text-[10px] font-medium tracking-tight">More</span>
          </button>

        </div>
      </div>

      {/* Tables Bottom Sheet */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)}></div>
          <div className="w-full bg-white dark:bg-darkcard rounded-t-2xl z-[60] animate-[slideFromBottom_0.3s_ease-out] border-t border-slate-200 dark:border-darkborder shadow-2xl flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-darkborder/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">All Tables</h3>
              <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 custom-scrollbar mb-20">
              <div className="flex flex-col gap-2">
                {tables.map(t => (
                  <button 
                    key={t.name}
                    onClick={() => { setIsMobileOpen(false); navigate(t.path); }}
                    className={`w-full text-left px-5 py-3.5 rounded-xl text-base font-medium transition-colors ${location.pathname === t.path ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darkbg'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* More Bottom Sheet (Settings / etc) */}
      {/* {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMoreOpen(false)}></div>
          <div className="w-full bg-white dark:bg-darkcard rounded-t-2xl z-[60] animate-[slideFromBottom_0.3s_ease-out] border-t border-slate-200 dark:border-darkborder shadow-2xl flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-darkborder/60">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">More Settings</h3>
              <button onClick={() => setIsMoreOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 custom-scrollbar mb-20">
              <div className="flex flex-col gap-3">
                 <button onClick={() => {
                    if (document.documentElement.classList.contains('dark')) {
                      document.documentElement.classList.remove('dark');
                      localStorage.theme = 'light';
                    } else {
                      document.documentElement.classList.add('dark');
                      localStorage.theme = 'dark';
                    }
                    setIsMoreOpen(false);
                 }} className="flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darkbg">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                   Toggle Dark Mode
                 </button>
                 <button onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem('currentUser'); navigate('/login'); }} className="flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darkbg text-red-500 hover:text-red-600">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                   Log Out
                 </button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
