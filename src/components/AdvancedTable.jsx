import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from './CustomDropdown';

export default function AdvancedTable({ title, columns, initialData, showToolbar }) {


  const [data, setData] = useState(initialData || []);
  const [newRow, setNewRow] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const rowsPerPage = 25;

  // Listen to header Add Row button
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingRow(null);
      setNewRow({});
      setIsAddModalOpen(true);
    };

    window.addEventListener('open-add-modal', handleOpenAdd);
    

  return () => window.removeEventListener('open-add-modal', handleOpenAdd);
  }, []);

  const handleModalChange = (key, value) => {
    if (editingRow) {
      setEditingRow({ ...editingRow, [key]: value });
    } else {
      setNewRow({ ...newRow, [key]: value });
    }
  };

  const handleSaveRow = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (editingRow) {
      setData(data.map(row => row.id === editingRow.id ? editingRow : row));
      setEditingRow(null);
    } else {
      const hasAnyValue = Object.values((editingRow || newRow)).some(val => val && String(val).trim() !== '');
      if (!hasAnyValue) return;
  
      const maxIndex = data.length > 0 ? Math.max(...data.map(d => parseInt(d.index) || 0)) : 0;
      const added = { ...newRow, index: maxIndex + 1, id: Date.now() };
  
      columns.forEach(col => {
        if (col.autoGenerate) {
          added[col.key] = col.autoGenerate(data, (editingRow || newRow));
        }
      });
  
      setData([added, ...data]);
      setNewRow({});
      setIsAddModalOpen(false);
    }
  };

  const handleDelete = (id) => {
    setData(data.filter(row => row.id !== id));
  };
  const filteredData = data;

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${currentPage === i ? 'bg-slate-700 dark:bg-blue-600 text-white shadow-sm border-transparent' : 'bg-white dark:bg-darkcard border border-slate-300 dark:border-darkborder text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkborder'}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const renderCellContent = (col, row, cellValue) => {
    if (col.type === 'action') {
      return (
        <div className="flex items-center justify-end gap-3 transition-opacity">
          <button onClick={() => setEditingRow(row)} className="text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-2 rounded-lg transition-colors" title="Edit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-slate-400 hover:text-red-600 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors" title="Delete">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      );
    }
    if (col.type === 'date') return <span className="font-medium">{cellValue}</span>;
    if (col.type === 'toggle') return (
      <button type="button" className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none ${cellValue ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${cellValue ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    );
    if (col.type === 'textarea') return (
      <div className="relative flex items-center justify-center group/tooltip">
        <button className="text-slate-400 hover:text-blue-500 cursor-help transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </button>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[250px] z-[60] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-150 scale-95 group-hover/tooltip:scale-100 pointer-events-none text-left">
          <div className="bg-slate-800 dark:bg-slate-700 text-white text-[11.5px] rounded-lg py-2.5 px-3.5 shadow-xl border border-slate-700 dark:border-slate-600">
            <div className="font-bold text-slate-300 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {col.label}
            </div>
            <div className="text-slate-100 leading-relaxed whitespace-pre-wrap break-words">{cellValue || 'No remarks provided.'}</div>
          </div>
        </div>
      </div>
    );
    if (col.type === 'user') return (
      <div className="flex items-center justify-center gap-2">
        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
          {String(cellValue || '?').charAt(0)}
        </div>
        <span>{cellValue}</span>
      </div>
    );
    if (col.type === 'currency') return (
      <span className="font-mono text-slate-800 dark:text-slate-200">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(cellValue || 0)}
      </span>
    );
    return <span className="font-medium">{cellValue}</span>;
  };

  return (
    <div className="flex flex-col">
      

      <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm border border-slate-200 dark:border-darkborder overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[calc(100vh-160px)] md:max-h-[calc(100vh-220px)] custom-scrollbar" data-lenis-prevent>
          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="sticky top-0 z-30 shadow-sm bg-white/95 dark:bg-darkcard/95 backdrop-blur-sm">
              <tr className="text-slate-500">
                {columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-darkborder/50 bg-white/95 dark:bg-darkcard/95">
                    <div className="flex items-center justify-center gap-1 text-center">
                      {col.required && <span className="text-red-400">*</span>}
                      {col.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {paginatedData.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-darkcard border-b border-slate-100 dark:border-darkborder/40 hover:bg-slate-50/50 dark:hover:bg-darkbg/50 group">
                  {columns.map((col, idx) => {
                    const cellValue = col.computed ? col.computed(row) : row[col.key];
                    return (
                    <td key={`cell-${row.id}-${idx}`} className="px-6 py-4 text-[13px] text-slate-700 dark:text-slate-300 text-center">
                      {col.type === 'action' ? (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                           {renderCellContent(col, row, cellValue)}
                        </div>
                      ) : renderCellContent(col, row, cellValue)}
                    </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {paginatedData.map((row) => (
              <div key={row.id} className="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder shadow-sm p-5 flex flex-col gap-4 relative overflow-hidden">
                {/* Find action column if it exists */}
                {columns.find(c => c.type === 'action') && (
                  <div className="absolute top-4 right-4 z-10">
                    {renderCellContent(columns.find(c => c.type === 'action'), row, null)}
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  {columns.filter(c => c.type !== 'action').map((col, idx) => {
                    const cellValue = col.computed ? col.computed(row) : row[col.key];
                    return (
                      <div key={idx} className={`flex justify-between items-center border-b border-slate-100 dark:border-darkborder/50 pb-2 last:border-0 last:pb-0 ${idx === 0 ? 'pr-24' : ''}`}>
                        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{col.label}</span>
                        <div className="text-right text-sm text-slate-800 dark:text-slate-200 font-medium max-w-[60%]">
                          {renderCellContent(col, row, cellValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {paginatedData.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No records found.
              </div>
            )}
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkcard/50">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + rowsPerPage, filteredData.length)}</span> out of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredData.length}</span>
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-center">
                {renderPageNumbers()}
              </div>
            )}
          </div>
      </div>

      {/* Add Modal */}
      {(isAddModalOpen || editingRow) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`bg-white dark:bg-darkcard w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-darkborder flex flex-col overflow-hidden ${editingRow ? 'animate-[slideFromRight_0.3s_ease-out]' : 'animate-[slideFromBottom_0.3s_ease-out]'}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkcard/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingRow ? 'Edit ' : 'Add New '}{(title.endsWith('us') ? title : title.replace(/s$/, ''))}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setEditingRow(null); setNewRow({}); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] grid grid-cols-2 gap-4" data-lenis-prevent="true">
              {columns.map(col => {
                if (col.type === 'action') return null;
                return (
                  <div key={col.key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{col.label} {col.required && <span className="text-red-400">*</span>}</label>
                    <div className="flex items-center gap-2 bg-white dark:bg-darkbg border border-slate-300 dark:border-darkborder rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50">
                      {col.computed || col.autoGenerate ? (
                        <div className="w-full text-sm text-slate-500 font-medium px-1 bg-slate-50 dark:bg-darkcard/50 py-1 rounded">
                          {col.type === 'currency' 
                            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(col.computed ? col.computed((editingRow || newRow)) : col.autoGenerate(data, (editingRow || newRow)) || 0)
                            : (col.computed ? col.computed((editingRow || newRow)) : col.autoGenerate(data, (editingRow || newRow)))}
                        </div>
                      ) : col.type === 'select' || col.type === 'user' ? (
                        <CustomDropdown 
                          placeholder={`Select ${col.label}`}
                          allowAll={false}
                          value={(editingRow ? editingRow[col.key] : newRow[col.key]) || ''}
                          options={col.options || []}
                          onChange={(val) => handleModalChange(col.key, val)}
                        />
                      ) : col.type === 'toggle' ? (
                        <button
                          type="button"
                          onClick={() => handleModalChange(col.key, !(editingRow ? editingRow[col.key] : newRow[col.key]))}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${(editingRow ? editingRow[col.key] : newRow[col.key]) ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(editingRow ? editingRow[col.key] : newRow[col.key]) ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      ) : col.type === 'textarea' ? (
                        <textarea 
                          rows="2"
                          placeholder={`Enter ${col.label}...`}
                          value={(editingRow ? editingRow[col.key] : newRow[col.key]) || ''}
                          onChange={(e) => handleModalChange(col.key, e.target.value)}
                          className="w-full min-w-0 text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none"
                        />
                      ) : (
                        <input 
                          type={col.type === 'date' ? 'date' : col.type === 'currency' ? 'number' : 'text'} 
                          placeholder={col.type === 'date' ? '' : `Enter ${col.label}`}
                          value={(editingRow ? editingRow[col.key] : newRow[col.key]) || ''}
                          onChange={(e) => handleModalChange(col.key, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddRow(e); }}
                          className="w-full min-w-0 text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkcard/50">
              <button onClick={() => { setIsAddModalOpen(false); setEditingRow(null); setNewRow({}); }} className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSaveRow} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Save {(title.endsWith('us') ? title : title.replace(/s$/, ''))}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );


















}























