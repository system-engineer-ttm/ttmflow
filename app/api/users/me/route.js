export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";

async function getAuth() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

/* GET /api/users/me — full profile for current user */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { data: u } = await db.from("users").select("*").eq("id", auth.id).maybeSingle();
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toFullUser(u));
  }

  const user = Object.values(USERS).find(u => u.id === auth.id);
  return NextResponse.json(user ?? null);
}

/* PUT /api/users/me — update own profile (contact, name, lang, color) */
export async function PUT(request) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const updates = { updated_at: new Date().toISOString() };
    if (body.nameTh     !== undefined) updates.name_th     = body.nameTh;
    if (body.nameEn     !== undefined) updates.name_en     = body.nameEn;
    if (body.titleTh    !== undefined) updates.title_th    = body.titleTh;
    if (body.titleEn    !== undefined) updates.title_en    = body.titleEn;
    if (body.dept       !== undefined) updates.dept        = body.dept;
    if (body.email      !== undefined) updates.email       = body.email;
    if (body.phone      !== undefined) updates.phone       = body.phone;
    if (body.lineId     !== undefined) updates.line_id     = body.lineId;
    if (body.employeeId !== undefined) updates.employee_id = body.employeeId;
    if (body.lang       !== undefined) updates.lang        = body.lang;
    if (body.color      !== undefined) updates.color       = body.color;
    if (body.avatar     !== undefined) updates.avatar      = body.avatar;

    const { data, error } = await db.from("users").update(updates).eq("id", auth.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(toFullUser(data));
  }

  // Mock fallback
  const user = Object.values(USERS).find(u => u.id === auth.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ALLOWED = ["nameTh","nameEn","titleTh","titleEn","dept","email","phone","lineId","employeeId","lang","color","avatar"];
  ALLOWED.forEach(k => { if (body[k] !== undefined) user[k] = body[k]; });
  return NextResponse.json(user);
}

function toFullUser(u) {
  return {
    id: u.id, nameTh: u.name_th, nameEn: u.name_en,
    titleTh: u.title_th, titleEn: u.title_en,
    dept: u.dept, avatar: u.avatar, color: u.color,
    username: u.username, role: u.role, isActive: u.is_active,
    signature: u.signature || null, hasSignature: !!u.signature,
    email: u.email || null, phone: u.phone || null,
    lineId: u.line_id || null, employeeId: u.employee_id || null,
    lang: u.lang || "th",
    lastLoginAt: u.last_login_at || null,
  };
}
