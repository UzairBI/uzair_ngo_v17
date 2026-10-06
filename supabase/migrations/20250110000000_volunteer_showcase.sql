-- Volunteers on the website (About Us -> Our Volunteers, below the Management Team).
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).
--
-- The volunteers table holds phone numbers, emails and messages, so visitors never read it. They read a narrow
-- view with only the name, area of interest and photo of volunteers who are ACTIVE and ticked "Show on website".

alter table volunteers add column if not exists show_on_website boolean not null default false;
alter table volunteers add column if not exists photo_path text;

create or replace view v_public_volunteers as
  select id, name, area, photo_path
  from volunteers
  where status = 'active' and show_on_website = true
  order by created_at, id;
revoke all on v_public_volunteers from public, anon, authenticated;
grant select on v_public_volunteers to anon, authenticated;

-- ===== STORAGE: volunteer photos uploaded from the admin panel =====
-- Public bucket, images only, up to 5 MB each. Only admins upload or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('volunteer-photos', 'volunteer-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read volunteer photos" on storage.objects;
create policy "Public can read volunteer photos"
  on storage.objects for select
  using (bucket_id = 'volunteer-photos');

drop policy if exists "Admins can upload volunteer photos" on storage.objects;
create policy "Admins can upload volunteer photos"
  on storage.objects for insert
  with check (bucket_id = 'volunteer-photos' and is_admin());

drop policy if exists "Admins can delete volunteer photos" on storage.objects;
create policy "Admins can delete volunteer photos"
  on storage.objects for delete
  using (bucket_id = 'volunteer-photos' and is_admin());
