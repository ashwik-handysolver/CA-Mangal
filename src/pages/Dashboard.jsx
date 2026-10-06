import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubTable from '../components/SubTable';
import AdvancedTable from '../components/AdvancedTable';
import data from '../data/context.json';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

  if (!user.email) {
    navigate('/login');
    return null;
  }

  const expenseColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'srNo', label: 'SR No', type: 'text', sortable: true },
    { key: 'date', label: 'Date', type: 'date', required: true, sortable: true },
    { key: 'expenseName', label: 'Expense Name', type: 'select', required: true, sortable: true },
    { key: 'expenseAmount', label: 'Expense Amount', type: 'currency', required: true, sortable: true },
    { key: 'modeOfPayment', label: 'Mode Of Payment', type: 'select', sortable: true },
    { key: 'services', label: 'Services', type: 'select', sortable: true },
    { key: 'notes', label: 'Notes', type: 'select', sortable: true },
    { key: 'delete', label: 'Delete', type: 'action' }
  ];

  const financialColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'label', label: 'Label', type: 'select', sortable: true },
    { key: 'startDate', label: 'Start Date', type: 'date', sortable: true },
    { key: 'endDate', label: 'End Date', type: 'date', sortable: true },
    { key: 'delete', label: 'Delete', type: 'action' }
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f2] px-4 py-8 max-w-[1400px] mx-auto space-y-12"
         style={{
           backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
           backgroundSize: '40px 40px',
           backgroundPosition: '-1px -1px'
         }}>

      <AdvancedTable 
        title="Expense"
        columns={expenseColumns}
        showToolbar={true}
        paginationText="Showing 1-1 of 518 record(s)"
        initialData={[
          { id: 518, index: '518', srNo: '518', date: '07/03/2026', expenseName: 'Kunal Gaund', expenseAmount: '₹32,741.90', modeOfPayment: 'Atul- HDFC Bank', services: 'Salary', notes: 'Salary March 26' }
        ]}
      />

      <AdvancedTable 
        title="Financial Years"
        columns={financialColumns}
        showToolbar={false}
        paginationText="Showing 1-7 of 10 record(s)"
        initialData={[
          { id: 10, index: '10', label: '2029-30', startDate: '01/04/2029', endDate: '31/03/2030' },
          { id: 9, index: '9', label: '2028-29', startDate: '01/04/2028', endDate: '31/03/2029' },
          { id: 8, index: '8', label: '2027-28', startDate: '01/04/2027', endDate: '31/03/2028' },
          { id: 7, index: '7', label: '2026-27', startDate: '01/04/2026', endDate: '31/03/2027' },
          { id: 6, index: '6', label: '2025-26', startDate: '01/04/2025', endDate: '31/03/2026' },
          { id: 5, index: '5', label: '2024-25', startDate: '01/04/2024', endDate: '31/03/2025' },
          { id: 4, index: '4', label: '2023-24', startDate: '01/04/2023', endDate: '31/03/2024' }
        ]}
      />
         
      <SubTable 
        title="Service Types" 
        itemLabel="Type Of Service" 
        initialData={data.serviceTypes} 
      />

      <SubTable 
        title="Mode Of Payment" 
        itemLabel="Payment" 
        initialData={[
          { index: 25, name: "ATUL CANARA" },
          { index: 24, name: "Update Payment" },
          { index: 23, name: "2" },
          { index: 22, name: "3" },
          { index: 21, name: "6" },
          { index: 20, name: "Virel-HDFC Bank" },
          { index: 19, name: "HDFC" },
          { index: 18, name: "cash" },
          { index: 17, name: "1" },
          { index: 16, name: "7" }
        ]} 
      />
      <SubTable 
        title="Tags" 
        itemLabel="Tag Name" 
        initialData={[
          { index: 59, name: "ITR 100" },
          { index: 58, name: "ITR 271" },
          { index: 57, name: "ITR 134" },
          { index: 56, name: "ITR 127" },
          { index: 55, name: "ITR 287" },
          { index: 54, name: "ITR 11" },
          { index: 53, name: "ITR 17" },
          { index: 52, name: "ITR 12" },
          { index: 51, name: "ITR 47" },
          { index: 50, name: "ITR 16" },
          { index: 49, name: "ITR 31" }
        ]} 
      />
      
    </div>
  );
}
