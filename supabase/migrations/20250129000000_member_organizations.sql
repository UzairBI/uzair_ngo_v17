-- Member organisations (website: Membership -> Memberships, /memberships). The admin panel (Member Organizations)
-- adds, edits and removes the organisations of the Samiti's network.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists member_organizations (
  id bigint primary key generated always as identity,
  name text not null check (length(trim(name)) between 1 and 160),
  -- where it works, e.g. "Sagar, Madhya Pradesh"
  location text not null default '' check (length(location) <= 120),
  -- one or two lines on what the organisation does (shown on its card)
  description text not null default '' check (length(description) <= 600),
  published boolean not null default true,
  -- order on the page: lower first
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table member_organizations enable row level security;
create index if not exists ix_member_organizations_order on member_organizations (sort_order, id);

drop trigger if exists tr_member_organizations_updated_at on member_organizations;
create trigger tr_member_organizations_updated_at before update on member_organizations for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published organisations only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published member organizations" on member_organizations;
create policy "Public can read published member organizations"
  on member_organizations for select
  using (published = true);

drop policy if exists "Admins can read all member organizations" on member_organizations;
create policy "Admins can read all member organizations"
  on member_organizations for select
  using (is_admin());

drop policy if exists "Admins can insert member organizations" on member_organizations;
create policy "Admins can insert member organizations"
  on member_organizations for insert
  with check (is_admin());

drop policy if exists "Admins can update member organizations" on member_organizations;
create policy "Admins can update member organizations"
  on member_organizations for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete member organizations" on member_organizations;
create policy "Admins can delete member organizations"
  on member_organizations for delete
  using (is_admin());

revoke all on member_organizations from public, anon, authenticated;
grant select on member_organizations to anon;
grant select, insert, delete on member_organizations to authenticated;
grant update (name, location, description, published, sort_order) on member_organizations to authenticated;

-- ===== THE ORGANISATIONS ALREADY PUBLISHED =====
-- The three from the earlier website (saharangosag.com/member-organization), added once (only while the table is empty).

insert into member_organizations (sort_order, name, location, description)
select m.n * 10, m.name, m.location, m.description
from (values
  (1, 'YAJUR Foundation', 'Sagar, Madhya Pradesh', 'Working in healthcare awareness and rural medical support programs.'),
  (2, 'Sumardha Trust', 'Rehli, Sagar, Madhya Pradesh', 'Focused on education, digital literacy, and youth empowerment.'),
  (3, 'Rural Development Society', 'Chhatarpur, Madhya Pradesh', 'Engaged in livelihood development and women self-help group initiatives.')
) as m(n, name, location, description)
where not exists (select 1 from member_organizations);
