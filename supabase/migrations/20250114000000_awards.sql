-- Awards & Recognition (website: About Us -> Awards & Recognition). The admin panel adds, edits and removes
-- achievements and their certificates. Run this in Supabase SQL Editor after the earlier migrations (safe to run more than once).

create table if not exists awards (
  id bigint primary key generated always as identity,
  category text not null default 'Award / Recognition' check (length(trim(category)) between 1 and 60),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '' check (length(description) <= 600),
  -- the certificate: a file of the website itself (/images/...) or an https link (e.g. the storage bucket below). Null = no certificate.
  image_url text check (image_url is null or (length(image_url) <= 600 and image_url ~ '^(/|https://)')),
  -- set when the certificate was uploaded from the admin panel, so the file is removed when it is replaced or the entry deleted
  storage_path text,
  published boolean not null default true,
  -- order on the page: lower first; entries added in the admin panel go to the front
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table awards enable row level security;
create index if not exists ix_awards_order on awards (sort_order, created_at desc);

drop trigger if exists tr_awards_updated_at on awards;
create trigger tr_awards_updated_at before update on awards for each row execute function set_updated_at();

-- ===== ROW LEVEL SECURITY =====
-- Visitors read published entries only. Admins read everything and add / edit / delete.

drop policy if exists "Public can read published awards" on awards;
create policy "Public can read published awards"
  on awards for select
  using (published = true);

drop policy if exists "Admins can read all awards" on awards;
create policy "Admins can read all awards"
  on awards for select
  using (is_admin());

drop policy if exists "Admins can insert awards" on awards;
create policy "Admins can insert awards"
  on awards for insert
  with check (is_admin());

drop policy if exists "Admins can update awards" on awards;
create policy "Admins can update awards"
  on awards for update
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete awards" on awards;
create policy "Admins can delete awards"
  on awards for delete
  using (is_admin());

revoke all on awards from public, anon, authenticated;
grant select on awards to anon;
grant select, insert, delete on awards to authenticated;
grant update (category, title, description, image_url, storage_path, published, sort_order) on awards to authenticated;

-- ===== STORAGE: certificates uploaded from the admin panel =====
-- Public bucket (the certificates are published), images only, up to 8 MB each. Only admins upload or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('award-certificates', 'award-certificates', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read award certificates" on storage.objects;
create policy "Public can read award certificates"
  on storage.objects for select
  using (bucket_id = 'award-certificates');

drop policy if exists "Admins can upload award certificates" on storage.objects;
create policy "Admins can upload award certificates"
  on storage.objects for insert
  with check (bucket_id = 'award-certificates' and is_admin());

drop policy if exists "Admins can delete award certificates" on storage.objects;
create policy "Admins can delete award certificates"
  on storage.objects for delete
  using (bucket_id = 'award-certificates' and is_admin());

-- ===== THE ACHIEVEMENTS ALREADY PUBLISHED =====
-- The 14 entries from the earlier website, added once (only while the table is empty). Their certificate images ship
-- with the website (public/images/awards/). sort_order keeps their order; new entries default to 0 and so come first.

insert into awards (sort_order, category, title, description, image_url)
select m.n * 10, m.category, m.title, m.description, m.image_url
from (values
  (1, 'Award / Recognition', 'Certificate of Excellence – Municipal General Hospital, Mumbai',
   'Sahara Jan Kalyan Samiti was honored with the Certificate of Excellence by Municipal General Hospital, Mumbai, for its outstanding contribution to patient welfare, healthcare assistance, and community service.',
   '/images/awards/award-01.jpg'),
  (2, 'Appreciation', 'Appreciation Letter – Dr. R. N. Cooper General Hospital, Mumbai',
   'Dr. R. N. Cooper General Hospital, Municipal Corporation of Greater Mumbai, appreciated Sahara Jan Kalyan Samiti for its generous support and contribution towards patient care facilities.',
   '/images/awards/award-02.jpg'),
  (3, 'Award / Recognition', 'COVID-19 Vaccination Recognition – MPVHA',
   'Recognized by Madhya Pradesh Voluntary Health Association for outstanding support and contribution to the COVID-19 Vaccination Program and public health awareness.',
   '/images/awards/award-03.jpg'),
  (4, 'Recommendation Letter', 'Government Girls College, Bina Recommendation',
   'The Principal of Government Girls College, Bina appreciated Sahara Jan Kalyan Samiti for health awareness, menstrual hygiene, mental health workshops, and student development initiatives.',
   '/images/awards/award-04.jpg'),
  (5, 'Recommendation Letter', 'HDFC Bank Recommendation Letter',
   'HDFC Bank acknowledged the organization’s dedication towards healthcare assistance, educational support, community awareness, and welfare of economically weaker communities.',
   '/images/awards/award-05.jpg'),
  (6, 'Government Reference', 'Women & Child Development Department – Hindi Reference',
   'Issued by the Women & Child Development Department, recognizing the organization’s work in child marriage prevention, awareness campaigns, and grassroots social development.',
   '/images/awards/award-06.jpg'),
  (7, 'Government Reference', 'Women & Child Development Department – English Reference',
   'The department recommended Sahara Jan Kalyan Samiti as a credible and reliable nonprofit organization suitable for CSR partnerships, donations, and development collaborations.',
   '/images/awards/award-07.jpg'),
  (8, 'Training Certificate', 'MP Jan Abhiyan Parishad Training Certificate',
   'Certificate awarded for successful participation in capacity-building training focused on decentralized planning, community participation, social audit, and development monitoring.',
   '/images/awards/award-08.jpg'),
  (9, 'Appreciation', 'MP Jan Abhiyan Parishad CM Appreciation',
   'Recognition for the organization’s significant contribution to Gram Vikas Yatra and rural development activities under Madhya Pradesh Jan Abhiyan Parishad.',
   '/images/awards/award-09.jpg'),
  (10, 'Training Certificate', 'MP Jan Abhiyan Parishad Capacity Building Certificate',
   'Awarded for completing training programs aimed at strengthening voluntary organizations and enhancing community development leadership skills.',
   '/images/awards/award-10.jpg'),
  (11, 'Recommendation Letter', 'YES Bank Recommendation Letter',
   'YES Bank recognized Sahara Jan Kalyan Samiti as a socially responsible nonprofit organization with a strong track record in healthcare, education, community support, and CSR-related initiatives.',
   '/images/awards/award-11.jpg'),
  (12, 'Appreciation', 'Certificate of Appreciation – Mental Health & Student Welfare Program',
   'Government Girls College, Bina appreciated Dr. Shailendra Yadav, Psychologist, Sahara Jan Kalyan Samiti, Sagar, for active support and valuable contribution in the one-day training and awareness program on Mental Health and Student Welfare.',
   '/images/awards/award-12.jpg'),
  (13, 'Award / Recognition', 'World Record Participation Certificate – Highest Online Yoga Participation 2026',
   'Sahara Jan Kalyan Samiti was recognized as an official participant in the global yoga movement organized by Habuild and World Records Union, recording 1.36 Crore+ total attendance from 14–21 June 2026.',
   '/images/awards/award-13.jpg'),
  (14, 'Award / Recognition', 'NGO Partner Recognition Certificate – I.I.M.U.N. Yoga Initiative 2026',
   'India’s International Movement to Unite Nations recognized Sahara Jan Kalyan Samiti for participation as an NGO Partner in I.I.M.U.N.’s Sagar International Yoga Day Initiative 2026.',
   '/images/awards/award-14.jpg')
) as m(n, category, title, description, image_url)
where not exists (select 1 from awards);
