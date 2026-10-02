// Supabase client for the admin panel (browser, authenticated user only).
// Uses the same URL and publishable key as the public site (src/lib/supabase.ts).
// All data access is protected by Row Level Security (RLS).

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Read Supabase config from window (injected by index.html and populated by Vite during build)
const url = typeof window !== "undefined" && window.VITE_SUPABASE_URL ? window.VITE_SUPABASE_URL : "";
const key = typeof window !== "undefined" && window.VITE_SUPABASE_PUBLISHABLE_KEY ? window.VITE_SUPABASE_PUBLISHABLE_KEY : "";

// Strip template placeholders for development
export const supabaseUrl = url && !url.includes("__") ? url : "";
export const supabaseKey = key && !key.includes("__") ? key : "";

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("__") || supabaseKey.includes("__")) {
  throw new Error(`Supabase URL and publishable key are required in environment variables.
Found URL: ${supabaseUrl ? "yes" : "no"}
Found Key: ${supabaseKey ? "yes" : "no"}
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
    .single();
  if (error) throw new AuthError("Admin profile not found");
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
