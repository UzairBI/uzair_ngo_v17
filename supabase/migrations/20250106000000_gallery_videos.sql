-- Video Gallery (website: Media & Gallery -> Video Gallery). The admin panel adds, edits and removes YouTube videos here.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists gallery_videos (
  id bigint primary key generated always as identity,
  -- the 11-character id from a YouTube link (https://www.youtube.com/watch?v=THIS_PART)
  youtube_id text not null unique check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null default '' check (length(title) <= 160),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table gallery_videos enable row level security;
-- the website lists videos oldest first, so a newly added video appears to the right of the earlier ones
create index if not exists ix_gallery_videos_order on gallery_videos (created_at, id);

drop trigger if exists tr_gallery_videos_updated_at on gallery_videos;
create trigger tr_gallery_videos_updated_at before update on gallery_videos for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published videos only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published gallery_videos" on gallery_videos;
create policy "Public can read published gallery_videos"
  on gallery_videos for select
  using (published = true);

drop policy if exists "Admins can read all gallery_videos" on gallery_videos;
create policy "Admins can read all gallery_videos"
  on gallery_videos for select
  using (is_admin());

drop policy if exists "Admins can insert gallery_videos" on gallery_videos;
create policy "Admins can insert gallery_videos"
  on gallery_videos for insert
  with check (is_admin());

drop policy if exists "Admins can update gallery_videos" on gallery_videos;
create policy "Admins can update gallery_videos"
  on gallery_videos for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete gallery_videos" on gallery_videos;
create policy "Admins can delete gallery_videos"
  on gallery_videos for delete
  using (is_admin());

revoke all on gallery_videos from public, anon, authenticated;
grant select on gallery_videos to anon;
grant select, insert, delete on gallery_videos to authenticated;
grant update (youtube_id, title, published) on gallery_videos to authenticated;

-- ===== FIRST VIDEO =====
-- The video the gallery was already showing, so it can now be edited or replaced from the admin panel.
insert into gallery_videos (youtube_id, title) values ('Y_tu4ItPaA0', 'Tata Mumbai Marathon 2027')
on conflict (youtube_id) do nothing;
