import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const routeTitleMap = {
  '/app/dashboard': 'Dashboard',
  '/app/tables/service-status': 'Service Status',
  '/app/tables/clients': 'Clients',
  '/app/tables/expense': 'Expense',
  '/app/tables/financial-years': 'Financial Years',
  '/app/tables/service-types': 'Service Types',
  '/app/tables/mode-of-payment': 'Mode Of Payment',
  '/app/tables/tags': 'Tags',
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Compute title dynamically from path
  const currentTitle = routeTitleMap[location.pathname] || (() => {
    if (location.pathname.startsWith('/app/tables/')) {
      const slug = location.pathname.replace('/app/tables/', '');
      return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return 'Dashboard';
  })();

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <header className="h-16 w-full rounded-2xl border border-slate-200/90 dark:border-darkborder bg-white/90 dark:bg-darkcard/90 backdrop-blur-md flex items-center justify-between px-6 shadow-sm transition-all duration-300">
      {/* Page Title at Start of Header */}
      <div className="flex items-center gap-3">

        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {currentTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Add Row Button - circular icon button, only visible on tables pages */}
        {location.pathname.startsWith('/app/tables/') && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-add-modal'))}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            title="Add Row"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {/* Notification Bell */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </button>
        
        {/* Dark Mode */}
        <button onClick={toggleDarkMode} className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors" title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
          {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
        </button>
        
        {/* Settings / Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            onBlur={() => setTimeout(() => setIsSettingsMenuOpen(false), 200)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          
          {isSettingsMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-darkcard rounded-xl shadow-lg border border-slate-200 dark:border-darkborder py-1 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
              <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

