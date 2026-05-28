export const dynamic = "force-dynamic";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";

async function getMe() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function genToken() {
  // 32-byte random → 64 hex chars
  return crypto.randomBytes(32).toString("hex");
}

/** Authorization: any user who has signed at least one step on this request,
 *  or an admin, may create/view tokens for external signer steps.
 */
function canManageTokens(req, me) {
  if (!me) return false;
  if (me.role === "admin") return true;
  return (req.steps || []).some(s => s.user === me.id && s.signed === true);
}

/* ── GET /api/requests/[id]/signing-tokens ──
   List existing tokens for this request (returns tokens WITHOUT plaintext —
   plaintext is only returned at creation time).
*/
export async function GET(_, { params }) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSupabase) return NextResponse.json({ tokens: [] });

  const db = createServiceClient();
  const { data: r } = await db.from("requests").select("steps").eq("id", params.id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageTokens({ steps: r.steps || [] }, me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await db
    .from("signing_tokens")
    .select("id, step_idx, recipient_name, recipient_title, expires_at, used_at, opened_at, created_at, signature")
    .eq("request_id", params.id)
    .order("id", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    tokens: data.map(t => ({
      id: t.id, stepIdx: t.step_idx,
      recipientName: t.recipient_name, recipientTitle: t.recipient_title,
      expiresAt: t.expires_at, usedAt: t.used_at, openedAt: t.opened_at,
      createdAt: t.created_at, hasSignature: !!t.signature,
    })),
  });
}

/* ── POST /api/requests/[id]/signing-tokens ──
   Generate a new token for an external step.
   Body: { stepIdx: number, expiresInDays?: number }
   Returns: { url, token, ... } — token plaintext is shown ONCE here.
*/
export async function POST(request, { params }) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSupabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const stepIdx = Number.isInteger(body.stepIdx) ? body.stepIdx : null;
  const expiresInDays = Number.isFinite(body.expiresInDays) ? Number(body.expiresInDays) : 7;
  if (stepIdx == null || stepIdx < 0) {
    return NextResponse.json({ error: "Invalid stepIdx" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: r, error: rErr } = await db
    .from("requests").select("id, steps, status").eq("id", params.id).maybeSingle();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageTokens({ steps: r.steps || [] }, me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const step = (r.steps || [])[stepIdx];
  if (!step) return NextResponse.json({ error: "Step not found" }, { status: 404 });
  if (step.source !== "external") {
    return NextResponse.json({ error: "Step is not external" }, { status: 400 });
  }
  if (step.signed) {
    return NextResponse.json({ error: "Step is already signed" }, { status: 409 });
  }

  const plaintext = genToken();
  const tokenHash = sha256(plaintext);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("signing_tokens")
    .insert({
      request_id: params.id,
      step_idx: stepIdx,
      token_hash: tokenHash,
      recipient_name: step.displayName || "",
      recipient_title: step.displayTitle || "",
      expires_at: expiresAt,
      created_by: me.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build URL — host taken from request headers
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:3000";
  const url = `${proto}://${host}/sign/${encodeURIComponent(params.id)}/${plaintext}`;

  return NextResponse.json({
    id: data.id,
    token: plaintext,       // shown ONCE — caller must capture it (URL contains it)
    url,
    expiresAt,
    stepIdx,
  });
}

/* ── DELETE /api/requests/[id]/signing-tokens?id=N ──
   Revoke an unused token (admin / creator only).
*/
export async function DELETE(request, { params }) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSupabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing token id" }, { status: 400 });

  const db = createServiceClient();
  const { data: r } = await db.from("requests").select("steps").eq("id", params.id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageTokens({ steps: r.steps || [] }, me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await db
    .from("signing_tokens")
    .delete()
    .eq("id", id)
    .eq("request_id", params.id)
    .is("used_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
