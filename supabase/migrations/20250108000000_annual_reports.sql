-- Annual Reports (website: Transparency & Reports -> Annual Reports). One box per financial year;
-- the admin panel sets each box's title, description and PDF, and can add further years.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists annual_reports (
  id bigint primary key generated always as identity,
  -- financial year as shown on the box, e.g. 2004-05
  fy text not null unique check (fy ~ '^[0-9]{4}-[0-9]{2}$'),
  title text not null default '' check (length(title) <= 160),
  description text not null default '' check (length(description) <= 400),
  -- where the PDF is: a file of the website itself (/documents/...) or an https link (e.g. the storage bucket below). Null = not uploaded yet.
  file_url text check (file_url is null or (length(file_url) <= 600 and file_url ~ '^(/|https://)')),
  -- set when the PDF was uploaded from the admin panel, so the old file can be removed when it is replaced
  storage_path text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table annual_reports enable row level security;

drop trigger if exists tr_annual_reports_updated_at on annual_reports;
create trigger tr_annual_reports_updated_at before update on annual_reports for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published years only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published annual_reports" on annual_reports;
create policy "Public can read published annual_reports"
  on annual_reports for select
  using (published = true);

drop policy if exists "Admins can read all annual_reports" on annual_reports;
create policy "Admins can read all annual_reports"
  on annual_reports for select
  using (is_admin());

drop policy if exists "Admins can insert annual_reports" on annual_reports;
create policy "Admins can insert annual_reports"
  on annual_reports for insert
  with check (is_admin());

drop policy if exists "Admins can update annual_reports" on annual_reports;
create policy "Admins can update annual_reports"
  on annual_reports for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete annual_reports" on annual_reports;
create policy "Admins can delete annual_reports"
  on annual_reports for delete
  using (is_admin());

revoke all on annual_reports from public, anon, authenticated;
grant select on annual_reports to anon;
grant select, insert, delete on annual_reports to authenticated;
grant update (fy, title, description, file_url, storage_path, published) on annual_reports to authenticated;

-- ===== STORAGE: PDFs uploaded from the admin panel =====
-- Public bucket (the reports are published documents), PDF only, up to 20 MB each. Only admins upload, replace or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('annual-reports', 'annual-reports', true, 20971520, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Public can read annual report files" on storage.objects;
create policy "Public can read annual report files"
  on storage.objects for select
  using (bucket_id = 'annual-reports');

drop policy if exists "Admins can upload annual report files" on storage.objects;
create policy "Admins can upload annual report files"
  on storage.objects for insert
  with check (bucket_id = 'annual-reports' and is_admin());

drop policy if exists "Admins can delete annual report files" on storage.objects;
create policy "Admins can delete annual report files"
  on storage.objects for delete
  using (bucket_id = 'annual-reports' and is_admin());

-- ===== THE YEARS =====
-- One box for every financial year from 2004-05 to 2025-26. The six reports that ship with the website
-- (public/documents/annual-reports/) are linked; the other years stay empty until a PDF is added in the admin panel.

insert into annual_reports (fy, title, file_url)
select y.fy, 'Annual Report ' || y.fy,
  case when y.fy in ('2007-08', '2009-10', '2010-11', '2011-12', '2012-13', '2019-20') then '/documents/annual-reports/annual-report-' || y.fy || '.pdf' end
from (select g::text || '-' || lpad(((g + 1) % 100)::text, 2, '0') as fy from generate_series(2004, 2025) g) y
on conflict (fy) do nothing;
