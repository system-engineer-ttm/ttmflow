export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { FLOW_TEMPLATES } from "@/lib/data";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role === "admin";
}

function rowToFlow(r) {
  return {
    id: r.id, titleTh: r.title_th, titleEn: r.title_en,
    descTh: r.desc_th, descEn: r.desc_en,
    icon: r.icon, color: r.color, owner: r.owner,
    avgDays: Number(r.avg_days ?? 1),
    steps: r.steps ?? [],
    isActive: r.is_active !== false,
  };
}

/* ── GET /api/flows/templates ── */
export async function GET() {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db.from("flow_templates").select("*").order("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(rowToFlow));
  }
  return NextResponse.json(FLOW_TEMPLATES);
}

/* ── POST /api/flows/templates ── (admin only) */
export async function POST(request) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const row = {
      id: body.id,
      title_th: body.titleTh ?? "",
      title_en: body.titleEn ?? "",
      desc_th: body.descTh ?? "",
      desc_en: body.descEn ?? "",
      icon: body.icon ?? "trending-up",
      color: body.color ?? "blue",
      owner: body.owner ?? "",
      avg_days: body.avgDays ?? 7,
      steps: body.steps ?? [],
      is_active: body.isActive !== false,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db.from("flow_templates").upsert(row, { onConflict: "id" }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(rowToFlow(data));
  }

  return NextResponse.json(body);
}
