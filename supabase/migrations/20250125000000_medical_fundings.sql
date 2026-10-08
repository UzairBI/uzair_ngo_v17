-- Medical Funding (website: Our Projects -> Medical Facilities). The admin panel (Medical Funding) adds, edits and removes
-- the hospitals and medical facilities the Samiti has funded, with the amount donated to each.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists medical_fundings (
  id bigint primary key generated always as identity,
  -- which list on the page: 'hospital' = Hospital Funding, 'facility' = NGO Medical Facilities
  kind text not null default 'hospital' check (kind in ('hospital', 'facility')),
  name text not null check (length(trim(name)) between 1 and 160),
  location text not null default '' check (length(location) <= 120),
  -- what the money was for (shown under the name)
  purpose text not null default '' check (length(purpose) <= 600),
  -- rupees donated; 0 = no amount shown for this entry
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  -- when, as it should read on the page: "2024", "2023-24", "March 2025"
  period text not null default '' check (length(period) <= 40),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table medical_fundings enable row level security;
create index if not exists ix_medical_fundings_order on medical_fundings (kind, amount desc);

drop trigger if exists tr_medical_fundings_updated_at on medical_fundings;
create trigger tr_medical_fundings_updated_at before update on medical_fundings for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published entries only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published medical fundings" on medical_fundings;
create policy "Public can read published medical fundings"
  on medical_fundings for select
  using (published = true);

drop policy if exists "Admins can read all medical fundings" on medical_fundings;
create policy "Admins can read all medical fundings"
  on medical_fundings for select
  using (is_admin());

drop policy if exists "Admins can insert medical fundings" on medical_fundings;
create policy "Admins can insert medical fundings"
  on medical_fundings for insert
  with check (is_admin());

drop policy if exists "Admins can update medical fundings" on medical_fundings;
create policy "Admins can update medical fundings"
  on medical_fundings for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete medical fundings" on medical_fundings;
create policy "Admins can delete medical fundings"
  on medical_fundings for delete
  using (is_admin());

revoke all on medical_fundings from public, anon, authenticated;
grant select on medical_fundings to anon;
grant select, insert, delete on medical_fundings to authenticated;
grant update (kind, name, location, purpose, amount, period, published) on medical_fundings to authenticated;

-- ===== FIRST ENTRIES =====
-- Added once (only while the table is empty). The two hospitals are the ones named under Awards & Recognition, with no amount
-- set: enter the amount donated to each in the admin panel. The three facilities are DEMO entries with made-up amounts, to show
-- how the list looks: edit or remove them in the admin panel before the page goes public.

insert into medical_fundings (kind, name, location, purpose, amount, period)
select m.kind, m.name, m.location, m.purpose, m.amount, m.period
from (values
  ('hospital', 'Municipal General Hospital', 'Mumbai, Maharashtra', 'Patient welfare and healthcare assistance, recognised by the hospital with a Certificate of Excellence.', 0, ''),
  ('hospital', 'Dr. R. N. Cooper General Hospital', 'Mumbai, Maharashtra', 'Support and contribution towards patient care facilities, acknowledged by the hospital in an appreciation letter.', 0, ''),
  ('facility', 'Mobility Aids & Rehabilitation Equipment', 'Sagar District, M.P.', 'Wheelchairs, walkers and rehabilitation aids given to patients and persons with disabilities.', 320000, '2024-25'),
  ('facility', 'Village Health Check-up Camp Unit', 'Sagar District, M.P.', 'Doctors, medicines and basic tests for free health check-up camps in remote villages.', 250000, '2024-25'),
  ('facility', 'Sanitary Pad Vending Machines in Schools', 'Sagar District, M.P.', 'Vending machines installed in government schools so that girls have sanitary pads at hand.', 180000, '2023-24')
) as m(kind, name, location, purpose, amount, period)
where not exists (select 1 from medical_fundings);
