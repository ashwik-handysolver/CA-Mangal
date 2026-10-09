import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import SubTable from '../components/SubTable';
import AdvancedTable from '../components/AdvancedTable';
import { ListSkeleton } from '../components/Skeleton';
import { TABLES, loadTable, saveRow, deleteRow, insertRows } from '../lib/tables';
import { fyFilterOptions } from '../lib/financialYear';

export default function TableView() {
  const { tableName } = useParams();
  const [state, setState] = useState({ key: null, rows: null, lookups: {}, error: null });
  const valid = !!TABLES[tableName];

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    loadTable(tableName)
      .then(({ rows, lookups }) => !cancelled && setState({ key: tableName, rows, lookups, error: null }))
      .catch((e) => !cancelled && setState({ key: tableName, rows: [], lookups: {}, error: e.message }));
    return () => { cancelled = true; };
  }, [tableName, valid]);

  if (!valid) return <Navigate to="/app/dashboard" replace />;
  if (state.key !== tableName) {
    return <ListSkeleton />;
  }
  if (state.error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-darkcard border border-red-200 dark:border-red-500/30 py-14 px-6 text-center">
        <div className="text-[15px] font-semibold text-red-600">Could not load data</div>
        <div className="mt-1 text-sm text-slate-500">{state.error}</div>
      </div>
    );
  }

  const L = state.lookups;
  const names = (list, key = 'name') => (list || []).map((x) => x[key]);
  const onSave = (row, isNew, existing) => saveRow(tableName, row, isNew, L, existing);
  const onDelete = (row) => deleteRow(tableName, row.id);

  const serviceStatusColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'srNo', label: 'SR No', type: 'text', readOnly: true },
    { key: 'clientName', label: 'Client', type: 'select', options: names(L.clients), importRequired: true, aliases: ['Client Name', 'Name', 'Party', 'Party Name'] },
    { key: 'serviceType', label: 'Type Of Service', type: 'select', options: names(L.services), aliases: ['Service Type', 'Service', 'Services', 'Type'] },
    { key: 'modeOfPayment', label: 'Mode Of Payment', type: 'select', options: names(L.modes), aliases: ['Payment Mode', 'Mode'] },
    { key: 'fees', label: 'Fees', type: 'currency', aliases: ['Fee', 'Total Fees', 'Amount', 'Bill Amount'] },
    { key: 'received', label: 'Received', type: 'currency', aliases: ['Amount Received', 'Received Amount', 'Paid Amount'] },
    { key: 'balance', label: 'Balance', type: 'currency', computed: (row) => (Number(row.fees || 0) - Number(row.received || 0)) },
    { key: 'assignedTo', label: 'Assigned To', type: 'text', aliases: ['Assigned', 'Staff', 'Employee'] },
    { key: 'dateOfService', label: 'Date Of Service', type: 'date', aliases: ['Service Date', 'Date'] },
    { key: 'tags', label: 'Tags', type: 'select', options: names(L.tags), aliases: ['Tag'] },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
    { key: 'paymentStatus', label: 'Payment Status', type: 'toggle', aliases: ['Paid', 'Payment Received'] },
    { key: 'jobCompleted', label: 'Job Completed', type: 'toggle', aliases: ['Completed', 'Job Status', 'Status'] },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'actions', label: 'Action', type: 'action' }
  ];

  const expenseColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'srNo', label: 'SR No', type: 'text' },
    { key: 'date', label: 'Date', type: 'date', required: false },
    { key: 'expenseName', label: 'Expense Name', type: 'text', required: true },
    { key: 'expenseAmount', label: 'Expense Amount', type: 'currency', required: true },
    { key: 'modeOfPayment', label: 'Mode Of Payment', type: 'select', options: names(L.modes) },
    { key: 'services', label: 'Services', type: 'select', options: names(L.categories).filter((n) => n && n.trim()) },
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
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'fileNumber', label: 'File Number', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'clientType', label: 'Client Type', type: 'select', options: ['New Client', 'Old Client'], required: true },
    { key: 'clientYear', label: 'Client Year', type: 'select', options: names(L.years, 'label') },
    {
      key: 'clientNumber',
      label: 'New Client Number',
      type: 'text',
      // Edit keeps the saved number unless the client type changes
      dependsOn: ['clientType'],
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
      // Edit keeps the saved code unless the client year changes
      dependsOn: ['clientYear'],
      autoGenerate: (data, newRow) => {
        if (!newRow.clientYear) return '';

        // Year labels look like "2026-27" -> prefix "2627"
        const parts = String(newRow.clientYear).split('-');
        if (parts.length !== 2) return '';

        const prefix = parts[0].slice(-2) + parts[1].slice(-2);

        // Highest global sequence number (last 6 digits of any existing code)
        let maxSeq = 0;
        data.forEach(c => {
          if (c.clientCode && String(c.clientCode).length >= 6) {
            const num = parseInt(String(c.clientCode).slice(-6), 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
        });

        return prefix + String(maxSeq + 1).padStart(6, '0');
      }
    },
    { key: 'actions', label: 'Action', type: 'action' }
  ];

  const summaryOfIncomeColumns = [
    { key: 'index', label: 'Index', type: 'text' },
    { key: 'year', label: 'Financial Year', type: 'select', options: names(L.years, 'label'), required: true },
    { key: 'amount', label: 'Income', type: 'currency' },
    { key: 'expenses', label: 'Expenses', type: 'currency' },
    { key: 'netProfit', label: 'Net Profit', type: 'currency' },
    { key: 'actions', label: 'Action', type: 'action' }
  ];

  const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
  const fmtDate = (v) => (v ? String(v).split('-').reverse().join('/') : '');
  const join = (...parts) => parts.filter(Boolean).join(' · ');

  // How each record looks as a row in the mobile list
  const mobileConfigs = {
    'service-status': {
      title: (r) => r.clientName,
      subtitle: (r) => join(r.srNo && `#${r.srNo}`, r.serviceType, fmtDate(r.dateOfService)),
      right: (r) => {
        const bal = Number(r.fees || 0) - Number(r.received || 0);
        return { main: inr(r.fees), sub: bal > 0 ? `Due ${inr(bal)}` : 'Paid', tone: bal > 0 ? 'amber' : 'slate' };
      },
      badges: (r) => [
        ...(r.jobCompleted ? [{ text: 'Completed', tone: 'green' }] : [{ text: 'In progress', tone: 'amber' }]),
        ...(r.tags ? [{ text: r.tags, tone: 'brand' }] : []),
      ],
    },
    clients: {
      title: (r) => r.name,
      subtitle: (r) => join(r.fileNumber, r.phoneNumber, r.clientYear),
      badges: (r) => [{ text: r.clientType, tone: r.clientType === 'New Client' ? 'green' : 'amber' }],
    },
    expense: {
      title: (r) => r.expenseName,
      subtitle: (r) => join(fmtDate(r.date), r.modeOfPayment, r.notes),
      right: (r) => ({ main: inr(r.expenseAmount) }),
    },
    'summary-of-income': {
      title: (r) => r.year || 'No financial year',
      subtitle: (r) => join(`Income ${inr(r.amount)}`, `Expenses ${inr(r.expenses)}`),
      right: (r) => ({ main: inr(r.netProfit), sub: 'Net profit', tone: Number(r.netProfit) < 0 ? 'amber' : 'slate' }),
    },
    'financial-years': {
      title: (r) => r.label,
      subtitle: (r) => join(fmtDate(r.startDate), fmtDate(r.endDate)),
    },
  };

  const compactINR = (n) => {
    const v = Math.abs(n);
    if (v >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return inr(n);
  };
  const sum = (rows, f) => rows.reduce((s, r) => s + (Number(f(r)) || 0), 0);
  const num = (n) => n.toLocaleString('en-IN');

  // Summary cards + filter chips above each table (they follow the active filter and search)
  const insights = {
    'service-status': {
      stats: (rows) => [
        { label: 'Entries', value: num(rows.length) },
        { label: 'Billed', value: compactINR(sum(rows, (r) => r.fees)), tone: 'violet' },
        { label: 'Collected', value: compactINR(sum(rows, (r) => r.received)), tone: 'green' },
        { label: 'Pending', value: compactINR(sum(rows, (r) => Math.max(0, (r.fees || 0) - (r.received || 0)))), tone: 'amber' },
      ],
      filters: [
        { label: 'All' },
        { label: 'Payment pending', test: (r) => (r.fees || 0) > (r.received || 0) },
        { label: 'Fully paid', test: (r) => (r.fees || 0) <= (r.received || 0) },
        { label: 'In progress', test: (r) => !r.jobCompleted },
        { label: 'Completed', test: (r) => r.jobCompleted },
      ],
      // Only entries whose date of service falls inside the chosen financial year
      selectFilter: { label: 'Financial year', allLabel: 'All financial years', options: fyFilterOptions(L.years, 'dateOfService') },
    },
    clients: {
      stats: (rows) => [
        { label: 'Clients', value: num(rows.length) },
        { label: 'New clients', value: num(rows.filter((r) => r.clientType === 'New Client').length), tone: 'green' },
        { label: 'Old clients', value: num(rows.filter((r) => r.clientType !== 'New Client').length), tone: 'amber' },
      ],
      filters: [
        { label: 'All' },
        { label: 'New clients', test: (r) => r.clientType === 'New Client' },
        { label: 'Old clients', test: (r) => r.clientType !== 'New Client' },
      ],
    },
    expense: {
      stats: (rows) => [
        { label: 'Entries', value: num(rows.length) },
        { label: 'Total spent', value: compactINR(sum(rows, (r) => r.expenseAmount)), tone: 'rose' },
        { label: 'Average', value: compactINR(rows.length ? sum(rows, (r) => r.expenseAmount) / rows.length : 0), tone: 'violet' },
      ],
    },
    'summary-of-income': {
      stats: (rows) => [
        { label: 'Years', value: num(rows.length) },
        { label: 'Income', value: compactINR(sum(rows, (r) => r.amount)), tone: 'violet' },
        { label: 'Expenses', value: compactINR(sum(rows, (r) => r.expenses)), tone: 'rose' },
        { label: 'Net profit', value: compactINR(sum(rows, (r) => r.netProfit)), tone: 'green' },
      ],
    },
  };

  const common = { showToolbar: true, initialData: state.rows, onSave, onDelete, mobile: mobileConfigs[tableName], ...insights[tableName] };

  // Render specific table based on the route
  const renderTable = () => {
    switch (tableName) {
      case 'service-status':
        return <AdvancedTable key={tableName} title="Service Status" columns={serviceStatusColumns} {...common} onImport={(rows) => insertRows(tableName, rows, L)} exportable />;
      case 'clients':
        return <AdvancedTable key={tableName} title="Clients" columns={clientColumns} {...common} />;
      case 'expense':
        return <AdvancedTable key={tableName} title="Expense" columns={expenseColumns} {...common} />;
      case 'summary-of-income':
        return <AdvancedTable key={tableName} title="Summary Of Income" columns={summaryOfIncomeColumns} {...common} exportable />;
      case 'financial-years':
        return <AdvancedTable key={tableName} title="Financial Years" columns={financialColumns} {...common} />;
      case 'service-types':
        return <SubTable key={tableName} title="Service Types" itemLabel="Type Of Service" initialData={state.rows} onSave={onSave} onDelete={onDelete} />;
      case 'mode-of-payment':
        return <SubTable key={tableName} title="Mode Of Payment" itemLabel="Payment" initialData={state.rows} onSave={onSave} onDelete={onDelete} />;
      case 'tags':
        return <SubTable key={tableName} title="Tags" itemLabel="Tag Name" initialData={state.rows} onSave={onSave} onDelete={onDelete} />;
      case 'categories':
        return <SubTable key={tableName} title="Categories" itemLabel="Category Name" initialData={state.rows} onSave={onSave} onDelete={onDelete} />;
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
