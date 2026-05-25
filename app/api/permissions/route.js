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
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const perms = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const rows = [];
    for (const [route, roles] of Object.entries(perms)) {
      for (const [role, allowed] of Object.entries(roles)) {
        rows.push({ route, role, allowed, updated_at: new Date().toISOString() });
      }
    }
    const { error } = await db.from("role_permissions").upsert(rows, { onConflict: "route,role" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // Mock fallback — update in-memory
  Object.keys(ROLE_PERMISSIONS).forEach((k) => delete ROLE_PERMISSIONS[k]);
  Object.assign(ROLE_PERMISSIONS, perms);
  return NextResponse.json({ ok: true });
}
