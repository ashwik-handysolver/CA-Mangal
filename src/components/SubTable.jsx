import React, { useState } from 'react';

export default function SubTable({ title, itemLabel, initialData }) {
  const [items, setItems] = useState(initialData || []);
  const [newItem, setNewItem] = useState('');
  const [filter, setFilter] = useState('');

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    const maxIndex = items.length > 0 ? Math.max(...items.map(s => s.index)) : 0;
    const newEntry = { index: maxIndex + 1, name: newItem };
    
    setItems([newEntry, ...items].sort((a, b) => b.index - a.index));
    setNewItem('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2">
      {/* Page Title */}
      <div className="px-6 py-5 border-b border-slate-100 bg-white">
        <h2 className="text-2xl font-extrabold text-orange-500 tracking-tight">{title}</h2>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[80px_1fr] bg-red-400 text-white font-bold px-6 py-3.5 shadow-sm relative z-10">
        <div>Index</div>
        <div>{itemLabel}</div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-[80px_1fr] items-center px-6 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-center w-8">
          <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <input 
            type="text" 
            placeholder={itemLabel} 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-slate-400 text-slate-700 outline-none"
          />
        </div>
      </div>

      {/* Add Row */}
      <form onSubmit={handleAddItem} className="grid grid-cols-[80px_1fr] items-center px-6 py-3 border-b border-orange-200 bg-orange-50/50 backdrop-blur-sm">
        <div className="flex items-center">
          <button type="submit" className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 shadow-sm transition-transform hover:scale-105 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <div>
          <input 
            type="text" 
            placeholder={`Add ${itemLabel}`} 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-slate-400 text-slate-700 outline-none"
          />
        </div>
      </form>

      {/* Data Rows */}
      <div className="divide-y divide-slate-100 bg-white">
        {filteredItems.map(item => (
          <div key={item.index} className="grid grid-cols-[80px_1fr] px-6 py-4 hover:bg-slate-50 transition-colors">
            <div className="font-semibold text-slate-500">{item.index}</div>
            <div className="font-semibold text-slate-800">{item.name}</div>
          </div>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 font-medium">No items found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
