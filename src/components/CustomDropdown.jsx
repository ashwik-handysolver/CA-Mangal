import React, { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({ options, value, onChange, placeholder, allowAll = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const ref = useRef(null);

  // Sync internal search term with external value prop
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTyping = searchTerm !== (value || '');
  const filteredOptions = isTyping
    ? options.filter(opt => String(opt).toLowerCase().includes(String(searchTerm).toLowerCase()))
    : options;

  const formatOption = (opt) => {
    if (opt === 'New Client') return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold inline-block">New Client</span>;
    if (opt === 'Old Client') return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold inline-block">Old Client</span>;
    return String(opt);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div className="w-full bg-transparent border-none p-0 flex justify-between items-center group cursor-pointer" onClick={() => setIsOpen(true)}>
        <input 
          type="text"
          className="w-full min-w-0 bg-transparent border-none focus:ring-0 p-0 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none cursor-pointer transition-colors focus:cursor-text"
          placeholder={placeholder}
          value={searchTerm}
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
        />
        <svg 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`cursor-pointer transition-colors w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-all duration-300 ease-out flex-shrink-0 ${isOpen ? 'rotate-180' : ''} group-hover:text-slate-600 dark:group-hover:text-slate-300`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Dropdown Menu Container */}
      <div 
        className={`absolute z-[60] mt-3 left-0 w-max min-w-full bg-white dark:bg-darkcard rounded-lg shadow-xl border border-slate-200 dark:border-darkborder duration-200 origin-top-left ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
      >
        <div className="py-1.5 max-h-48 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
           {allowAll && (
             <div 
               className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-darkborder hover:text-blue-700 dark:hover:text-white cursor-pointer" 
               onClick={() => { 
                 setSearchTerm(''); 
                 onChange(''); 
                 setIsOpen(false); 
               }}
             >
               All
             </div>
           )}
           {filteredOptions.map((opt, i) => (
             <div 
               key={i} 
               className={`px-3 py-2 text-xs cursor-pointer transition-colors text-slate-700 dark:text-slate-300 ${value === opt ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-darkborder'}`}
               onClick={() => { 
                 setSearchTerm(opt); 
                 onChange(opt); 
                 setIsOpen(false); 
               }}
             >
               {formatOption(opt)}
             </div>
           ))}
           {filteredOptions.length === 0 && (
             <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">No options matched</div>
           )}
        </div>
      </div>
    </div>
  );
}

