export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { FORM_TEMPLATES } from "@/lib/data";

async function getRole() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role ?? null;
}

function rowToForm(r) {
  return {
    code: r.code, icon: r.icon, color: r.color, category: r.category,
    titleTh: r.title_th, titleEn: r.title_en,
    descTh: r.desc_th, descEn: r.desc_en,
    approvers: r.approvers ?? [],
    sections: r.sections ?? [],
    avgDays: Number(r.avg_days ?? 1),
    isActive: r.is_active !== false,
    numbering: r.numbering ?? null,
  };
}

/* ── GET /api/forms ── */
export async function GET() {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db
      .from("form_templates")
      .select("*")
      .order("code");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(rowToForm));
  }
  return NextResponse.json(FORM_TEMPLATES);
}

/* ── POST /api/forms ── (admin only) */
export async function POST(request) {
  if (await getRole() !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const row = {
      code: body.code,
      icon: body.icon ?? "file-text",
      color: body.color ?? "blue",
      category: body.category ?? "IT",
      title_th: body.titleTh ?? "",
      title_en: body.titleEn ?? "",
      desc_th: body.descTh ?? "",
      desc_en: body.descEn ?? "",
      approvers: body.approvers ?? [],
      sections: body.sections ?? [],
      avg_days: body.avgDays ?? 1.0,
      is_active: body.isActive !== false,
      numbering: body.numbering ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db.from("form_templates").upsert(row, { onConflict: "code" }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(rowToForm(data));
  }

  return NextResponse.json({ ...body, code: body.code });
}
