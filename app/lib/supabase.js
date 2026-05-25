import { createClient } from "@supabase/supabase-js";

/** True when Supabase env vars are configured */
export const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** Service-role client — created lazily (server/API routes only, bypasses RLS) */
export function createServiceClient() {
  if (!hasSupabase) throw new Error("Supabase not configured");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
