-- Admin UI support: RLS policies for mutations, activity log triggers, and Storage buckets
-- Run this in Supabase SQL Editor after the first migration

-- ===== UPDATE is_admin() TO ACCEPT ANY ACTIVE ADMIN =====

create or replace function is_admin()
returns boolean as $$
  select exists(
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true
  );
$$ language sql stable security definer set search_path = public;

-- ===== RLS POLICIES: ENABLE MUTATIONS =====

-- Admins can insert donations (offline recording)
create policy "Admins can insert donations"
  on donations for insert
  with check (is_admin());

-- Admins can soft-delete donations (update status, not hard delete)
-- Allow deletion only for non-successful donations
create policy "Admins can delete non-successful donations"
  on donations for delete
  using (is_admin() and status <> 'success');

-- Admins can insert volunteers
create policy "Admins can insert volunteers"
  on volunteers for insert
  with check (is_admin());

-- Admins can delete volunteers
create policy "Admins can delete volunteers"
  on volunteers for delete
  using (is_admin());

-- Admins can delete document requests
create policy "Admins can delete document_requests"
  on document_requests for delete
  using (is_admin());

-- Admins can insert admin_profiles (for creating new admins)
create policy "Admins can insert admin_profiles"
  on admin_profiles for insert
  with check (is_admin());

-- ===== ACTIVITY LOG TRIGGER =====

create or replace function log_activity_trigger()
returns trigger as $$
declare
  admin_email text;
  action text;
  summary text;
begin
  -- Get the admin's email for the label
  select email into admin_email from auth.users where id = auth.uid();

  -- Determine action type
  if (TG_OP = 'INSERT') then
    action := 'created';
  elsif (TG_OP = 'UPDATE') then
    action := 'updated';
  elsif (TG_OP = 'DELETE') then
    action := 'deleted';
  else
    action := TG_OP;
  end if;

  -- Build summary based on table and action
  if TG_TABLE_NAME = 'projects' then
    if (TG_OP = 'DELETE') then
      summary := 'Deleted project "' || OLD.name || '"';
    else
      summary := action || ' project "' || COALESCE(NEW.name, '') || '" · status ' || COALESCE(NEW.status, '');
    end if;
  elsif TG_TABLE_NAME = 'volunteers' then
    if (TG_OP = 'DELETE') then
      summary := 'Deleted volunteer ' || COALESCE(OLD.name, '#' || OLD.id);
    else
      summary := action || ' volunteer ' || COALESCE(NEW.name, '#' || NEW.id);
      if (TG_OP = 'UPDATE' and NEW.status <> OLD.status) then
        summary := summary || ' · status ' || NEW.status;
      end if;
    end if;
  elsif TG_TABLE_NAME = 'events' then
    if (TG_OP = 'DELETE') then
      summary := 'Deleted event "' || OLD.title || '"';
    else
      summary := action || ' event "' || COALESCE(NEW.title, '') || '"';
      if (TG_OP = 'UPDATE' and NEW.published <> OLD.published) then
        summary := summary || (CASE when NEW.published then ' · published' else ' · draft' end);
      end if;
    end if;
  elsif TG_TABLE_NAME = 'donations' then
    if (TG_OP = 'DELETE') then
      summary := 'Deleted donation #' || OLD.id;
    else
      summary := action || ' donation ₹' || COALESCE(NEW.amount::text, '0') || ' from ' || COALESCE(NEW.donor_name, 'a donor') || ' · ' || COALESCE(NEW.status, '');
    end if;
  elsif TG_TABLE_NAME = 'document_requests' then
    if (TG_OP = 'DELETE') then
      summary := 'Deleted document request ' || COALESCE(OLD.reference, '#' || OLD.id);
    else
      summary := action || ' document request ' || COALESCE(NEW.reference, '#' || NEW.id);
      if (TG_OP = 'UPDATE' and NEW.status <> OLD.status) then
        summary := summary || ' · ' || NEW.status;
      end if;
    end if;
  else
    summary := action || ' ' || TG_TABLE_NAME;
  end if;

  -- Insert the activity log entry
  insert into activity_log (admin_id, admin_label, action, entity, entity_id, summary)
  values (auth.uid(), admin_email, action, TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text), substring(summary from 1 for 300));

  return COALESCE(NEW, OLD);
end;
$$ language plpgsql security definer set search_path = public;

-- Create triggers on all mutable tables
drop trigger if exists tr_projects_log_activity on projects;
drop trigger if exists tr_volunteers_log_activity on volunteers;
drop trigger if exists tr_events_log_activity on events;
drop trigger if exists tr_donations_log_activity on donations;
drop trigger if exists tr_document_requests_log_activity on document_requests;

create trigger tr_projects_log_activity after insert or update or delete on projects
  for each row execute function log_activity_trigger();

create trigger tr_volunteers_log_activity after insert or update or delete on volunteers
  for each row execute function log_activity_trigger();

create trigger tr_events_log_activity after insert or update or delete on events
  for each row execute function log_activity_trigger();

create trigger tr_donations_log_activity after insert or update or delete on donations
  for each row execute function log_activity_trigger();

create trigger tr_document_requests_log_activity after insert or update or delete on document_requests
  for each row execute function log_activity_trigger();

-- ===== RECREATE VIEWS WITH security_invoker =====

drop view if exists v_public_events;
drop view if exists v_public_projects;
drop view if exists v_campaign_progress;
drop view if exists v_dashboard_kpis;
drop view if exists v_donations_monthly;
drop view if exists v_leads;

create view v_public_events with (security_invoker = true) as
  select
    e.id, e.title, e.event_date, e.event_time, e.place, e.description,
    array_agg(json_build_object('id', ei.id, 'path', ei.storage_path) order by ei.position)
      filter (where ei.id is not null) as images
  from events e
  left join event_images ei on e.id = ei.event_id
  where e.published = true
  group by e.id, e.title, e.event_date, e.event_time, e.place, e.description
  order by e.event_date asc;

create view v_public_projects with (security_invoker = true) as
  select id, name, area, location, description, status, beneficiaries
  from projects
  where published = true
  order by created_at desc;

create view v_campaign_progress with (security_invoker = true) as
  select
    c.id, c.slug, c.title, c.description, c.cause, c.goal_amount,
    c.raised_offset + coalesce(sum(d.amount) filter (where d.status = 'success'), 0) as raised,
    round((c.raised_offset + coalesce(sum(d.amount) filter (where d.status = 'success'), 0)) / c.goal_amount * 100, 1) as percent
  from campaigns c
  left join donations d on c.id = d.campaign_id
  where c.published = true
  group by c.id, c.slug, c.title, c.description, c.cause, c.goal_amount, c.raised_offset
  order by c.sort_order, c.created_at;

create view v_leads with (security_invoker = true) as
  select 'volunteer' as source, id, name, email, phone, status, created_at
  from volunteers
  union all
  select 'document_request', id, name, email, phone, status, created_at
  from document_requests
  union all
  select 'form_submission', id, name, email, phone, status, created_at
  from form_submissions;

create view v_dashboard_kpis with (security_invoker = true) as
  select
    (select count(*) from donations where status = 'success' and date_trunc('month', donated_at) = date_trunc('month', now())) as donations_this_month,
    (select sum(amount) from donations where status = 'success' and date_trunc('month', donated_at) = date_trunc('month', now())) as amount_this_month,
    (select count(*) from donations where status = 'success' and date_trunc('year', donated_at) = date_trunc('year', now())) as donations_this_year,
    (select sum(amount) from donations where status = 'success' and date_trunc('year', donated_at) = date_trunc('year', now())) as amount_this_year,
    (select count(*) from document_requests where status = 'new') as pending_requests,
    (select count(*) from volunteers where status = 'pending') as pending_volunteers;

create view v_donations_monthly with (security_invoker = true) as
  select
    date_trunc('month', donated_at)::date as month,
    status,
    count(*) as count,
    sum(amount) as total
  from donations
  group by date_trunc('month', donated_at), status
  order by month desc;

-- ===== STORAGE BUCKETS & RLS =====

-- Create buckets if they don't exist
insert into storage.buckets (id, name, public) values ('event-images', 'event-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('request-files', 'request-files', false) on conflict (id) do nothing;

-- Event images: public read, admin write/delete
create policy "Public can read event images"
  on storage.objects for select
  using (bucket_id = 'event-images');

create policy "Admins can upload event images"
  on storage.objects for insert
  with check (bucket_id = 'event-images' and is_admin());

create policy "Admins can delete event images"
  on storage.objects for delete
  using (bucket_id = 'event-images' and is_admin());

-- Request files: admin read/write/delete only
create policy "Admins can read request files"
  on storage.objects for select
  using (bucket_id = 'request-files' and is_admin());

create policy "Admins can upload request files"
  on storage.objects for insert
  with check (bucket_id = 'request-files' and is_admin());

create policy "Admins can delete request files"
  on storage.objects for delete
  using (bucket_id = 'request-files' and is_admin());

-- ===== NOTE =====
-- After running this migration:
-- 1. Recreate any admin_profiles rows if they were deleted
-- 2. Test that admins can create donations, volunteers, events and projects
-- 3. Verify activity log entries are created
-- 4. Check that the views work correctly
