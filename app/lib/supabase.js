import { createClient } from "@supabase/supabase-js";

/** True when Supabase env vars are configured */
export const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** Service-role client — created lazily (server/API routes only, bypasses RLS) */
export function createServiceClient() {
  if (!hasSupabase) throw new Error("Supabase not configured");
  // Trim whitespace and trailing slash / path that may be accidentally pasted
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .trim()
    .replace(/\/rest\/v1\/?$/, "")   // strip /rest/v1 if copied from Data API page
    .replace(/\/+$/, "");             // strip any trailing slashes
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Next.js patches fetch with a data cache that serves stale GETs even in
      // force-dynamic routes — opt every Supabase request out of it.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
