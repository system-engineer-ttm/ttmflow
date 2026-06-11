export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";

/* PUT /api/users/[id]/force-logout — admin: invalidate all sessions for a user */
export async function PUT(request, { params }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const auth = token ? await verifyToken(token) : null;
  if (!auth || auth.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { error } = await db
      .from("users")
      .update({ force_logout_at: new Date().toISOString() })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // Mock fallback
  const user = USERS[params.id];
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  user.forceLogoutAt = new Date();
  return NextResponse.json({ ok: true });
}
