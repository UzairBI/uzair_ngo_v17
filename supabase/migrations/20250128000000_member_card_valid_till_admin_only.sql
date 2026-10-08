-- Member ID cards: "valid till" is set only by an admin (when approving, in the admin panel). The website form no longer
-- asks for it, and this function no longer stores a date sent from the website (p_valid is kept only so that an older
-- copy of the page still gets an answer). The date of application is created_at, as before.
-- Run this in Supabase SQL Editor after 20250127000000_member_card_photos.sql (safe to run more than once).

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
    -- still waiting: the applicant may correct what they sent (a new photo replaces the earlier one); valid_till is left alone
    update member_cards set full_name = v_name, role = v_role, blood_group = v_blood, photo_path = coalesce(v_photo, photo_path) where id = v_row.id;
    return jsonb_build_object('status', 'pending');
  end if;

  if (select count(*) from member_cards where created_at > now() - interval '10 minutes') >= 30 then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  insert into member_cards (full_name, role, phone, phone_key, blood_group, photo_path) values (v_name, v_role, trim(p_phone), v_key, v_blood, v_photo);
  return jsonb_build_object('status', 'pending', 'new', true);
end;
$$ language plpgsql security definer set search_path = public;
grant execute on function public.issue_member_card(text, text, text, text, date, text) to anon, authenticated;
