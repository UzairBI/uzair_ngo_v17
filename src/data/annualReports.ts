/**
 * Annual reports, one per financial year. The live list is managed in the admin panel (Annual Reports) and read from
 * the database; the list below is what the page shows when the database cannot be reached, and matches what the
 * database starts with (supabase/migrations/20250108000000_annual_reports.sql and 20250109000000_more_annual_reports.sql).
 */
export interface AnnualReport { fy: string; title: string; description?: string; file_url?: string | null }

/** Reports that ship with the website: public/documents/annual-reports/annual-report-<year>.pdf */
const shipped = ["2007-08", "2009-10", "2010-11", "2011-12", "2012-13", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25"];
/** "2004-05" for the financial year starting in 2004. */
export const fyLabel = (startYear: number) => `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

export const defaultAnnualReports: AnnualReport[] = Array.from({ length: 2025 - 2004 + 1 }, (_, i) => {
  const fy = fyLabel(2004 + i);
  return { fy, title: `Annual Report ${fy}`, file_url: shipped.includes(fy) ? `/documents/annual-reports/annual-report-${fy}.pdf` : null };
});
