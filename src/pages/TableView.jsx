import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import SubTable from '../components/SubTable';
import AdvancedTable from '../components/AdvancedTable';
import expensesData from '../data/expenses.json';
import financialYearsData from '../data/financialYears.json';
import settingsData from '../data/settings.json';
import clientsData from '../data/clients.json';
import serviceStatusData from '../data/serviceStatus.json';

export default function TableView() {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // Enforce authentication
  if (!user.email) {
    navigate('/login');
    return null;
  }

  // Mock users
  const users = ['Fasal', 'Atul', 'Rahul', 'Priya', 'Amit'];

  const serviceStatusColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'modeOfPayment', label: 'Mode Of Payment', type: 'select', options: settingsData.modeOfPayment.map(m => m.name) },
    { key: 'fees', label: 'Fees', type: 'currency' },
    { key: 'received', label: 'Received', type: 'currency' },
    { key: 'balance', label: 'Balance', type: 'currency', computed: (row) => (Number(row.fees || 0) - Number(row.received || 0)) },
    { key: 'assignedTo', label: 'Assigned To', type: 'user', options: users },
    { key: 'dateOfService', label: 'Date Of Service', type: 'date' },
    { key: 'tags', label: 'Tags', type: 'select', options: settingsData.tags.map(t => t.name) },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
    { key: 'paymentStatus', label: 'Payment Status', type: 'toggle' },
    { key: 'jobCompleted', label: 'Job Completed', type: 'toggle' },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'actions', label: 'Action', type: 'action' }
  ];

  const expenseColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'srNo', label: 'SR No', type: 'text' },
    { key: 'date', label: 'Date', type: 'date', required: false },
    { key: 'expenseName', label: 'Expense Name', type: 'text', required: true },
    { key: 'expenseAmount', label: 'Expense Amount', type: 'currency', required: true },
    { key: 'modeOfPayment', label: 'Mode Of Payment', type: 'select', options: settingsData.modeOfPayment.map(m => m.name) },
    { key: 'services', label: 'Services', type: 'select', options: settingsData.serviceTypes.map(s => s.name) },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'actions', label: 'Action', type: 'action' }
  ];

  const financialColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'actions', label: 'Action', type: 'action' }
  ];

  const clientColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'clientId', label: 'ID', type: 'text' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'fileNumber', label: 'File Number', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'clientType', label: 'Client Type', type: 'select', options: ['New Client', 'Old Client'] },
    { key: 'clientYear', label: 'Client Year', type: 'select', options: financialYearsData.map(y => y.label) },
    { 
      key: 'clientNumber', 
      label: 'New Client Number', 
      type: 'text',
      autoGenerate: (data, newRow) => {
        if (newRow.clientType === 'New Client') {
          let maxNum = 0;
          data.forEach(c => {
            if (c.clientType === 'New Client' && c.clientNumber && String(c.clientNumber).startsWith('N')) {
              const num = parseInt(c.clientNumber.substring(1), 10);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          });
          return `N${String(maxNum + 1).padStart(3, '0')}`;
        }
        return '';
      }
    },
    { 
      key: 'clientCode', 
      label: 'Client Code', 
      type: 'text',
      autoGenerate: (data, newRow) => {
        if (!newRow.clientYear) return '';
        
        // 1. Extract the YY YY from "YYYY-YYYY"
        // e.g. "2021-2022" -> ["2021", "2022"] -> "2122"
        const parts = String(newRow.clientYear).split('-');
        if (parts.length !== 2) return '';
        
        const yy1 = parts[0].slice(-2);
        const yy2 = parts[1].slice(-2);
        const prefix = yy1 + yy2;
        
        // 2. Find the highest global sequence number (last 6 digits of any existing code)
        let maxSeq = 0;
        data.forEach(c => {
          if (c.clientCode && String(c.clientCode).length >= 6) {
            // Extract the last 6 characters
            const seqStr = String(c.clientCode).slice(-6);
            const num = parseInt(seqStr, 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        });
        
        // 3. Combine prefix with new padded sequence
        return prefix + String(maxSeq + 1).padStart(6, '0');
      }
    },
    { key: 'actions', label: 'Action', type: 'action' }
  ];

  // Render specific table based on the route
  const renderTable = () => {
    switch(tableName) {
      case 'service-status':
        return <AdvancedTable key="service-status" title="Service Status" columns={serviceStatusColumns} showToolbar={true} initialData={serviceStatusData} />;
      case 'clients':
        return <AdvancedTable key="clients" title="Clients" columns={clientColumns} showToolbar={true} initialData={clientsData} />;
      case 'expense':
        return <AdvancedTable key="expense" title="Expense" columns={expenseColumns} showToolbar={true} initialData={expensesData} />;
      case 'financial-years':
        return <AdvancedTable key="financial-years" title="Financial Years" columns={financialColumns} showToolbar={true} initialData={financialYearsData} />;
      case 'service-types':
        return <SubTable key="service-types" title="Service Types" itemLabel="Type Of Service" initialData={settingsData.serviceTypes} />;
      case 'mode-of-payment':
        return <SubTable key="mode-of-payment" title="Mode Of Payment" itemLabel="Payment" initialData={settingsData.modeOfPayment} />;
      case 'tags':
        return <SubTable key="tags" title="Tags" itemLabel="Tag Name" initialData={settingsData.tags} />;
      default:
        return <Navigate to="/app/dashboard" replace />;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {renderTable()}
    </div>
  );
}
