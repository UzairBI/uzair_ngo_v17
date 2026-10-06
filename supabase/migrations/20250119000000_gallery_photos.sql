-- Photo Gallery (website: Media & Gallery -> Photo Gallery). Photos added in the admin panel (Media & Gallery -> Photos)
-- are shown before the photos that ship with the website. Run this in Supabase SQL Editor after the earlier migrations
-- (safe to run more than once).

create table if not exists gallery_photos (
  id bigint primary key generated always as identity,
  -- where the photo is: the storage bucket below (https link)
  image_url text not null check (length(image_url) <= 600 and image_url ~ '^https://'),
  -- set when the photo was uploaded from the admin panel, so the file is removed with the row
  storage_path text,
  -- shown under the photo and read out by screen readers
  caption text not null default '' check (length(caption) <= 300),
  -- the filter button the photo appears under (Education, Health, ...)
  category text not null default 'Community' check (length(trim(category)) between 1 and 60),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table gallery_photos enable row level security;
create index if not exists ix_gallery_photos_created on gallery_photos (created_at desc, id desc);

drop trigger if exists tr_gallery_photos_updated_at on gallery_photos;
create trigger tr_gallery_photos_updated_at before update on gallery_photos for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published photos only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published gallery photos" on gallery_photos;
create policy "Public can read published gallery photos"
  on gallery_photos for select
  using (published = true);

drop policy if exists "Admins can read all gallery photos" on gallery_photos;
create policy "Admins can read all gallery photos"
  on gallery_photos for select
  using (is_admin());

drop policy if exists "Admins can insert gallery photos" on gallery_photos;
create policy "Admins can insert gallery photos"
  on gallery_photos for insert
  with check (is_admin());

drop policy if exists "Admins can update gallery photos" on gallery_photos;
create policy "Admins can update gallery photos"
  on gallery_photos for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete gallery photos" on gallery_photos;
create policy "Admins can delete gallery photos"
  on gallery_photos for delete
  using (is_admin());

revoke all on gallery_photos from public, anon, authenticated;
grant select on gallery_photos to anon;
grant select, insert, delete on gallery_photos to authenticated;
grant update (caption, category, published) on gallery_photos to authenticated;

-- ===== STORAGE: photos uploaded from the admin panel =====
-- Public bucket (the photos are published), images only, up to 8 MB each. Only admins upload or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-photos', 'gallery-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read gallery photo files" on storage.objects;
create policy "Public can read gallery photo files"
  on storage.objects for select
  using (bucket_id = 'gallery-photos');

drop policy if exists "Admins can upload gallery photo files" on storage.objects;
create policy "Admins can upload gallery photo files"
  on storage.objects for insert
  with check (bucket_id = 'gallery-photos' and is_admin());

drop policy if exists "Admins can delete gallery photo files" on storage.objects;
create policy "Admins can delete gallery photo files"
  on storage.objects for delete
  using (bucket_id = 'gallery-photos' and is_admin());
