-- Admin users: a profile photo and the sign-in email on each admin, so admins can be added and listed from the admin panel.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

alter table admin_profiles add column if not exists photo_path text;
alter table admin_profiles add column if not exists email text;

-- ===== STORAGE: admin photos =====
-- Public bucket, images only, up to 5 MB each. Only admins upload or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-photos', 'admin-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read admin photos" on storage.objects;
create policy "Public can read admin photos"
  on storage.objects for select
  using (bucket_id = 'admin-photos');

drop policy if exists "Admins can upload admin photos" on storage.objects;
create policy "Admins can upload admin photos"
  on storage.objects for insert
  with check (bucket_id = 'admin-photos' and is_admin());

drop policy if exists "Admins can delete admin photos" on storage.objects;
create policy "Admins can delete admin photos"
  on storage.objects for delete
  using (bucket_id = 'admin-photos' and is_admin());
