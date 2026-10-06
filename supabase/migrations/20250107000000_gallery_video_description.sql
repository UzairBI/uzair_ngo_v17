-- Video Gallery: a short description shown under each video on the website (written in the admin panel).
-- Run this in Supabase SQL Editor after 20250106000000_gallery_videos.sql (safe to run more than once).

alter table gallery_videos add column if not exists description text not null default '' check (length(description) <= 600);

-- admins may edit it (updates are granted column by column)
grant update (description) on gallery_videos to authenticated;
