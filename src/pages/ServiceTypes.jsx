import React from 'react';
import data from '../data/context.json';
import SubTable from '../components/SubTable';
import { Link } from 'react-router-dom';

export default function ServiceTypes() {
  return (
    <div className="min-h-screen bg-[#f8f7f2] px-4 py-8 max-w-5xl mx-auto"
         style={{
           backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
           backgroundSize: '40px 40px',
           backgroundPosition: '-1px -1px'
         }}>
      <div className="mb-4">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>
      <SubTable 
        title="Service Types" 
        itemLabel="Type Of Service" 
        initialData={data.serviceTypes} 
      />
    </div>
  );
}
