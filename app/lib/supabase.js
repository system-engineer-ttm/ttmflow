import { createClient } from "@supabase/supabase-js";

/** True when Supabase env vars are configured */
export const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** Service-role client — created lazily (server/API routes only, bypasses RLS) */
export function createServiceClient() {
  if (!hasSupabase) throw new Error("Supabase not configured");
  // Trim whitespace and trailing slash that may be accidentally pasted
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return createClient(url, key);
}
