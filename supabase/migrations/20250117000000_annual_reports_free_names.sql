-- Annual Reports: the name of a box no longer has to look like 2004-05. Any name of 1 to 40 characters is accepted
-- (2004-2005, FY 2026, Audit Report 2024, ...). Two boxes still cannot share the same name.
-- Run this in Supabase SQL Editor after 20250108000000_annual_reports.sql (safe to run more than once).

alter table annual_reports drop constraint if exists annual_reports_fy_check;
alter table annual_reports add constraint annual_reports_fy_check check (length(trim(fy)) between 1 and 40);
