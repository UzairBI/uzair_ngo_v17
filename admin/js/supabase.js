// Supabase client for the admin panel (browser, authenticated user only).
// Uses the same URL and publishable key as the public site (src/lib/supabase.ts).
// All data access is protected by Row Level Security (RLS).

import { createClient } from "@supabase/supabase-js";

// Read Supabase config from Vite environment variables (same as public site)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Supabase configuration is missing.
Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env`);
}

// Create the Supabase client with persistent sessions
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: { headers: { "X-Admin-Panel": "true" } }
});

export class AuthError extends Error {}

// Get the current authenticated admin user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new AuthError(error.message);
  if (!user) throw new AuthError("No authenticated user");
  return user;
}

// Get the admin profile for the current user
export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();
  if (error || !data) throw new AuthError("This account is not an admin, or has been deactivated");
  // Update last login time
  await supabase.from("admin_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", user.id).catch(() => {});
  return { ...data, email: user.email };
}

// Check if the current user is an admin
export async function isAdmin() {
  try {
    const admin = await getCurrentAdmin();
    return admin.role === "admin" || admin.role === "editor" || admin.role === "viewer";
  } catch {
    return false;
  }
}

// Sign in with email and password
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AuthError(error.message);
  return data.user;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthError(error.message);
}

// Listen for auth state changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// Re-throw Supabase errors in a consistent format
export function handleError(error) {
  if (error.status === 401 || error.status === 403) {
    throw new AuthError(error.message || "Unauthorized");
  }
  throw new Error(error.message || "Database error");
}
