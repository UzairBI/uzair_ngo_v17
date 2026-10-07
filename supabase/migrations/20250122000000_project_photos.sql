-- Project photos (admin Projects -> Add / Edit project): one photo per project, shown on its card on the website
-- Projects page ("Upcoming & New Projects"). Run this in Supabase SQL Editor (safe to run more than once).

-- where the photo is: an https link to the storage bucket below, and its path in the bucket. Null = no photo.
alter table projects add column if not exists image_url text;
alter table projects add column if not exists storage_path text;

-- ===== STORAGE: photos uploaded from the admin panel =====
-- Public bucket (the photos are published), images only, up to 8 MB each. Only admins upload or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-photos', 'project-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read project photos" on storage.objects;
create policy "Public can read project photos"
  on storage.objects for select
  using (bucket_id = 'project-photos');

drop policy if exists "Admins can upload project photos" on storage.objects;
create policy "Admins can upload project photos"
  on storage.objects for insert
  with check (bucket_id = 'project-photos' and is_admin());

drop policy if exists "Admins can delete project photos" on storage.objects;
create policy "Admins can delete project photos"
  on storage.objects for delete
  using (bucket_id = 'project-photos' and is_admin());
