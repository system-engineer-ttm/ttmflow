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
    return NextResponse.json({
      user: {
        id: u.id, nameTh: u.name_th, nameEn: u.name_en,
        titleTh: u.title_th, titleEn: u.title_en,
        dept: u.dept, avatar: u.avatar, color: u.color,
        username: u.username, role: u.role, isActive: u.is_active,
        signature: u.signature || null,
        hasSignature: !!u.signature,
      },
    });
  }

  /* ── Mock fallback ── */
  const user = Object.values(USERS).find((u) => u.id === payload.id);
  return NextResponse.json({ user: user ?? null });
}
