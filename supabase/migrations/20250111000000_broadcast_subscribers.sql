-- Broadcast: allow "newsletter subscribers" as an audience in the broadcast history.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

alter table broadcasts drop constraint if exists broadcasts_audience_check;
alter table broadcasts add constraint broadcasts_audience_check check (audience in ('volunteers', 'donors', 'subscribers', 'all'));
