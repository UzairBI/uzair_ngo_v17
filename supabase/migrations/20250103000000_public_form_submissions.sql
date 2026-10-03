-- Lets the public website submit volunteer sign-ups, document requests and contact-style
-- forms (contact, CSR, newsletter, event registration) directly to Supabase.
--
-- Design: anon never gets direct table access. Each form goes through a narrow
-- SECURITY DEFINER function that validates required fields and inserts exactly one row.
-- This avoids exposing INSERT/SELECT grants on these tables to the public role at all.

create or replace function public.submit_volunteer(p_name text, p_phone text, p_email text default null, p_area text default null, p_message text default null)
returns void as $$
begin
  if p_name is null or length(trim(p_name)) = 0 then raise exception 'Name is required'; end if;
  if p_phone is null or length(trim(p_phone)) = 0 then raise exception 'Phone is required'; end if;
  insert into volunteers (name, phone, email, area, message, status)
  values (trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_area, '')), ''), nullif(trim(coalesce(p_message, '')), ''), 'pending');
end;
$$ language plpgsql security definer set search_path = public;
grant execute on function public.submit_volunteer(text, text, text, text, text) to anon;

create or replace function public.submit_document_request(
  p_request_type text, p_document_type text, p_name text, p_email text, p_phone text, p_purpose text,
  p_financial_year text default null, p_delivery text default 'PDF by email', p_delivery_address text default null,
  p_organisation text default null, p_message text default null
) returns text as $$
declare v_ref text;
begin
  if p_name is null or length(trim(p_name)) = 0 then raise exception 'Name is required'; end if;
  if p_email is null or length(trim(p_email)) = 0 then raise exception 'Email is required'; end if;
  if p_phone is null or length(trim(p_phone)) = 0 then raise exception 'Phone is required'; end if;
  loop
    v_ref := 'REQ-' || extract(year from now())::int || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from document_requests where reference = v_ref);
  end loop;
  insert into document_requests (reference, request_type, document_type, financial_year, delivery, delivery_address, name, organisation, email, phone, purpose, message, status)
  values (v_ref, p_request_type, p_document_type, nullif(trim(coalesce(p_financial_year, '')), ''), coalesce(nullif(trim(p_delivery), ''), 'PDF by email'),
    nullif(trim(coalesce(p_delivery_address, '')), ''), trim(p_name), nullif(trim(coalesce(p_organisation, '')), ''), trim(p_email), trim(p_phone),
    p_purpose, nullif(trim(coalesce(p_message, '')), ''), 'new');
  return v_ref;
end;
$$ language plpgsql security definer set search_path = public;
grant execute on function public.submit_document_request(text, text, text, text, text, text, text, text, text, text, text) to anon;

create or replace function public.submit_form(
  p_kind text, p_name text default null, p_email text default null, p_phone text default null,
  p_organisation text default null, p_message text default null, p_data jsonb default '{}'::jsonb
) returns void as $$
begin
  if p_kind not in ('contact', 'csr', 'newsletter', 'event_registration') then raise exception 'Invalid form kind'; end if;
  insert into form_submissions (kind, name, email, phone, organisation, message, data, status)
  values (p_kind, nullif(trim(coalesce(p_name, '')), ''), nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_organisation, '')), ''), nullif(trim(coalesce(p_message, '')), ''), coalesce(p_data, '{}'::jsonb), 'new');
end;
$$ language plpgsql security definer set search_path = public;
grant execute on function public.submit_form(text, text, text, text, text, text, jsonb) to anon;
