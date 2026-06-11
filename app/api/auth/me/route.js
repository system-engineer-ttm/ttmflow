export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  /* ── Real DB ── */
  if (hasSupabase) {
    const db = createServiceClient();
    const { data: u } = await db
      .from("users")
      .select("*")
      .eq("id", payload.id)
      .maybeSingle();
    if (!u) return NextResponse.json({ user: null });

    // Session invalidation check: if admin force-logged-out this user after token was issued
    if (u.force_logout_at && payload.iat && new Date(u.force_logout_at) > new Date(payload.iat * 1000))
      return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: u.id, nameTh: u.name_th, nameEn: u.name_en,
        titleTh: u.title_th, titleEn: u.title_en,
        dept: u.dept, avatar: u.avatar, color: u.color,
        username: u.username, role: u.role, isActive: u.is_active,
        signature: u.signature || null, hasSignature: !!u.signature,
        email: u.email || null, phone: u.phone || null,
        lineId: u.line_id || null, employeeId: u.employee_id || null,
        lang: u.lang || "th",
        lastLoginAt: u.last_login_at || null,
      },
    });
  }

  /* ── Mock fallback ── */
  const user = Object.values(USERS).find((u) => u.id === payload.id);
  return NextResponse.json({ user: user ?? null });
}
