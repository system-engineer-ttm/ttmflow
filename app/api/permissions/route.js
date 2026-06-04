export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { ROLE_PERMISSIONS } from "@/lib/data";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role === "admin";
}

/* ── GET /api/permissions ── */
export async function GET() {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db.from("role_permissions").select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // reshape array → { route: { role: allowed } }
    const perms = {};
    for (const row of data) {
      if (!perms[row.route]) perms[row.route] = {};
      perms[row.route][row.role] = row.allowed;
    }
    return NextResponse.json(perms);
  }
  return NextResponse.json(ROLE_PERMISSIONS);
}

/* ── PUT /api/permissions ── */
export async function PUT(request) {
  // Auth — require an admin session. Surface a clearer message than just
  // "Forbidden" so the user knows what to fix on the client.
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
  }
  if (payload.role !== "admin") {
    return NextResponse.json({ error: `Forbidden — admin role required (you are: ${payload.role})` }, { status: 403 });
  }

  let perms;
  try {
    perms = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body: " + e.message }, { status: 400 });
  }
  if (!perms || typeof perms !== "object") {
    return NextResponse.json({ error: "Body must be an object: { route: { role: boolean } }" }, { status: 400 });
  }

  if (hasSupabase) {
    const db = createServiceClient();
    const rows = [];
    for (const [route, roles] of Object.entries(perms)) {
      if (!roles || typeof roles !== "object") continue;
      for (const [role, allowed] of Object.entries(roles)) {
        rows.push({
          route, role,
          allowed: !!allowed,
          updated_at: new Date().toISOString(),
        });
      }
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: "No (route, role) cells supplied" }, { status: 400 });
    }
    const { error } = await db.from("role_permissions").upsert(rows, { onConflict: "route,role" });
    if (error) {
      console.error("[api/permissions PUT] upsert failed:", error);
      return NextResponse.json({
        error: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
        code: error.code ?? null,
      }, { status: 400 });
    }
    return NextResponse.json({ ok: true, rowsUpserted: rows.length });
  }

  // Mock fallback — update in-memory
  Object.keys(ROLE_PERMISSIONS).forEach((k) => delete ROLE_PERMISSIONS[k]);
  Object.assign(ROLE_PERMISSIONS, perms);
  return NextResponse.json({ ok: true });
}
