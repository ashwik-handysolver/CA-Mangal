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
  },
  {
    label: 'Masters',
    items: [
      { name: 'Financial Years', short: 'Years', path: '/app/tables/financial-years', icon: 'calendar', tint: 'bg-orange-500', subtitle: 'Assessment year periods' },
      { name: 'Service Types', short: 'Types', path: '/app/tables/service-types', icon: 'briefcase', tint: 'bg-cyan-600', subtitle: 'Services you offer' },
      { name: 'Mode Of Payment', short: 'Payment', path: '/app/tables/mode-of-payment', icon: 'card', tint: 'bg-violet-500', subtitle: 'Accounts and payment methods' },
      { name: 'Tags', short: 'Tags', path: '/app/tables/tags', icon: 'tag', tint: 'bg-amber-500', subtitle: 'Labels for service entries' },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
export const TAB_ITEMS = NAV_GROUPS[0].items;
export const MASTER_ITEMS = NAV_GROUPS[1].items;
