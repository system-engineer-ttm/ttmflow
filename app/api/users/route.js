export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";

async function getRole() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role ?? null;
}

/* ── GET /api/users ── */
export async function GET() {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db
      .from("users")
      .select("id,name_th,name_en,title_th,title_en,dept,avatar,color,username,role,is_active,signature,email,phone,line_id,employee_id,lang,last_login_at")
      .order("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data.map(toUser));
  }
  // Mock fallback
  return NextResponse.json(Object.values(USERS));
}

/* ── POST /api/users ── */
export async function POST(request) {
  if (await getRole() !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const { count } = await db.from("users").select("id", { count: "exact", head: true });
    const newId = `USR${String((count ?? 0) + 1).padStart(3, "0")}`;
    const hash = await bcrypt.hash(body.password || "1234", 10);

    const { data, error } = await db.from("users").insert({
      id: newId,
      name_th: body.nameTh ?? "", name_en: body.nameEn ?? "",
      title_th: body.titleTh ?? "", title_en: body.titleEn ?? "",
      dept: body.dept ?? "", avatar: body.avatar ?? "",
      color: body.color ?? "#3b82f6",
      username: (body.username ?? "").toLowerCase(),
      password_hash: hash,
      role: body.role ?? "requester",
      is_active: body.isActive !== false,
      email: body.email || null, phone: body.phone || null,
      line_id: body.lineId || null, employee_id: body.employeeId || null,
      lang: body.lang || "th",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(toUser(data));
  }

  // Mock fallback
  const newId = `USR${String(Object.keys(USERS).length + 1).padStart(3, "0")}`;
  const newUser = { ...body, id: newId };
  USERS[newId] = newUser;
  return NextResponse.json(newUser);
}

function toUser(u) {
  return {
    id: u.id, nameTh: u.name_th, nameEn: u.name_en,
    titleTh: u.title_th, titleEn: u.title_en,
    dept: u.dept, avatar: u.avatar, color: u.color,
    username: u.username, role: u.role, isActive: u.is_active,
    signature: u.signature || null, hasSignature: !!u.signature,
    email: u.email || null, phone: u.phone || null,
    lineId: u.line_id || null, employeeId: u.employee_id || null,
    lang: u.lang || "th", lastLoginAt: u.last_login_at || null,
  };
}
