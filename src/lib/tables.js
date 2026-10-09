import { supabase } from './supabase';

// Maps each screen (route) to its Supabase table and converts rows between
// the DB shape and the shape the table components work with.

const PAGE = 1000;

export async function fetchAll(table, select = '*') {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order('id', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

const blank = (v) => (v === '' || v === undefined ? null : v);
const num = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

const idByName = (list, key, name) => (name ? list.find((x) => x[key] === name)?.id ?? null : null);
const nameById = (list, key, id) => (id == null ? '' : list.find((x) => x.id === id)?.[key] ?? '');

const nameRow = (r) => ({ id: r.id, index: r.id, name: r.name });

const maxOrder = (rows) => ({ display_order: rows.reduce((m, r) => Math.max(m, r.displayOrder || 0), 0) + 1 });

// lookups: which small tables a screen needs loaded alongside its own rows
export const LOOKUPS = {
  years: { table: 'mii_financial_years', select: 'id,label' },
  modes: { table: 'mii_modes_of_payment', select: 'id,name' },
  services: { table: 'mii_service_types', select: 'id,name' },
  tags: { table: 'mii_tags', select: 'id,name' },
  clients: { table: 'mii_clients', select: 'id,name' },
};

export const TABLES = {
  'financial-years': {
    table: 'mii_financial_years',
    fromDb: (r) => ({ id: r.id, index: r.id, label: r.label, startDate: r.start_date || '', endDate: r.end_date || '' }),
    toDb: (r) => ({ label: blank(r.label), start_date: blank(r.startDate), end_date: blank(r.endDate) }),
  },

  clients: {
    table: 'mii_clients',
    needs: ['years'],
    fromDb: (r, L) => ({
      id: r.id,
      index: r.id,
      name: r.name,
      fileNumber: r.file_number || '',
      email: r.email || '',
      phoneNumber: r.phone_number || '',
      address: r.address || '',
      clientType: r.new_client ? 'New Client' : 'Old Client',
      clientYear: nameById(L.years, 'label', r.new_client_year),
      clientNumber: r.new_client_number || '',
      clientCode: r.client_code || '',
    }),
    toDb: (r, L) => ({
      name: r.name,
      file_number: blank(r.fileNumber),
      email: blank(r.email),
      phone_number: blank(r.phoneNumber),
      address: blank(r.address),
      new_client: r.clientType === 'New Client' ? 1 : 0,
      new_client_year: idByName(L.years, 'label', r.clientYear),
      new_client_number: blank(r.clientNumber),
      client_code: blank(r.clientCode),
    }),
  },

  expense: {
    table: 'mii_expenses',
    needs: ['modes', 'services'],
    fromDb: (r, L) => ({
      id: r.id,
      index: r.id,
      srNo: r.sr_no || '',
      date: r.expense_date || '',
      expenseName: r.expense_name,
      expenseAmount: r.expense_amount,
      modeOfPayment: nameById(L.modes, 'name', r.mode_of_payment_id),
      services: nameById(L.services, 'name', r.service_type_id),
      notes: r.notes || '',
    }),
    toDb: (r, L) => ({
      sr_no: blank(r.srNo),
      expense_date: blank(r.date),
      expense_name: r.expenseName,
      expense_amount: num(r.expenseAmount) ?? 0,
      mode_of_payment_id: idByName(L.modes, 'name', r.modeOfPayment),
      service_type_id: idByName(L.services, 'name', r.services),
      notes: blank(r.notes),
    }),
  },

  'service-status': {
    table: 'mii_service_status',
    needs: ['clients', 'services', 'modes', 'tags'],
    fromDb: (r, L) => ({
      id: r.id,
      index: r.id,
      clientId: r.client_id,
      clientName: nameById(L.clients, 'name', r.client_id),
      serviceType: nameById(L.services, 'name', r.service_type_id),
      modeOfPayment: nameById(L.modes, 'name', r.mode_of_payment_id),
      fees: r.fees,
      received: r.received,
      assignedTo: r.assigned_to || '',
      dateOfService: r.date_of_service || '',
      tags: nameById(L.tags, 'name', r.tag_id),
      remarks: r.remarks || '',
      paymentStatus: !!r.payment_status,
      jobCompleted: !!r.job_completed,
      notes: r.notes || '',
    }),
    toDb: (r, L) => ({
      client_id:
        r.clientId != null && nameById(L.clients, 'name', r.clientId) === r.clientName
          ? r.clientId
          : idByName(L.clients, 'name', r.clientName),
      service_type_id: idByName(L.services, 'name', r.serviceType),
      mode_of_payment_id: idByName(L.modes, 'name', r.modeOfPayment),
      fees: num(r.fees),
      received: num(r.received),
      assigned_to: blank(r.assignedTo),
      date_of_service: blank(r.dateOfService),
      tag_id: idByName(L.tags, 'name', r.tags),
      remarks: blank(r.remarks),
      payment_status: !!r.paymentStatus,
      job_completed: !!r.jobCompleted,
      notes: blank(r.notes),
    }),
  },

  'service-types': {
    table: 'mii_service_types',
    fromDb: (r) => ({ ...nameRow(r), displayOrder: r.display_order }),
    toDb: (r) => ({ name: r.name }),
    extraInsert: maxOrder,
  },
  'mode-of-payment': {
    table: 'mii_modes_of_payment',
    fromDb: (r) => ({ ...nameRow(r), displayOrder: r.display_order }),
    toDb: (r) => ({ name: r.name }),
    extraInsert: maxOrder,
  },
  tags: {
    table: 'mii_tags',
    fromDb: nameRow,
    toDb: (r) => ({ name: r.name }),
  },
};

export async function loadTable(key) {
  const cfg = TABLES[key];
  const L = {};
  const [rows] = await Promise.all([
    fetchAll(cfg.table),
    ...(cfg.needs || []).map(async (n) => {
      L[n] = await fetchAll(LOOKUPS[n].table, LOOKUPS[n].select);
    }),
  ]);
  return { lookups: L, rows: rows.map((r) => cfg.fromDb(r, L)) };
}

export async function saveRow(key, row, isNew, L, existing) {
  const cfg = TABLES[key];
  const payload = cfg.toDb(row, L);
  const q = isNew
    ? supabase.from(cfg.table).insert({ ...payload, ...(cfg.extraInsert ? cfg.extraInsert(existing) : {}) })
    : supabase.from(cfg.table).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', row.id);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return cfg.fromDb(data, L);
}

export async function deleteRow(key, id) {
  const { error } = await supabase.from(TABLES[key].table).delete().eq('id', id);
  if (error) throw error;
}
