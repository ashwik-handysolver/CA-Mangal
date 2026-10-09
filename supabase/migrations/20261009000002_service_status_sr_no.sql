-- SR No for service status entries: a running serial number assigned by the
-- database (so two people adding at once never get the same number).
-- Safe to re-run.

alter table public.mii_service_status add column if not exists sr_no integer;

-- Number existing entries in the order they were created
with numbered as (
  select id, row_number() over (order by id) as n
  from public.mii_service_status
)
update public.mii_service_status s
set sr_no = numbered.n
from numbered
where s.id = numbered.id and s.sr_no is null;

-- New entries continue from the highest number
create sequence if not exists public.mii_service_status_sr_no_seq owned by public.mii_service_status.sr_no;
select setval('public.mii_service_status_sr_no_seq', coalesce((select max(sr_no) from public.mii_service_status), 0) + 1, false);
alter table public.mii_service_status alter column sr_no set default nextval('public.mii_service_status_sr_no_seq');
grant usage, select on sequence public.mii_service_status_sr_no_seq to authenticated;

create unique index if not exists mii_service_status_sr_no_key on public.mii_service_status (sr_no);

-- Make the API see the new column straight away
notify pgrst, 'reload schema';
