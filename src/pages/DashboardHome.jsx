import React from 'react';

export default function DashboardHome() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back. Here is your overview.</p>
      </div>

      {/* Bento Box Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-darkcard rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-darkborder hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Clients</span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">+12%</span>
          </div>
          <div className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">1,245</div>
          <div className="mt-4 h-12 w-full flex items-end gap-1.5">
            <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-t h-4"></div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-t h-6"></div>
            <div className="w-full bg-blue-300 dark:bg-blue-800/80 rounded-t h-3"></div>
            <div className="w-full bg-blue-400 dark:bg-blue-700 rounded-t h-8"></div>
            <div className="w-full bg-blue-500 rounded-t h-12"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-darkcard rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-darkborder hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Filings</span>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">-3%</span>
          </div>
          <div className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">84</div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Most filings are progressing normally. 12 approaching deadline next week.</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-950 dark:to-slate-900 rounded-2xl p-6 shadow-md border border-slate-800 dark:border-indigo-900/50 text-white flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div>
            <span className="text-sm font-medium text-slate-400">Monthly Revenue</span>
            <div className="mt-4 text-3xl font-extrabold tracking-tight">$42,500</div>
          </div>
          <button className="mt-4 w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-semibold text-white">View Report</button>
        </div>
      </div>
    </div>
  );
}
