import React, { useState } from 'react';

export default function AdvancedTable({ title, columns, initialData, showToolbar, paginationText }) {
  const [data, setData] = useState(initialData || []);
  const [filters, setFilters] = useState({});
  const [newRow, setNewRow] = useState({});

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleNewRowChange = (key, value) => {
    setNewRow({ ...newRow, [key]: value });
  };

  const handleAddRow = (e) => {
    e.preventDefault();
    const maxIndex = data.length > 0 ? Math.max(...data.map(d => parseInt(d.index) || 0)) : 0;
    const added = { ...newRow, index: maxIndex + 1, id: Date.now() };
    setData([added, ...data]);
    setNewRow({});
  };

  const handleDelete = (id) => {
    setData(data.filter(row => row.id !== id));
  };

  return (
    <div className="flex flex-col mb-12">
      {/* Title Pill */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 px-6 py-4 inline-block mb-4 w-full">
        <h2 className="text-xl font-bold text-orange-500">{title}</h2>
      </div>

      {/* Toolbar & Pagination */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-4">
          {showToolbar && (
            <div className="flex items-center gap-3 text-orange-500">
              <button className="hover:bg-orange-50 p-1 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
              <button className="hover:bg-orange-50 p-1 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></button>
              <button className="hover:bg-orange-50 p-1 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg></button>
              <button className="hover:bg-orange-50 p-1 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
              <button className="hover:bg-orange-50 p-1 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
            </div>
          )}
        </div>
        <div className="text-sm font-semibold text-slate-500 w-full text-right">
          {paginationText || `Showing 1-${data.length} of ${data.length} record(s)`}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          
          {/* Header Row */}
          <thead>
            <tr className="bg-[#fe6a6a] text-white">
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 text-[13px] font-bold border-b border-red-500 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {col.required && <span className="text-red-900">*</span>}
                    {col.label}
                    {col.sortable && (
                      <div className="flex flex-col ml-1 bg-white/20 rounded px-0.5">
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16z"/></svg>
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4z"/></svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Filter Row */}
            <tr className="border-b border-slate-200 bg-white">
              {columns.map((col, idx) => (
                <td key={`filter-${idx}`} className="px-4 py-2 border-r border-slate-100 last:border-0">
                  {idx === 0 ? (
                    <svg className="w-5 h-5 text-slate-400 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                  ) : col.key === 'delete' ? null : (
                    <div className="flex items-center gap-2">
                      {col.type === 'date' && <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                      <input 
                        type="text" 
                        placeholder={col.type === 'date' ? 'DD/MM/YYYY' : `${col.type === 'select' ? '▼' : ''} ${col.label}`}
                        className="w-full text-[13px] bg-transparent border-none focus:ring-0 p-0 text-slate-600 placeholder-slate-400 outline-none"
                        onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      />
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Add Row */}
            <tr className="border-b border-orange-200 bg-orange-50/30">
              <form onSubmit={handleAddRow} className="contents">
                {columns.map((col, idx) => (
                  <td key={`add-${idx}`} className="px-4 py-2 border-r border-slate-100 last:border-0">
                    {idx === 0 ? (
                       <button type="submit" className="w-7 h-7 mx-auto rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 shadow-sm">
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                       </button>
                    ) : col.key === 'delete' ? null : (
                      <div className="flex items-center gap-2">
                        {col.type === 'date' && <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        <input 
                          type="text" 
                          placeholder={col.type === 'date' ? 'DD/MM/YYYY' : `Add ${col.label}`}
                          value={newRow[col.key] || ''}
                          onChange={(e) => handleNewRowChange(col.key, e.target.value)}
                          className="w-full text-[13px] bg-transparent border-none focus:ring-0 p-0 text-slate-600 placeholder-slate-400 outline-none"
                        />
                      </div>
                    )}
                  </td>
                ))}
                {/* Hidden submit to allow enter key */}
                <button type="submit" className="hidden"></button>
              </form>
            </tr>

            {/* Data Rows */}
            {data.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                {columns.map((col, idx) => (
                  <td key={`cell-${row.id}-${idx}`} className="px-4 py-3 text-[13px] font-medium text-slate-700 border-r border-slate-50 last:border-0">
                    {col.key === 'delete' ? (
                      <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 mx-auto block">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    ) : col.type === 'date' ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>{row[col.key]}</span>
                      </div>
                    ) : col.type === 'select' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[10px]">▼</span>
                        <span>{row[col.key]}</span>
                      </div>
                    ) : (
                      <span>{row[col.key]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  No records found.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}
