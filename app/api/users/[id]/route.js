export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role === "admin";
}

/* ── PUT /api/users/[id] ── */
export async function PUT(request, { params }) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const updates = {
      name_th: body.nameTh ?? "", name_en: body.nameEn ?? "",
      title_th: body.titleTh ?? "", title_en: body.titleEn ?? "",
      dept: body.dept ?? "", avatar: body.avatar ?? "",
      color: body.color ?? "#3b82f6",
      username: (body.username ?? "").toLowerCase(),
      role: body.role ?? "requester",
      is_active: body.isActive !== false,
      email: body.email || null, phone: body.phone || null,
      line_id: body.lineId || null, employee_id: body.employeeId || null,
      lang: body.lang || "th",
      updated_at: new Date().toISOString(),
    };
    if (body.password) {
      updates.password_hash = await bcrypt.hash(body.password, 10);
      updates.must_change_password = true; // admin-set password → force change on next login
    }

    const { data, error } = await db.from("users").update(updates).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({
      id: data.id, nameTh: data.name_th, nameEn: data.name_en,
      titleTh: data.title_th, titleEn: data.title_en,
      dept: data.dept, avatar: data.avatar, color: data.color,
      username: data.username, role: data.role, isActive: data.is_active,
      email: data.email || null, phone: data.phone || null,
      lineId: data.line_id || null, employeeId: data.employee_id || null,
      lang: data.lang || "th",
    });
  }

  // Mock fallback
  if (!USERS[params.id]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  Object.assign(USERS[params.id], body);
  return NextResponse.json(USERS[params.id]);
}

/* ── DELETE /api/users/[id] ── */
export async function DELETE(request, { params }) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { error } = await db.from("users").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // Mock fallback
  delete USERS[params.id];
  return NextResponse.json({ ok: true });
}
