-- Messages in the scrolling "Live Impact" strip at the very top of the website.
-- The admin panel (Broadcast) adds and removes them. Run this in Supabase SQL Editor (safe to run more than once).

create table if not exists ticker_messages (
  id bigint primary key generated always as identity,
  message text not null check (length(trim(message)) between 1 and 160),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table ticker_messages enable row level security;
-- the website shows the newest message first
create index if not exists ix_ticker_messages_order on ticker_messages (created_at desc, id desc);

drop trigger if exists tr_ticker_messages_updated_at on ticker_messages;
create trigger tr_ticker_messages_updated_at before update on ticker_messages for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published messages only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published ticker_messages" on ticker_messages;
create policy "Public can read published ticker_messages"
  on ticker_messages for select
  using (published = true);

drop policy if exists "Admins can read all ticker_messages" on ticker_messages;
create policy "Admins can read all ticker_messages"
  on ticker_messages for select
  using (is_admin());

drop policy if exists "Admins can insert ticker_messages" on ticker_messages;
create policy "Admins can insert ticker_messages"
  on ticker_messages for insert
  with check (is_admin());

drop policy if exists "Admins can update ticker_messages" on ticker_messages;
create policy "Admins can update ticker_messages"
  on ticker_messages for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete ticker_messages" on ticker_messages;
create policy "Admins can delete ticker_messages"
  on ticker_messages for delete
  using (is_admin());

revoke all on ticker_messages from public, anon, authenticated;
grant select on ticker_messages to anon;
grant select, insert, delete on ticker_messages to authenticated;
grant update (message, published) on ticker_messages to authenticated;

-- ===== THE MESSAGES ALREADY ON THE WEBSITE =====
-- Added once (only while the table is empty), dated in the past so they keep their order and new messages come first.

insert into ticker_messages (message, created_at)
select m.message, now() - (m.n || ' minutes')::interval
from (values
  (1, '🎓 3,000+ children supported'),
  (2, '🏥 2,000+ patients assisted'),
  (3, '👩 1,500+ women in SHGs & livelihoods'),
  (4, '☀️ 50+ families lit up with solar lanterns'),
  (5, '🌱 5,000+ in tree plantation drives')
) as m(n, message)
where not exists (select 1 from ticker_messages);
