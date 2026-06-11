export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";
import { hasEmail, sendPasswordReset } from "@/lib/email";

export async function POST(request) {
  const { username } = await request.json();
  const uname = (username ?? "").trim().toLowerCase();
  if (!uname) return NextResponse.json({ error: "กรุณาระบุ username" }, { status: 400 });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  if (hasSupabase) {
    const db = createServiceClient();
    const { data: user } = await db
      .from("users")
      .select("id, email, username, name_th")
      .eq("username", uname)
      .eq("is_active", true)
      .maybeSingle();

    // Always ok=true — prevents username enumeration
    if (user) {
      await db.from("users").update({ reset_token: token, reset_expires_at: expires }).eq("id", user.id);

      if (hasEmail && user.email) {
        await sendPasswordReset({ to: user.email, username: user.username, token });
        return NextResponse.json({ ok: true, sent: true });
      }
    }

    // Dev mode: return token directly when email not configured or user has no email
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({ ok: true, ...(isDev && user && { devToken: token }) });
  }

  // Mock fallback
  const user = Object.values(USERS).find(u => u.username === uname && u.isActive);
  if (user) {
    user.resetToken = token;
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    if (hasEmail && user.email) {
      await sendPasswordReset({ to: user.email, username: user.username, token });
      return NextResponse.json({ ok: true, sent: true });
    }
  }
  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json({ ok: true, ...(isDev && user && { devToken: token }) });
}
