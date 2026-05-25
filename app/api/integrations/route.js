export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role === "admin";
}

const DEFAULTS = {
  line: { botName: "TTMFlow Bot", groups: [] },
  email: { provider: "Microsoft 365", fromAddress: "no-reply@example.com" },
  inapp: { bellEnabled: true, soundEnabled: false },
  webhook: { endpoints: [] },
};

/* ── GET /api/integrations ── */
export async function GET() {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db.from("integration_settings").select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const result = { ...DEFAULTS };
    for (const r of data ?? []) {
      result[r.channel] = { ...(result[r.channel] ?? {}), ...(r.config ?? {}), isActive: r.is_active };
    }
    return NextResponse.json(result);
  }
  return NextResponse.json(DEFAULTS);
}

/* ── PUT /api/integrations ── (admin only) */
export async function PUT(request) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const rows = Object.entries(body).map(([channel, cfg]) => ({
      channel,
      config: cfg,
      is_active: cfg?.isActive !== false,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await db.from("integration_settings").upsert(rows, { onConflict: "channel" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
