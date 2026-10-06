-- Newsletter subscribers: the "Field Updates Newsletter" form in the website footer.
-- Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).
--
-- Design (same as 20250103000000_public_form_submissions.sql): anon never gets table access.
-- The website calls one narrow SECURITY DEFINER function that validates the email, rate-limits,
-- and inserts / reactivates exactly one row. Reading and status changes are admin-only (RLS).

-- ===== TABLE =====

create table if not exists newsletter_subscribers (
  id bigint primary key generated always as identity,
  -- always stored trimmed + lower-case, so the unique constraint catches "A@x.com" vs "a@x.com"
  email text not null unique check (email = lower(email) and length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  source text not null default 'website-footer',
  subscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;
create index if not exists ix_newsletter_subscribers_status on newsletter_subscribers (status, subscribed_at desc);

drop trigger if exists tr_newsletter_subscribers_updated_at on newsletter_subscribers;
create trigger tr_newsletter_subscribers_updated_at before update on newsletter_subscribers for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====

-- Admins read the list and change a subscriber's status. Nobody inserts or deletes directly:
-- rows are created by subscribe_newsletter() below and are kept (as "unsubscribed") rather than deleted.
drop policy if exists "Admins can read newsletter_subscribers" on newsletter_subscribers;
create policy "Admins can read newsletter_subscribers"
  on newsletter_subscribers for select
  using (is_admin());

drop policy if exists "Admins can update newsletter_subscribers" on newsletter_subscribers;
create policy "Admins can update newsletter_subscribers"
  on newsletter_subscribers for update
  using (is_admin())
  with check (is_admin());

-- Supabase grants new tables to anon / authenticated by default: take that away, then give
-- signed-in users only what the admin panel needs (RLS above still limits it to active admins).
revoke all on newsletter_subscribers from public, anon, authenticated;
grant select on newsletter_subscribers to authenticated;
grant update (status) on newsletter_subscribers to authenticated;

-- ===== PUBLIC SUBSCRIBE FUNCTION =====

-- Returns one of: 'subscribed' | 'resubscribed' | 'already' | 'invalid' | 'rate_limited'.
-- It returns a status instead of raising, so the visitor never sees a database error
-- (and so the rate-limit hit is kept: a raised exception would roll it back).
create or replace function public.subscribe_newsletter(p_email text, p_source text default 'website-footer')
returns text as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_source text := lower(trim(coalesce(p_source, '')));
  v_headers json;
  v_ip text;
  v_id bigint;
begin
  if length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return 'invalid'; end if;
  if v_source !~ '^[a-z0-9-]{1,40}$' then v_source := 'website-footer'; end if;

  -- Rate limit (rate_limit_hits): 5 attempts per visitor address in 10 minutes, 300 in total per hour.
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then v_headers := null;
  end;
  v_ip := coalesce(nullif(trim(v_headers ->> 'cf-connecting-ip'), ''), nullif(trim(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
  delete from rate_limit_hits where bucket = 'newsletter' and hit_at < now() - interval '1 day';
  if (select count(*) from rate_limit_hits where bucket = 'newsletter' and key = v_ip and hit_at > now() - interval '10 minutes') >= 5
    or (select count(*) from rate_limit_hits where bucket = 'newsletter' and hit_at > now() - interval '1 hour') >= 300 then
    return 'rate_limited';
  end if;
  insert into rate_limit_hits (bucket, key) values ('newsletter', left(v_ip, 64));

  insert into newsletter_subscribers (email, source) values (v_email, v_source)
  on conflict (email) do nothing
  returning id into v_id;
  if v_id is not null then return 'subscribed'; end if;

  -- the email is already there: switch it back on if it had been unsubscribed, never add a second row
  update newsletter_subscribers set status = 'active', subscribed_at = now(), source = v_source
  where email = v_email and status = 'unsubscribed';
  if found then return 'resubscribed'; end if;
  return 'already';
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.subscribe_newsletter(text, text) from public;
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;

-- ===== BACKFILL =====

-- Earlier footer sign-ups were stored as generic form submissions: copy each email once.
insert into newsletter_subscribers (email, source, subscribed_at, created_at)
select lower(trim(email)), 'website-footer', min(created_at), min(created_at)
from form_submissions
where kind = 'newsletter' and email is not null
  and length(trim(email)) <= 254 and lower(trim(email)) ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
group by lower(trim(email))
on conflict (email) do nothing;
