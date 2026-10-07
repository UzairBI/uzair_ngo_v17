-- Team tree (admin Team & Volunteers -> Team tree): who each team member or volunteer works under.
-- Admin panel only: the website does not show it. Run this in Supabase SQL Editor (safe to run more than once).

-- "team:<id>" = works under that team member, "volunteer:<id>" = under that volunteer, null = under no one (top of the tree).
-- No foreign key on purpose (it can point at either table): when the lead is deleted, the admin panel shows the person at the top again.
alter table team_members add column if not exists reports_to text;
alter table volunteers add column if not exists reports_to text;

alter table team_members drop constraint if exists team_members_reports_to_check;
alter table team_members add constraint team_members_reports_to_check check (reports_to is null or reports_to ~ '^(team|volunteer):[0-9]+$');
alter table volunteers drop constraint if exists volunteers_reports_to_check;
alter table volunteers add constraint volunteers_reports_to_check check (reports_to is null or reports_to ~ '^(team|volunteer):[0-9]+$');

-- admins may change it (updates on team_members are granted column by column)
grant update (reports_to) on team_members to authenticated;
