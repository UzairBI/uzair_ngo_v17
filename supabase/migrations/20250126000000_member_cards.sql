-- Member ID cards (website: /member-id, admin panel: Member ID Cards).
-- A visitor applies with name, role and phone; the application waits as "pending" until an admin approves it.
-- Only an approved application gets a card number, and only then can the visitor generate and download the card.
-- The applicant's photo is never sent here: it stays on their device and is only drawn onto the card in their browser.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists member_cards (
  id bigint primary key generated always as identity,
  -- the number printed on the card, e.g. SJKS-2026-0007. Empty until the application is approved.
  card_id text unique,
  full_name text not null check (length(trim(full_name)) between 1 and 60),
  role text not null check (length(trim(role)) between 1 and 40),
  -- as the applicant typed it
  phone text not null check (length(phone) between 7 and 20),
  -- last 10 digits: one application per phone number, and what the applicant is recognised by when they come back
  phone_key text not null unique check (phone_key ~ '^\d{10}$'),
  blood_group text check (blood_group is null or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  valid_till date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- for the admins only, never shown on the website
  admin_note text not null default '' check (length(admin_note) <= 400),
  -- when the card number was given
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table member_cards enable row level security;
create index if not exists ix_member_cards_status on member_cards (status, created_at desc);
create sequence if not exists member_card_no;

drop trigger if exists tr_member_cards_updated_at on member_cards;
create trigger tr_member_cards_updated_at before update on member_cards for each row execute function set_updated_at();

-- The card number is given the first time an application becomes "approved" and never changes afterwards.
create or replace function public.member_card_issue() returns trigger as $$
begin
  if new.status = 'approved' and new.card_id is null then
    new.card_id := 'SJKS-' || extract(year from now())::int || '-' || lpad(nextval('member_card_no')::text, 4, '0');
    new.issued_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_member_cards_issue on member_cards;
create trigger tr_member_cards_issue before insert or update on member_cards for each row execute function member_card_issue();

-- ===== ROW LEVEL SECURITY =====
-- Visitors have no access to the table at all (they go through the two functions below). Admins read, review and delete.

drop policy if exists "Admins can read member cards" on member_cards;
create policy "Admins can read member cards"
  on member_cards for select
  using (is_admin());

drop policy if exists "Admins can update member cards" on member_cards;
create policy "Admins can update member cards"
  on member_cards for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete member cards" on member_cards;
create policy "Admins can delete member cards"
  on member_cards for delete
  using (is_admin());

revoke all on member_cards from public, anon, authenticated;
grant select, delete on member_cards to authenticated;
grant update (full_name, role, blood_group, valid_till, status, admin_note) on member_cards to authenticated;

-- ===== WEBSITE: APPLY, AND COLLECT THE CARD ONCE APPROVED =====
-- Called by the form on /member-id. The answer tells the page what to show:
--   pending   the application is saved (or was already waiting): no card yet
--   approved  the card number and the details as approved by the admin: the page draws the card
--   rejected  the application was not approved
--   invalid / rate_limited   nothing was saved

create or replace function public.issue_member_card(p_name text, p_role text, p_phone text, p_blood text default null, p_valid date default null)
returns jsonb as $$
declare
  v_key text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_name text := trim(coalesce(p_name, ''));
  v_role text := trim(coalesce(p_role, ''));
  v_blood text := nullif(trim(coalesce(p_blood, '')), '');
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
        'blood_group', v_row.blood_group, 'valid_till', v_row.valid_till);
    elsif v_row.status = 'rejected' then
      return jsonb_build_object('status', 'rejected');
    end if;
    -- still waiting: the applicant may correct what they sent
    update member_cards set full_name = v_name, role = v_role, blood_group = v_blood, valid_till = p_valid where id = v_row.id;
    return jsonb_build_object('status', 'pending');
  end if;

  if (select count(*) from member_cards where created_at > now() - interval '10 minutes') >= 30 then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  insert into member_cards (full_name, role, phone, phone_key, blood_group, valid_till) values (v_name, v_role, trim(p_phone), v_key, v_blood, p_valid);
  return jsonb_build_object('status', 'pending', 'new', true);
end;
$$ language plpgsql security definer set search_path = public;
grant execute on function public.issue_member_card(text, text, text, text, date) to anon, authenticated;

-- ===== WEBSITE: THE PUBLIC LIST OF ISSUED CARDS =====
-- Approved cards only, and only name, role and card number: phone and blood group never leave the database.

create or replace function public.list_member_cards(p_search text default '', p_limit integer default 60)
returns table (card_id text, full_name text, role text, valid_till date, issued_at timestamptz) as $$
  select m.card_id, m.full_name, m.role, m.valid_till, m.issued_at
  from member_cards m
  where m.status = 'approved'
    and (trim(coalesce(p_search, '')) = ''
      or m.full_name ilike '%' || replace(replace(trim(p_search), '%', '\%'), '_', '\_') || '%'
      or m.card_id ilike '%' || replace(replace(trim(p_search), '%', '\%'), '_', '\_') || '%')
  order by m.issued_at desc
  limit least(greatest(coalesce(p_limit, 60), 1), 100);
$$ language sql stable security definer set search_path = public;
grant execute on function public.list_member_cards(text, integer) to anon, authenticated;
