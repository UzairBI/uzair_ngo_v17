-- events.event_time was defined as `time` (a single clock time), but the admin UI and public
-- display always treat it as a free-text string (e.g. "10:00 AM - 2:00 PM"). A strict `time`
-- column rejects both that format and an empty string from an optional field left blank.
--
-- v_public_events depends on this column, so it must be dropped before the ALTER and recreated after.

drop view if exists v_public_events;

alter table events alter column event_time type text using event_time::text;

create view v_public_events with (security_invoker = true) as
  select
    e.id, e.title, e.event_date, e.event_time, e.place, e.description,
    array_agg(json_build_object('id', ei.id, 'path', ei.storage_path) order by ei.position)
      filter (where ei.id is not null) as images
  from events e
  left join event_images ei on e.id = ei.event_id
  where e.published = true
  group by e.id, e.title, e.event_date, e.event_time, e.place, e.description
  order by e.event_date asc;
