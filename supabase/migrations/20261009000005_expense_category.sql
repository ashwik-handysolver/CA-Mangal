-- Expenses: the "Services" column now picks from mii_category instead of
-- mii_service_types. Needs 20261009000004_category.sql first.
--
-- service_type_id is kept (not dropped) so nothing already saved is lost; the app
-- no longer reads or writes it.

alter table public.mii_expenses
  add column if not exists category_id bigint references public.mii_category (id) on delete set null;

create index if not exists mii_expenses_category_id_idx on public.mii_expenses (category_id);

-- Make the API see the new column straight away
notify pgrst, 'reload schema';
