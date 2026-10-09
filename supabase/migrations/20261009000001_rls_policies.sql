-- Row Level Security for the app tables (safe to re-run).
-- Lets signed-in users read/write the app tables (anonymous visitors still see nothing).
-- Note: any signed-in account gets full access; there is no per-firm separation.
do $$
declare t text;
begin
  foreach t in array array['mii_financial_years','mii_modes_of_payment','mii_service_types','mii_tags','mii_clients','mii_expenses','mii_service_status']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "authenticated full access" on public.%I', t);
    execute format('create policy "authenticated full access" on public.%I for all to authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
