-- Annual Reports: five more reports that ship with the website (public/documents/annual-reports/), 2020-21 to 2024-25.
-- Run this in Supabase SQL Editor after 20250108000000_annual_reports.sql (safe to run more than once).
-- Only fills years that have no PDF yet, so a PDF set in the admin panel is never overwritten.

update annual_reports
set file_url = '/documents/annual-reports/annual-report-' || fy || '.pdf'
where fy in ('2020-21', '2021-22', '2022-23', '2023-24', '2024-25') and file_url is null;
