export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import { USERS } from "@/lib/data";

const ERR = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง / Invalid username or password";

export async function POST(request) {
  const { username, password } = await request.json();
  const uname = (username ?? "").trim().toLowerCase();

  /* ── Real DB path (Supabase configured) ── */
  if (hasSupabase) {
    const db = createServiceClient();
    const { data: user, error: dbErr } = await db
      .from("users")
      .select("*")
      .eq("username", uname)
      .eq("is_active", true)
      .maybeSingle();

    if (dbErr) return NextResponse.json({ error: ERR }, { status: 401 });
    if (!user) return NextResponse.json({ error: ERR }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: ERR }, { status: 401 });

    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    const userData = dbRowToUser(user);

    const res = NextResponse.json({ user: userData });
    res.cookies.set(SESSION_COOKIE, token, cookieOpts());
    return res;
  }

  /* ── Mock fallback (local dev, no DB) ── */
  const user = Object.values(USERS).find(
    (u) => u.username === uname && u.password === password && u.isActive
  );
  if (!user) return NextResponse.json({ error: ERR }, { status: 401 });

  const token = await signToken({ id: user.id, username: user.username, role: user.role });
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, cookieOpts());
  return res;
}

function dbRowToUser(u) {
  return {
    id: u.id, nameTh: u.name_th, nameEn: u.name_en,
    titleTh: u.title_th, titleEn: u.title_en,
    dept: u.dept, avatar: u.avatar, color: u.color,
    username: u.username, role: u.role, isActive: u.is_active,
    signature: u.signature || null,
    hasSignature: !!u.signature,
  };
}

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60,
    path: "/",
  };
}
