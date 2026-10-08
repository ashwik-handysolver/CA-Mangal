import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SubTable({ title, itemLabel, initialData }) {


  const [items, setItems] = useState(initialData || []);
  const [newItem, setNewItem] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const rowsPerPage = 25;

  // Listen to header Add Row button
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingItem(null);
      setNewItem('');
      setIsAddModalOpen(true);
    };

    window.addEventListener('open-add-modal', handleOpenAdd);
    return () => window.removeEventListener('open-add-modal', handleOpenAdd);
  }, []);

  const handleSaveItem = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newItem.trim()) return;

    if (editingItem) {
      setItems(items.map(item => item.index === editingItem.index ? { ...item, name: newItem } : item));
      setEditingItem(null);
    } else {
      const maxIndex = items.length > 0 ? Math.max(...items.map(s => s.index)) : 0;
      const newEntry = { index: maxIndex + 1, name: newItem };
      setItems([newEntry, ...items].sort((a, b) => b.index - a.index));
    }
    setNewItem('');
    setIsAddModalOpen(false);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewItem(item.name);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setNewItem('');
  };

  const handleDelete = (indexToDelete) => {
    setItems(items.filter(item => item.index !== indexToDelete));
  };
  const filteredItems = items;

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + rowsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    
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

  return (
    <div className="flex flex-col mb-10">
      {/* Top Meta info above table */}
      <div className="flex items-center justify-between pb-3 px-1">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredItems.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + rowsPerPage, filteredItems.length)}</span> out of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredItems.length}</span>
        </span>
      </div>

      <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm border border-slate-200 dark:border-darkborder overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[calc(100vh-260px)] custom-scrollbar" data-lenis-prevent>
          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="sticky top-0 z-30 shadow-sm bg-white/95 dark:bg-darkcard/95 backdrop-blur-sm">
              <tr className="text-slate-500">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-darkborder/50 bg-white/95 dark:bg-darkcard/95 text-center w-24">Index</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-darkborder/50 bg-white/95 dark:bg-darkcard/95 text-center">{itemLabel}</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-darkborder/50 bg-white/95 dark:bg-darkcard/95 text-center w-32">Action</th>
              </tr>
            </thead>
            
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.index} className="bg-white dark:bg-darkcard border-b border-slate-100 dark:border-darkborder/40 hover:bg-slate-50/50 dark:hover:bg-darkbg/50 group">
                  <td className="px-6 py-4 text-[13px] text-slate-700 dark:text-slate-300 text-center font-semibold">
                    {item.index}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-700 dark:text-slate-300 text-center">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-700 dark:text-slate-300 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(item)} className="text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-1.5 rounded transition-colors" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(item.index)} className="text-slate-400 hover:text-red-600 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/40 p-1.5 rounded transition-colors" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {paginatedItems.map((item) => (
              <div key={item.index} className="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder shadow-sm p-5 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-4 right-4 z-10 flex items-center justify-end gap-3 transition-opacity">
                  <button onClick={() => openEditModal(item)} className="text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-2 rounded-lg transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(item.index)} className="text-slate-400 hover:text-red-600 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-darkborder/50 pb-2 pr-24">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Index</span>
                    <div className="text-right text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {item.index}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{itemLabel}</span>
                    <div className="text-right text-sm text-slate-800 dark:text-slate-200 font-medium max-w-[70%]">
                      {item.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {paginatedItems.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No items found.
              </div>
            )}
          </div>

        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkcard/50">
            <div className="flex items-center gap-1 text-center">
              {renderPageNumbers()}
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`bg-white dark:bg-darkcard w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-darkborder flex flex-col overflow-hidden ${editingItem ? 'animate-[slideFromRight_0.3s_ease-out]' : 'animate-[slideFromBottom_0.3s_ease-out]'}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkcard/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingItem ? 'Edit ' : 'Add New '}{(title.endsWith('us') ? title : title.replace(/s$/, ''))}</h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{itemLabel} <span className="text-red-400">*</span></label>
                <div className="flex items-center gap-2 bg-white dark:bg-darkbg border border-slate-300 dark:border-darkborder rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50">
                  <input 
                    type="text" 
                    placeholder={`Enter ${itemLabel}`}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveItem(e); }}
                    className="w-full min-w-0 text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkcard/50">
              <button onClick={closeModals} className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSaveItem} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Save {(title.endsWith('us') ? title : title.replace(/s$/, ''))}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







