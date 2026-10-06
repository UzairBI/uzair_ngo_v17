-- Text of the website pages (About Us, Our Projects, Gallery, News, Events, Transparency, Get Involved, Contact, Donate).
-- The admin panel (Website Pages) saves one row per text an admin has changed; a text with no row shows its original wording
-- from src/data/pageContent.ts. Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists page_content (
  -- which text, e.g. 'about.hero.title' (the keys are listed in src/data/pageContent.ts)
  key text primary key check (key ~ '^[a-z0-9][a-zA-Z0-9.-]{1,79}$'),
  value text not null check (length(trim(value)) between 1 and 2000),
  updated_at timestamptz not null default now()
);
alter table page_content enable row level security;

drop trigger if exists tr_page_content_updated_at on page_content;
create trigger tr_page_content_updated_at before update on page_content for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read every row (it is the text of the public pages). Admins add, change and remove rows.

drop policy if exists "Public can read page content" on page_content;
create policy "Public can read page content"
  on page_content for select
  using (true);

drop policy if exists "Admins can insert page content" on page_content;
create policy "Admins can insert page content"
  on page_content for insert
  with check (is_admin());

drop policy if exists "Admins can update page content" on page_content;
create policy "Admins can update page content"
  on page_content for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete page content" on page_content;
create policy "Admins can delete page content"
  on page_content for delete
  using (is_admin());

revoke all on page_content from public, anon, authenticated;
grant select on page_content to anon;
grant select, insert, delete on page_content to authenticated;
-- key as well as value: saving from the admin panel is an "insert or update", which writes both columns
grant update (key, value) on page_content to authenticated;
