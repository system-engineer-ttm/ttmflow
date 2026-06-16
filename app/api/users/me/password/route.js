export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";

/* PUT /api/users/me/password — change own password */
export async function PUT(request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const auth = token ? await verifyToken(token) : null;
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword || newPassword.length < 6)
    return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน หรือรหัสผ่านใหม่สั้นเกินไป (ต้องมีอย่างน้อย 6 ตัวอักษร)" }, { status: 400 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { data: user } = await db.from("users").select("id, password_hash").eq("id", auth.id).maybeSingle();
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.from("users").update({
      password_hash: hash,
      password_changed_at: new Date().toISOString(),
      must_change_password: false,
    }).eq("id", auth.id);

    return NextResponse.json({ ok: true });
  }

  // Mock fallback
  const user = Object.values(USERS).find(u => u.id === auth.id);
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
  if (user.password !== currentPassword)
    return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
  user.password = newPassword;
  return NextResponse.json({ ok: true });
}
