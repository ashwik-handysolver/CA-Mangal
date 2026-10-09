export const FIRM = {
  name: 'Atul Mangal & Co',
  tagline: 'Chartered Accountants',
  motto: 'Dedicated to the Profession since 2001',
};

// tint = iOS-settings style icon background
export const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', short: 'Home', path: '/app/dashboard', icon: 'dashboard', tint: 'bg-blue-500', subtitle: 'Your practice at a glance' },
      { name: 'Service Status', short: 'Services', path: '/app/tables/service-status', icon: 'status', tint: 'bg-emerald-500', subtitle: 'Work, fees and collections' },
      { name: 'Clients', short: 'Clients', path: '/app/tables/clients', icon: 'clients', tint: 'bg-indigo-500', subtitle: 'Everyone you file and advise for' },
      { name: 'Expense', short: 'Expense', path: '/app/tables/expense', icon: 'expense', tint: 'bg-rose-500', subtitle: 'Office and operating expenses' },
    ],
    // Listed after the Workspace items in the sidebar; on mobile in the "More" sheet (the tab bar has no room)
    reports: [
      { name: 'Summary Of Income', short: 'Income', path: '/app/tables/summary-of-income', icon: 'trend', tint: 'bg-green-600', subtitle: 'Income, expenses and net profit by year' },
      { name: 'Income Summary Report', short: 'Income report', path: '/app/reports/summary-of-income', icon: 'trend', tint: 'bg-emerald-600', subtitle: 'Yearly income, expenses and growth' },
      { name: 'New Clients Report', short: 'New clients', path: '/app/reports/new-clients', icon: 'clients', tint: 'bg-sky-600', subtitle: 'Work and fees for new clients' },
      { name: 'New Clients Monthly', short: 'New monthly', path: '/app/reports/new-clients-monthly', icon: 'calendar', tint: 'bg-sky-500', subtitle: 'New-client entries and fees by month' },
      { name: 'Team Members Contribution', short: 'Team', path: '/app/reports/team-contribution', icon: 'clients', tint: 'bg-fuchsia-600', subtitle: 'Entries and fees per team member' },
      { name: 'Cumulative Report', short: 'Cumulative', path: '/app/reports/cumulative', icon: 'trend', tint: 'bg-teal-600', subtitle: 'Month-by-month fees, year to date' },
    ],
  },
  {
    label: 'Masters',
    items: [
      { name: 'Financial Years', short: 'Years', path: '/app/tables/financial-years', icon: 'calendar', tint: 'bg-orange-500', subtitle: 'Assessment year periods' },
      { name: 'Service Types', short: 'Types', path: '/app/tables/service-types', icon: 'briefcase', tint: 'bg-cyan-600', subtitle: 'Services you offer' },
      { name: 'Mode Of Payment', short: 'Payment', path: '/app/tables/mode-of-payment', icon: 'card', tint: 'bg-violet-500', subtitle: 'Accounts and payment methods' },
      { name: 'Tags', short: 'Tags', path: '/app/tables/tags', icon: 'tag', tint: 'bg-amber-500', subtitle: 'Labels for service entries' },
      { name: 'Categories', short: 'Categories', path: '/app/tables/categories', icon: 'note', tint: 'bg-lime-600', subtitle: 'Service and expense categories' },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => [...g.items, ...(g.reports || [])]);
export const TAB_ITEMS = NAV_GROUPS[0].items;
export const REPORT_ITEMS = NAV_GROUPS[0].reports;
export const MASTER_ITEMS = NAV_GROUPS[1].items;
