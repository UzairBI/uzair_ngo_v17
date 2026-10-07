-- Video Gallery: lets an admin choose which video is the large tile on the website (Media & Gallery -> Videos).
-- Run this in Supabase SQL Editor after 20250107000000_gallery_video_description.sql (safe to run more than once).

-- true on at most one video (the admin panel clears the others when one is chosen). None chosen = the first video is the large one.
alter table gallery_videos add column if not exists featured boolean not null default false;

-- admins may change it (updates are granted column by column)
grant update (featured) on gallery_videos to authenticated;
