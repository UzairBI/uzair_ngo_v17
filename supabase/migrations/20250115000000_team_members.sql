-- Team on the website (About Us -> Our Executive Committee and Management Team). The admin panel (Team & Volunteers)
-- adds, edits and removes the people. Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists team_members (
  id bigint primary key generated always as identity,
  -- which block of the About page: 'committee' = Our Executive Committee, 'management' = Management Team
  team text not null default 'committee' check (team in ('committee', 'management')),
  name text not null check (length(trim(name)) between 1 and 120),
  post text not null check (length(trim(post)) between 1 and 120),
  -- short description of what the person does (shown on Management Team cards)
  role text not null default '' check (length(role) <= 400),
  published boolean not null default true,
  -- order inside the block: lower first
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table team_members enable row level security;
create index if not exists ix_team_members_order on team_members (team, sort_order, id);

drop trigger if exists tr_team_members_updated_at on team_members;
create trigger tr_team_members_updated_at before update on team_members for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published people only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published team members" on team_members;
create policy "Public can read published team members"
  on team_members for select
  using (published = true);

drop policy if exists "Admins can read all team members" on team_members;
create policy "Admins can read all team members"
  on team_members for select
  using (is_admin());

drop policy if exists "Admins can insert team members" on team_members;
create policy "Admins can insert team members"
  on team_members for insert
  with check (is_admin());

drop policy if exists "Admins can update team members" on team_members;
create policy "Admins can update team members"
  on team_members for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete team members" on team_members;
create policy "Admins can delete team members"
  on team_members for delete
  using (is_admin());

revoke all on team_members from public, anon, authenticated;
grant select on team_members to anon;
grant select, insert, delete on team_members to authenticated;
grant update (team, name, post, role, published, sort_order) on team_members to authenticated;

-- ===== THE PEOPLE ALREADY PUBLISHED =====
-- The committee and management team from the earlier website, added once (only while the table is empty).

insert into team_members (team, sort_order, name, post, role)
select m.team, m.n * 10, m.name, m.post, m.role
from (values
  ('committee', 1, 'Dr. Harishankar Sen', 'Chairman / President', ''),
  ('committee', 2, 'Mr. Manish Kumar', 'Secretary', ''),
  ('committee', 3, 'Smt. Ritu Sen', 'Treasurer', ''),
  ('committee', 4, 'Smt. Sunita Jain', 'Vice President', ''),
  ('committee', 5, 'Mr. Abhitabh Mishra', 'General Secretary', ''),
  ('committee', 6, 'Anita Tiwari', 'Executive Member', ''),
  ('committee', 7, 'Roop Kumar Chadar', 'Executive Member', ''),
  ('management', 1, 'Dr. Harishankar Sen', 'Chairman & CEO', 'Founder Chairman with 25+ years in social development, governance and community empowerment. Strategic leadership, fundraising and programme oversight.'),
  ('management', 2, 'Dr. Shailendra Yadav', 'Manager', 'Programme design, implementation and field monitoring across health, education, nutrition and livelihood sectors.'),
  ('management', 3, 'Dr. Suyash Kamal Soni', 'Program Manager', 'Coordination of development projects, beneficiary engagement, progress monitoring and stakeholder communication.'),
  ('management', 4, 'Kaustubh Agrawal', 'Admin & Finance Head', 'Financial planning, budgeting, statutory compliance and programme accounting.')
) as m(team, n, name, post, role)
where not exists (select 1 from team_members);
