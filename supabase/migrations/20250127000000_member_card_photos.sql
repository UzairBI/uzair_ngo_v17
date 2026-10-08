-- Member ID cards: the applicant's photo is now sent with the application, so an admin sees it when reviewing and an
-- issued card can be downloaded (with its photo) from the admin panel and from the public list of issued cards.
-- Run this in Supabase SQL Editor after 20250126000000_member_cards.sql (safe to run more than once).

-- file name of the photo in the storage bucket below; empty for applications sent before photos were stored
alter table member_cards add column if not exists photo_path text;
alter table member_cards drop constraint if exists member_cards_photo_path_check;
alter table member_cards add constraint member_cards_photo_path_check check (photo_path is null or photo_path ~ '^[0-9a-f-]{36}\.jpg$');

-- ===== STORAGE: applicants' photos =====
-- The website shrinks each photo to a small JPEG before sending it. File names are random, so a photo can only be opened
-- by someone who was given its name: the admins, and (for approved cards) the public list of issued cards.
-- Visitors can add a photo but cannot list, replace or delete any; admins can list and delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', true, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "Anyone can add a member photo" on storage.objects;
create policy "Anyone can add a member photo"
  on storage.objects for insert
  with check (bucket_id = 'member-photos' and name ~ '^[0-9a-f-]{36}\.jpg$');

drop policy if exists "Admins can read member photos" on storage.objects;
create policy "Admins can read member photos"
  on storage.objects for select
  using (bucket_id = 'member-photos' and is_admin());

drop policy if exists "Admins can delete member photos" on storage.objects;
create policy "Admins can delete member photos"
  on storage.objects for delete
  using (bucket_id = 'member-photos' and is_admin());

-- ===== WEBSITE: HAS THIS PHONE NUMBER APPLIED, AND WAS IT APPROVED? =====
-- Asked first by the form on /member-id, so a photo is only sent when there is an application to attach it to.
--   none      no application with this phone number
--   pending / rejected
--   approved  with the card number, the details as approved and the photo's file name: the page draws the card

create or replace function public.member_card_status(p_phone text)
returns jsonb as $$
declare
  v_key text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_row member_cards;
begin
  if length(v_key) <> 10 then return jsonb_build_object('status', 'invalid'); end if;
  select * into v_row from member_cards where phone_key = v_key;
  if not found then return jsonb_build_object('status', 'none'); end if;
  if v_row.status = 'approved' then
    return jsonb_build_object('status', 'approved', 'card_id', v_row.card_id, 'full_name', v_row.full_name, 'role', v_row.role,
      'blood_group', v_row.blood_group, 'valid_till', v_row.valid_till, 'photo_path', v_row.photo_path);
  end if;
  return jsonb_build_object('status', v_row.status);
end;
$$ language plpgsql stable security definer set search_path = public;
grant execute on function public.member_card_status(text) to anon, authenticated;

-- ===== WEBSITE: APPLY (now with the photo) =====
-- Same answers as before. The earlier version without p_photo is replaced, so there is only one function of this name.

drop function if exists public.issue_member_card(text, text, text, text, date);
create or replace function public.issue_member_card(p_name text, p_role text, p_phone text, p_blood text default null, p_valid date default null, p_photo text default null)
returns jsonb as $$
declare
  v_key text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_name text := trim(coalesce(p_name, ''));
  v_role text := trim(coalesce(p_role, ''));
  v_blood text := nullif(trim(coalesce(p_blood, '')), '');
  v_photo text := case when p_photo ~ '^[0-9a-f-]{36}\.jpg$' then p_photo end;
  v_row member_cards;
begin
  if length(v_key) <> 10 or length(v_name) not between 1 and 60 or length(v_role) not between 1 and 40 or length(trim(p_phone)) > 20 then
    return jsonb_build_object('status', 'invalid');
  end if;
  if v_blood is not null and v_blood not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then v_blood := null; end if;

  select * into v_row from member_cards where phone_key = v_key;
  if found then
    if v_row.status = 'approved' then
      return jsonb_build_object('status', 'approved', 'card_id', v_row.card_id, 'full_name', v_row.full_name, 'role', v_row.role,
        'blood_group', v_row.blood_group, 'valid_till', v_row.valid_till, 'photo_path', v_row.photo_path);
    elsif v_row.status = 'rejected' then
      return jsonb_build_object('status', 'rejected');
    end if;
    -- still waiting: the applicant may correct what they sent (a new photo replaces the earlier one)
    update member_cards set full_name = v_name, role = v_role, blood_group = v_blood, valid_till = p_valid, photo_path = coalesce(v_photo, photo_path) where id = v_row.id;
    return jsonb_build_object('status', 'pending');
  end if;

  if (select count(*) from member_cards where created_at > now() - interval '10 minutes') >= 30 then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  insert into member_cards (full_name, role, phone, phone_key, blood_group, valid_till, photo_path) values (v_name, v_role, trim(p_phone), v_key, v_blood, p_valid, v_photo);
  return jsonb_build_object('status', 'pending', 'new', true);
end;
$$ language plpgsql security definer set search_path = public;
grant execute on function public.issue_member_card(text, text, text, text, date, text) to anon, authenticated;

-- ===== WEBSITE: THE PUBLIC LIST OF ISSUED CARDS (now with the photo's file name, for the download) =====
-- Still approved cards only, and never the phone number or blood group.

drop function if exists public.list_member_cards(text, integer);
create or replace function public.list_member_cards(p_search text default '', p_limit integer default 60)
returns table (card_id text, full_name text, role text, valid_till date, issued_at timestamptz, photo_path text) as $$
  select m.card_id, m.full_name, m.role, m.valid_till, m.issued_at, m.photo_path
  from member_cards m
  where m.status = 'approved'
    and (trim(coalesce(p_search, '')) = ''
      or m.full_name ilike '%' || replace(replace(trim(p_search), '%', '\%'), '_', '\_') || '%'
      or m.card_id ilike '%' || replace(replace(trim(p_search), '%', '\%'), '_', '\_') || '%')
  order by m.issued_at desc
  limit least(greatest(coalesce(p_limit, 60), 1), 100);
$$ language sql stable security definer set search_path = public;
grant execute on function public.list_member_cards(text, integer) to anon, authenticated;
