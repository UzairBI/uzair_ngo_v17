-- Blog (website: Blog in the main menu, /blog and /blog/<slug>). The admin panel (Blog) writes, edits and removes posts
-- and their two photos. Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists blog_posts (
  id bigint primary key generated always as identity,
  -- the last part of the post's address: /blog/<slug>. Small letters, digits and hyphens only.
  slug text not null unique check (length(slug) <= 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 200),
  -- the filter button the post appears under (Education, Health, ...)
  category text not null default 'Stories' check (length(trim(category)) between 1 and 60),
  author text not null default '' check (length(author) <= 80),
  -- one or two sentences shown on the Blog page under the title
  excerpt text not null default '' check (length(excerpt) <= 400),
  -- the post itself: paragraphs separated by an empty line; a line starting with "## " is a heading, with "> " a highlighted quote
  body text not null default '' check (length(body) <= 20000),
  -- cover photo (top of the post and on its card) and one more photo shown inside the post: a file of the website
  -- itself (/assets/...) or an https link (e.g. the storage bucket below). Null = no photo.
  cover_url text check (cover_url is null or (length(cover_url) <= 600 and cover_url ~ '^(/|https://)')),
  photo_url text check (photo_url is null or (length(photo_url) <= 600 and photo_url ~ '^(/|https://)')),
  photo_caption text not null default '' check (length(photo_caption) <= 300),
  -- set when a photo was uploaded from the admin panel, so the file is removed when it is replaced or the post deleted
  cover_path text,
  photo_path text,
  published boolean not null default true,
  -- the date shown on the post; newest first on the Blog page
  published_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table blog_posts enable row level security;
create index if not exists ix_blog_posts_date on blog_posts (published_on desc, id desc);

drop trigger if exists tr_blog_posts_updated_at on blog_posts;
create trigger tr_blog_posts_updated_at before update on blog_posts for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published posts only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published blog posts" on blog_posts;
create policy "Public can read published blog posts"
  on blog_posts for select
  using (published = true);

drop policy if exists "Admins can read all blog posts" on blog_posts;
create policy "Admins can read all blog posts"
  on blog_posts for select
  using (is_admin());

drop policy if exists "Admins can insert blog posts" on blog_posts;
create policy "Admins can insert blog posts"
  on blog_posts for insert
  with check (is_admin());

drop policy if exists "Admins can update blog posts" on blog_posts;
create policy "Admins can update blog posts"
  on blog_posts for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete blog posts" on blog_posts;
create policy "Admins can delete blog posts"
  on blog_posts for delete
  using (is_admin());

revoke all on blog_posts from public, anon, authenticated;
grant select on blog_posts to anon;
grant select, insert, delete on blog_posts to authenticated;
grant update (slug, title, category, author, excerpt, body, cover_url, cover_path, photo_url, photo_path, photo_caption, published, published_on) on blog_posts to authenticated;

-- ===== STORAGE: photos uploaded from the admin panel =====
-- Public bucket (the photos are published), images only, up to 8 MB each. Only admins upload or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read blog images" on storage.objects;
create policy "Public can read blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

drop policy if exists "Admins can upload blog images" on storage.objects;
create policy "Admins can upload blog images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and is_admin());

drop policy if exists "Admins can delete blog images" on storage.objects;
create policy "Admins can delete blog images"
  on storage.objects for delete
  using (bucket_id = 'blog-images' and is_admin());

-- ===== A FIRST POST =====
-- One demonstration post, added once (only while the table is empty). Its two photos ship with the website
-- (public/assets/images/gallery/education/). Edit or remove it in the admin panel. Same text as src/data/blog.ts.

insert into blog_posts (slug, title, category, author, excerpt, body, cover_url, photo_url, photo_caption, published_on)
select 'a-mat-a-slate-and-a-second-chance',
  'A Mat, a Slate and a Second Chance: An Evening at a Sahara Learning Centre',
  'Education', 'Sahara Team',
  'When the school day ends, the learning starts again on a plastic mat in a brick-walled room. A look inside the free evening centres that help children in Sagar keep up, and stay in school.',
  $body$The school day is over, but on a plastic mat spread across a brick-walled room the learning is only beginning. A dozen children sit shoulder to shoulder with notebooks open on their knees, while a young teacher from their own neighbourhood moves from one child to the next.

## Why an evening class matters

In the rural clusters and slum settlements of Sagar district, many children are the first in their family to go to school. When a lesson is missed, there is often nobody at home who can explain it. A small gap in reading or arithmetic quietly grows, until one day the child stops going at all. Our Shiksha Kendras were set up to close that gap early.

> A place to sit, a slate to write on and someone who notices: a child does not need much more than that to begin.

## What happens on the mat

The centres are free. Children get remedial help with reading, writing and numbers, and the youngest start with slates and picture books before they move on to notebooks. School kits and uniforms are part of the support, so that no child stays at home because the family cannot afford a bag or a pencil.

## Small things that keep a child in school

None of this is complicated. A regular hour, a familiar teacher and a school bag of their own tell a child that their learning matters to somebody. Learning support is strongest when families and the community become part of the journey, which is why the centres sit inside the neighbourhoods they serve.

## How you can help

You can sponsor a child's education or fund a school kit from our Donate page. If you have time rather than funds, the Get Involved page shows how to volunteer with us.$body$,
  '/assets/images/gallery/education/children-studying-centre.jpg',
  '/assets/images/gallery/education/children-learning-kits.jpg',
  'Slates, picture books and school bags: children at one of our learning sessions.',
  date '2026-10-06'
where not exists (select 1 from blog_posts);
