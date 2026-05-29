export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { FORM_TEMPLATES } from "@/lib/data";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role === "admin";
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

/* ── PUT /api/forms/[code] ── */
export async function PUT(request, { params }) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const updates = {
      icon: body.icon, color: body.color, category: body.category,
      title_th: body.titleTh, title_en: body.titleEn,
      desc_th: body.descTh, desc_en: body.descEn,
      approvers: body.approvers, sections: body.sections,
      avg_days: body.avgDays, is_active: body.isActive !== false,
      numbering: body.numbering ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db.from("form_templates")
      .update(updates).eq("code", params.code).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(rowToForm(data));
  }

  const found = FORM_TEMPLATES.find(f => f.code === params.code);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  Object.assign(found, body);
  return NextResponse.json(found);
}

/* ── DELETE /api/forms/[code] ── */
export async function DELETE(_, { params }) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { error } = await db.from("form_templates").delete().eq("code", params.code);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
