-- Supabase migration: complete schema for the NGO site + admin
-- Production-ready with RLS, indexes, views and triggers.
-- Run this in Supabase SQL Editor, or with: supabase migration up

-- ===== SETUP: ENABLE FEATURES =====
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- trigram search for names

-- ===== TABLES =====

-- Admin profiles: linked to auth.users, holds the role and status.
-- Created before the helper functions below because is_admin() (a `language sql`
-- function) is validated against the catalog at CREATE FUNCTION time, so the
-- table it references must already exist.
create table admin_profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
alter table admin_profiles enable row level security;

-- ===== HELPER FUNCTIONS =====

-- Check if the current user is an admin (by looking up their profile).
create or replace function is_admin()
returns boolean as $$
  select exists(
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- Auto-update the updated_at timestamp on any row.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Donors: normalizes donor details so receipts show the original info.
create table donors (
  id bigint primary key generated always as identity,
  name text not null,
  email text,
  phone text,
  pan text check (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$' or pan is null),
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table donors enable row level security;
create index ix_donors_email on donors (lower(email)) where email is not null;
create index ix_donors_name_trgm on donors using gin (name gin_trgm_ops);

-- Campaigns for fundraising.
create table campaigns (
  id bigint primary key generated always as identity,
  slug text not null unique,
  title text not null,
  description text,
  cause text,
  goal_amount numeric(12,2) not null check (goal_amount > 0),
  raised_offset numeric(12,2) not null default 0 check (raised_offset >= 0),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table campaigns enable row level security;
create index ix_campaigns_published on campaigns (published);

-- Donations: the core financial record. Snapshots of donor info at donation time.
create table donations (
  id bigint primary key generated always as identity,
  seq bigint generated always as (id) stored,
  donor_id bigint references donors on delete set null,
  campaign_id bigint references campaigns on delete set null,
  donated_at date not null default current_date,
  mode text not null default 'offline' check (mode in ('online', 'offline')),
  method text,
  status text not null default 'success' check (status in ('pending', 'success', 'failed', 'refunded', 'cancelled')),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'INR',
  donor_name text,
  donor_email text,
  donor_phone text,
  donor_pan text,
  donor_address text,
  purpose text,
  reference text,
  notes text,
  gateway text,
  gateway_order_id text,
  gateway_payment_id text unique,
  gateway_status text,
  gateway_error text,
  receipt_sent_at timestamptz,
  tax_receipt_issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table donations enable row level security;
create index ix_donations_status on donations (status);
create index ix_donations_donated_at on donations (donated_at desc);
create index ix_donations_donor_id on donations (donor_id);
create index ix_donations_campaign_id on donations (campaign_id);
create index ix_donations_donor_email on donations (lower(donor_email)) where status = 'success';

-- Webhook events from payment providers: audit trail and idempotency.
create table payment_webhook_events (
  id bigint primary key generated always as identity,
  provider text not null default 'razorpay',
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  donation_id bigint references donations on delete set null,
  received_at timestamptz not null default now(),
  unique (provider, event_id)
);
alter table payment_webhook_events enable row level security;

-- Projects (programs and initiatives).
create table projects (
  id bigint primary key generated always as identity,
  name text not null,
  area text,
  location text,
  description text,
  status text not null default 'ongoing' check (status in ('planned', 'ongoing', 'completed')),
  beneficiaries integer not null default 0 check (beneficiaries >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table projects enable row level security;
create index ix_projects_published on projects (published, created_at desc);

-- Events (fundraising drives, activations).
create table events (
  id bigint primary key generated always as identity,
  title text not null,
  event_date date not null,
  event_time time,
  place text,
  description text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table events enable row level security;
create index ix_events_published on events (published, event_date);

-- Event images: one-to-many, ordered.
create table event_images (
  id bigint primary key generated always as identity,
  event_id bigint not null references events on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
alter table event_images enable row level security;
create index ix_event_images_event on event_images (event_id, position);

-- Site statistics (beneficiaries, years in operation, etc.).
create table site_stats (
  id bigint primary key generated always as identity,
  label text not null,
  value integer not null,
  suffix text,
  plain boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table site_stats enable row level security;

-- Document requests: certificates, audit reports, etc.
create table document_requests (
  id bigint primary key generated always as identity,
  reference text not null unique check (reference ~ '^REQ-[0-9]{4}-[A-Z0-9]{6}$'),
  request_type text not null check (request_type in ('Certificate', 'Audit report')),
  document_type text not null,
  financial_year text,
  delivery text not null default 'PDF by email',
  delivery_address text,
  name text not null,
  organisation text,
  email text not null,
  phone text not null,
  purpose text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'sent', 'completed')),
  admin_message text,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table document_requests enable row level security;
create index ix_document_requests_status on document_requests (status, created_at desc);
create index ix_document_requests_email on document_requests (lower(email));

-- Attachments for document requests.
create table request_attachments (
  id bigint primary key generated always as identity,
  request_id bigint not null references document_requests on delete cascade,
  filename text not null,
  storage_path text not null,
  mime text,
  size_bytes integer check (size_bytes >= 0),
  uploaded_at timestamptz not null default now()
);
alter table request_attachments enable row level security;
create index ix_request_attachments_request on request_attachments (request_id);

-- Volunteer sign-ups.
create table volunteers (
  id bigint primary key generated always as identity,
  name text not null,
  phone text not null,
  email text,
  area text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table volunteers enable row level security;
create index ix_volunteers_status on volunteers (status);
create index ix_volunteers_email on volunteers (lower(email)) where email is not null;

-- Form submissions: contact, CSR, newsletter, event registration.
create table form_submissions (
  id bigint primary key generated always as identity,
  kind text not null check (kind in ('contact', 'csr', 'newsletter', 'event_registration')),
  event_id bigint references events on delete set null,
  name text,
  email text,
  phone text,
  organisation text,
  message text,
  data jsonb not null default '{}',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table form_submissions enable row level security;
create index ix_form_submissions_kind_status on form_submissions (kind, status, created_at desc);
create index ix_form_submissions_email on form_submissions (lower(email)) where email is not null;

-- Broadcasts: emails sent to volunteers and/or donors.
create table broadcasts (
  id bigint primary key generated always as identity,
  admin_id uuid references admin_profiles on delete set null,
  audience text not null check (audience in ('volunteers', 'donors', 'all')),
  subject text not null,
  body text not null,
  recipients integer not null default 0,
  failed integer not null default 0,
  created_at timestamptz not null default now()
);
alter table broadcasts enable row level security;
create index ix_broadcasts_created on broadcasts (created_at desc);

-- Activity log: audit trail of admin actions.
create table activity_log (
  id bigint primary key generated always as identity,
  admin_id uuid references admin_profiles on delete set null,
  admin_label text,
  action text not null,
  entity text,
  entity_id text,
  summary text not null,
  created_at timestamptz not null default now()
);
alter table activity_log enable row level security;
create index ix_activity_log_created on activity_log (created_at desc);
create index ix_activity_log_entity on activity_log (entity, entity_id);

-- Rate limiting: in-database limiter for public endpoints.
create table rate_limit_hits (
  id bigint primary key generated always as identity,
  bucket text not null,
  key text not null,
  hit_at timestamptz not null default now()
);
alter table rate_limit_hits enable row level security;
create index ix_rate_limit_hits on rate_limit_hits (bucket, key, hit_at desc);

-- ===== TRIGGERS FOR UPDATED_AT =====

create trigger tr_donors_updated_at before update on donors for each row execute function set_updated_at();
create trigger tr_campaigns_updated_at before update on campaigns for each row execute function set_updated_at();
create trigger tr_donations_updated_at before update on donations for each row execute function set_updated_at();
create trigger tr_projects_updated_at before update on projects for each row execute function set_updated_at();
create trigger tr_events_updated_at before update on events for each row execute function set_updated_at();
create trigger tr_volunteers_updated_at before update on volunteers for each row execute function set_updated_at();
create trigger tr_document_requests_updated_at before update on document_requests for each row execute function set_updated_at();
create trigger tr_form_submissions_updated_at before update on form_submissions for each row execute function set_updated_at();
create trigger tr_site_stats_updated_at before update on site_stats for each row execute function set_updated_at();

-- ===== VIEWS FOR PUBLIC SITE =====

create or replace view v_public_events as
  select
    e.id, e.title, e.event_date, e.event_time, e.place, e.description,
    array_agg(json_build_object('id', ei.id, 'path', ei.storage_path) order by ei.position) filter (where ei.id is not null) as images
  from events e
  left join event_images ei on e.id = ei.event_id
  where e.published = true
  group by e.id, e.title, e.event_date, e.event_time, e.place, e.description
  order by e.event_date asc;

create or replace view v_public_projects as
  select id, name, area, location, description, status, beneficiaries
  from projects
  where published = true
  order by created_at desc;

create or replace view v_campaign_progress as
  select
    c.id, c.slug, c.title, c.description, c.cause, c.goal_amount,
    c.raised_offset + coalesce(sum(d.amount) filter (where d.status = 'success'), 0) as raised,
    round((c.raised_offset + coalesce(sum(d.amount) filter (where d.status = 'success'), 0)) / c.goal_amount * 100, 1) as percent
  from campaigns c
  left join donations d on c.id = d.campaign_id
  where c.published = true
  group by c.id, c.slug, c.title, c.description, c.cause, c.goal_amount, c.raised_offset
  order by c.sort_order, c.created_at;

create or replace view v_leads as
  select 'volunteer' as source, id, name, email, phone, status, created_at
  from volunteers
  union all
  select 'document_request', id, name, email, phone, status, created_at
  from document_requests
  union all
  select 'form_submission', id, name, email, phone, status, created_at
  from form_submissions;

create or replace view v_dashboard_kpis as
  select
    (select count(*) from donations where status = 'success' and date_trunc('month', donated_at) = date_trunc('month', now())) as donations_this_month,
    (select sum(amount) from donations where status = 'success' and date_trunc('month', donated_at) = date_trunc('month', now())) as amount_this_month,
    (select count(*) from donations where status = 'success' and date_trunc('year', donated_at) = date_trunc('year', now())) as donations_this_year,
    (select sum(amount) from donations where status = 'success' and date_trunc('year', donated_at) = date_trunc('year', now())) as amount_this_year,
    (select count(*) from document_requests where status = 'new') as pending_requests,
    (select count(*) from volunteers where status = 'pending') as pending_volunteers;

create or replace view v_donations_monthly as
  select
    date_trunc('month', donated_at)::date as month,
    status,
    count(*) as count,
    sum(amount) as total
  from donations
  group by date_trunc('month', donated_at), status
  order by month desc;

-- ===== ROW LEVEL SECURITY (RLS) POLICIES =====

-- admin_profiles: admins can read their own, only super-admin can edit.
create policy "Admins can read admin_profiles"
  on admin_profiles for select
  using (id = auth.uid() or is_admin());

create policy "Only super-admin can update admin_profiles"
  on admin_profiles for update
  using (is_admin());

-- donors: admins only.
create policy "Admins can read donors"
  on donors for select
  using (is_admin());

create policy "Admins can insert donors"
  on donors for insert
  with check (is_admin());

create policy "Admins can update donors"
  on donors for update
  using (is_admin());

create policy "Admins can delete donors"
  on donors for delete
  using (is_admin());

-- donations: admins read all, the Razorpay webhook upserts with service role.
create policy "Admins can read donations"
  on donations for select
  using (is_admin());

create policy "Admins can update donations"
  on donations for update
  using (is_admin());

-- campaigns: public reads published, admins read all and write.
create policy "Public can read published campaigns"
  on campaigns for select
  using (published = true);

create policy "Admins can read all campaigns"
  on campaigns for select
  using (is_admin());

create policy "Admins can insert campaigns"
  on campaigns for insert
  with check (is_admin());

create policy "Admins can update campaigns"
  on campaigns for update
  using (is_admin());

create policy "Admins can delete campaigns"
  on campaigns for delete
  using (is_admin());

-- projects: public reads published, admins read all and write.
create policy "Public can read published projects"
  on projects for select
  using (published = true);

create policy "Admins can read all projects"
  on projects for select
  using (is_admin());

create policy "Admins can insert projects"
  on projects for insert
  with check (is_admin());

create policy "Admins can update projects"
  on projects for update
  using (is_admin());

create policy "Admins can delete projects"
  on projects for delete
  using (is_admin());

-- events: public reads published, admins read all and write.
create policy "Public can read published events"
  on events for select
  using (published = true);

create policy "Admins can read all events"
  on events for select
  using (is_admin());

create policy "Admins can insert events"
  on events for insert
  with check (is_admin());

create policy "Admins can update events"
  on events for update
  using (is_admin());

create policy "Admins can delete events"
  on events for delete
  using (is_admin());

-- event_images: public reads from published events, admins manage them.
create policy "Public can read images from published events"
  on event_images for select
  using (event_id in (select id from events where published = true));

create policy "Admins can manage event_images"
  on event_images for all
  using (is_admin());

-- site_stats: public reads, admins write.
create policy "Public can read site_stats"
  on site_stats for select
  using (true);

create policy "Admins can manage site_stats"
  on site_stats for all
  using (is_admin());

-- document_requests: public can insert (via function), admins can read and update.
create policy "Admins can read document_requests"
  on document_requests for select
  using (is_admin());

create policy "Admins can update document_requests"
  on document_requests for update
  using (is_admin());

-- request_attachments: admins only.
create policy "Admins can manage request_attachments"
  on request_attachments for all
  using (is_admin());

-- volunteers: public can insert (via function), admins can read and update.
create policy "Admins can read volunteers"
  on volunteers for select
  using (is_admin());

create policy "Admins can update volunteers"
  on volunteers for update
  using (is_admin());

-- form_submissions: public can insert (via function), admins can read and update.
create policy "Admins can read form_submissions"
  on form_submissions for select
  using (is_admin());

create policy "Admins can update form_submissions"
  on form_submissions for update
  using (is_admin());

-- broadcasts: admins only.
create policy "Admins can read broadcasts"
  on broadcasts for select
  using (is_admin());

create policy "Admins can insert broadcasts"
  on broadcasts for insert
  with check (is_admin());

-- activity_log: admins read only, writes come from the server only.
create policy "Admins can read activity_log"
  on activity_log for select
  using (is_admin());

-- rate_limit_hits: service role only.
create policy "Block all access to rate_limit_hits"
  on rate_limit_hits for all
  using (false);

-- payment_webhook_events: service role only.
create policy "Block all access to payment_webhook_events"
  on payment_webhook_events for all
  using (false);

-- ===== GRANTS (schema access) =====

grant usage on schema public to authenticated;
grant all privileges on all tables in schema public to authenticated;
grant all privileges on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

grant usage on schema public to anon;
grant select on public.v_public_events to anon;
grant select on public.v_public_projects to anon;
grant select on public.v_campaign_progress to anon;
grant select on public.site_stats to anon;
grant select on public.campaigns to anon;
grant select on public.projects to anon;
grant select on public.events to anon;
grant select on public.event_images to anon;

-- ===== SAMPLE DATA (for testing; delete before production) =====

-- One test campaign
insert into campaigns (slug, title, description, cause, goal_amount, raised_offset, published, sort_order)
values ('test-campaign', 'Test Campaign', 'A test campaign for development', 'Testing', 100000, 0, false, 0);

-- One test project
insert into projects (name, area, location, description, status, beneficiaries, published)
values ('Test Project', 'Testing', 'Test Location', 'A test project', 'ongoing', 100, true);

-- Sample stats
insert into site_stats (label, value, suffix, plain, sort_order)
values
  ('Direct & indirect beneficiaries', 25000, '+', false, 0),
  ('Children in education programmes', 3000, '+', false, 1),
  ('Patients supported', 2000, '+ patients', false, 2),
  ('Women in SHGs & livelihoods', 1500, '+', false, 3),
  ('Environment participants', 5000, '+', false, 4),
  ('Working since', 2004, null, true, 5);

-- ===== NOTES FOR DEPLOYMENT =====
-- 1. After running this migration, create at least one admin user in Supabase Auth (email/password).
-- 2. Then insert a row into admin_profiles with that user''s auth.uid() and the role ''admin''.
-- 3. Delete the sample data above before going to production.
-- 4. Ensure Supabase Auth is configured with:
--    - Email/password provider enabled
--    - Public sign-ups disabled
--    - Email confirmation enabled
--    - Appropriate Site URL and Redirect URLs
-- 5. Enable PITR (point-in-time recovery) for financial data backups.
-- 6. Set up monitoring on donations and activity_log tables.
