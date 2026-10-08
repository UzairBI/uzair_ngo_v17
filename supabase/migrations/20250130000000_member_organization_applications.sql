-- Member organisations: an organisation can now apply for membership from the website (/memberships). The application
-- waits as "pending" until an admin approves it in the admin panel (Member Organizations); only then is it listed.
-- Its contact person, phone, email and registration number are for the admins only and never reach the website.
-- Run this in Supabase SQL Editor after 20250129000000_member_organizations.sql (safe to run more than once).

alter table member_organizations
  -- organisations already listed, and ones an admin adds by hand, are approved from the start
  add column if not exists status text not null default 'approved',
  add column if not exists org_type text not null default '',
  add column if not exists registration_no text not null default '',
  add column if not exists year_founded integer,
  add column if not exists website text not null default '',
  add column if not exists focus_areas text[] not null default '{}',
  add column if not exists contact_name text not null default '',
  add column if not exists contact_phone text not null default '',
  add column if not exists contact_email text not null default '',
  -- for the admins only
  add column if not exists admin_note text not null default '';

alter table member_organizations drop constraint if exists member_organizations_application_check;
alter table member_organizations add constraint member_organizations_application_check check (
  status in ('pending', 'approved', 'rejected')
  and length(org_type) <= 40 and length(registration_no) <= 60
  and (year_founded is null or year_founded between 1800 and 2100)
  and length(website) <= 200 and (website = '' or website ~* '^https?://')
  and coalesce(array_length(focus_areas, 1), 0) <= 10
  and length(contact_name) <= 80 and length(contact_phone) <= 20 and length(contact_email) <= 120
  and length(admin_note) <= 400
);
create index if not exists ix_member_organizations_status on member_organizations (status, created_at desc);

-- ===== WHO SEES WHAT =====
-- Visitors: approved and published organisations only, and only the columns of the public card.
-- Admins: everything (the admin policies of the earlier migration stay as they are).

drop policy if exists "Public can read published member organizations" on member_organizations;
create policy "Public can read published member organizations"
  on member_organizations for select
  using (published = true and status = 'approved');

revoke select on member_organizations from anon;
grant select (id, name, location, description, published, sort_order, status) on member_organizations to anon;
grant update (name, location, description, published, sort_order, status, org_type, registration_no, year_founded, website,
  focus_areas, contact_name, contact_phone, contact_email, admin_note) on member_organizations to authenticated;

-- ===== WEBSITE: APPLY FOR MEMBERSHIP =====
-- Called by the form on /memberships. Saves one "pending" application and answers:
--   ok            saved, waiting for approval
--   duplicate     this organisation (same name and email) already has an application waiting
--   invalid / rate_limited   nothing was saved

create or replace function public.submit_member_organization(
  p_name text, p_location text, p_description text, p_org_type text, p_registration_no text,
  p_contact_name text, p_contact_phone text, p_contact_email text,
  p_focus_areas text[] default '{}', p_website text default null, p_year_founded integer default null
) returns jsonb as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_location text := trim(coalesce(p_location, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_type text := trim(coalesce(p_org_type, ''));
  v_reg text := trim(coalesce(p_registration_no, ''));
  v_contact text := trim(coalesce(p_contact_name, ''));
  v_phone text := trim(coalesce(p_contact_phone, ''));
  v_email text := lower(trim(coalesce(p_contact_email, '')));
  v_website text := trim(coalesce(p_website, ''));
  v_focus text[];
begin
  select coalesce(array_agg(distinct f), '{}') into v_focus from unnest(coalesce(p_focus_areas, '{}')) as f
    where f in ('Healthcare', 'Education', 'Women Empowerment', 'Child Welfare', 'Community Development', 'Environment', 'Other');
  if length(v_name) not between 2 and 160 or length(v_location) not between 2 and 120 or length(v_description) not between 20 and 600
    or v_type not in ('Trust', 'Society', 'Section 8 Company', 'Other') or length(v_reg) not between 2 and 60
    or length(v_contact) not between 2 and 80
    or length(v_phone) > 20 or length(regexp_replace(v_phone, '\D', '', 'g')) not between 10 and 13
    or length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or (v_website <> '' and (length(v_website) > 200 or v_website !~* '^https?://[^\s]+\.[^\s]+$'))
    or (p_year_founded is not null and p_year_founded not between 1800 and extract(year from now())::int)
    or coalesce(array_length(v_focus, 1), 0) = 0 then
    return jsonb_build_object('status', 'invalid');
  end if;

  if exists (select 1 from member_organizations where status = 'pending' and lower(name) = lower(v_name) and contact_email = v_email) then
    return jsonb_build_object('status', 'duplicate');
  end if;
  if (select count(*) from member_organizations where status = 'pending' and created_at > now() - interval '10 minutes') >= 20 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  insert into member_organizations (name, location, description, status, published, sort_order, org_type, registration_no, year_founded,
    website, focus_areas, contact_name, contact_phone, contact_email)
  values (v_name, v_location, v_description, 'pending', true, coalesce((select max(sort_order) from member_organizations), 0) + 10,
    v_type, v_reg, p_year_founded, v_website, v_focus, v_contact, v_phone, v_email);
  return jsonb_build_object('status', 'ok');
end;
$$ language plpgsql security definer set search_path = public;
grant execute on function public.submit_member_organization(text, text, text, text, text, text, text, text, text[], text, integer) to anon, authenticated;
