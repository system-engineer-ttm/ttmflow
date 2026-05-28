export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";

async function getMe() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── GET /api/users/me/signature ── */
export async function GET() {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasSupabase) {
    return NextResponse.json({ signature: null, hasSignature: false });
  }
  const db = createServiceClient();
  const { data, error } = await db
    .from("users").select("signature").eq("id", me.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    signature: data?.signature || null,
    hasSignature: !!data?.signature,
  });
}

/* ── PUT /api/users/me/signature ──
   Body: { signature: "data:image/png;base64,..." }
*/
export async function PUT(request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const sig = body?.signature;
  if (!sig || typeof sig !== "string" || !sig.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid signature payload" }, { status: 400 });
  }
  // Safety: cap size to ~500KB after base64 (~370KB raw)
  if (sig.length > 700_000) {
    return NextResponse.json({ error: "Signature too large" }, { status: 413 });
  }

  if (!hasSupabase) {
    return NextResponse.json({ ok: true, signature: sig });
  }
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .update({ signature: sig, updated_at: new Date().toISOString() })
    .eq("id", me.id)
    .select("signature")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, signature: data.signature });
}

/* ── DELETE /api/users/me/signature ── (clear signature) */
export async function DELETE() {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasSupabase) return NextResponse.json({ ok: true });
  const db = createServiceClient();
  const { error } = await db
    .from("users").update({ signature: null }).eq("id", me.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
