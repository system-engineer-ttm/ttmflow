export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";

export async function POST(request) {
  const { token, newPassword } = await request.json();
  if (!token || !newPassword || newPassword.length < 6)
    return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน หรือรหัสผ่านสั้นเกินไป (ต้องมีอย่างน้อย 6 ตัวอักษร)" }, { status: 400 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { data: user } = await db
      .from("users")
      .select("id, reset_expires_at")
      .eq("reset_token", token)
      .maybeSingle();

    if (!user)
      return NextResponse.json({ error: "Token ไม่ถูกต้องหรือหมดอายุแล้ว" }, { status: 400 });
    if (new Date(user.reset_expires_at) < new Date())
      return NextResponse.json({ error: "Token หมดอายุแล้ว กรุณาขอ reset ใหม่อีกครั้ง" }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.from("users").update({
      password_hash: hash,
      reset_token: null,
      reset_expires_at: null,
      password_changed_at: new Date().toISOString(),
    }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  }

  // Mock fallback
  const user = Object.values(USERS).find(u => u.resetToken === token);
  if (!user || (user.resetExpires && user.resetExpires < new Date()))
    return NextResponse.json({ error: "Token ไม่ถูกต้องหรือหมดอายุแล้ว" }, { status: 400 });
  user.password = newPassword;
  user.resetToken = null;
  user.resetExpires = null;
  return NextResponse.json({ ok: true });
}
