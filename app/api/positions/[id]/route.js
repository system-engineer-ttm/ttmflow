export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { POSITIONS } from "@/lib/data";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role === "admin";
}

/* ── PUT /api/positions/[id] ── (admin only) */
export async function PUT(request, { params }) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const nameTh = (body.nameTh ?? "").trim();
  const nameEn = (body.nameEn ?? "").trim();
  if (!nameTh && !nameEn)
    return NextResponse.json({ error: "ต้องระบุชื่อตำแหน่ง / Position name required" }, { status: 400 });

  if (hasSupabase) {
    const db = createServiceClient();
    const updates = {
      name_th: nameTh || nameEn,
      name_en: nameEn || nameTh,
      updated_at: new Date().toISOString(),
    };
    if (Number.isFinite(body.sortOrder)) updates.sort_order = body.sortOrder;

    const { data, error } = await db.from("positions").update(updates).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ id: data.id, nameTh: data.name_th, nameEn: data.name_en, sortOrder: data.sort_order });
  }

  // Mock fallback
  const pos = POSITIONS.find((p) => p.id === params.id);
  if (!pos) return NextResponse.json({ error: "Not found" }, { status: 404 });
  pos.nameTh = nameTh || nameEn;
  pos.nameEn = nameEn || nameTh;
  if (Number.isFinite(body.sortOrder)) pos.sortOrder = body.sortOrder;
  return NextResponse.json(pos);
}

/* ── DELETE /api/positions/[id] ── (admin only) */
export async function DELETE(request, { params }) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { error } = await db.from("positions").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // Mock fallback
  const idx = POSITIONS.findIndex((p) => p.id === params.id);
  if (idx >= 0) POSITIONS.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
