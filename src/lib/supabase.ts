import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one Supabase client for the browser. It uses the project URL and the PUBLISHABLE key only (both safe to ship);
 * what a visitor or admin can read or change is decided by Row Level Security in the database, not by hiding the key.
 * Never put a secret / service_role key in a VITE_ variable.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** False when the two variables are missing, so the site keeps working without Supabase (e.g. a fresh checkout). */
export const supabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, key as string, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

/** Quick connection test: asks the Auth service for its health. Resolves true when Supabase answers with this key. */
export async function checkSupabase(): Promise<{ ok: boolean; detail: string }> {
  if (!supabase) return { ok: false, detail: "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set" };
  const { error } = await supabase.auth.getSession();
  if (error) return { ok: false, detail: error.message };
  const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key as string } });
  return { ok: res.ok, detail: res.ok ? "Supabase Auth reachable" : `Auth health returned ${res.status}` };
}
