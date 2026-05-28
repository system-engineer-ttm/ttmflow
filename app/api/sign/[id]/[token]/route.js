export const dynamic = "force-dynamic";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient, hasSupabase } from "@/lib/supabase";

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Look up the token row + parent request, with validity checks. */
async function loadToken(db, requestId, plaintext) {
  const tokenHash = sha256(plaintext);
  const { data: tok } = await db
    .from("signing_tokens").select("*").eq("token_hash", tokenHash).maybeSingle();
  if (!tok) return { error: "invalid", status: 404 };
  if (tok.request_id !== requestId) return { error: "invalid", status: 404 };
  if (tok.used_at) return { error: "used", status: 410, token: tok };
  if (new Date(tok.expires_at).getTime() < Date.now()) return { error: "expired", status: 410, token: tok };
  return { token: tok };
}

/* ── GET /api/sign/[id]/[token] ──
   Public — anyone with the link gets a sanitized preview of the request.
*/
export async function GET(request, { params }) {
  if (!hasSupabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const db = createServiceClient();
  const { token: tok, error, status } = await loadToken(db, params.id, params.token);
  if (error) return NextResponse.json({ error, message: errorMessage(error) }, { status });

  // Record open event (first time only — keep first IP/UA)
  if (!tok.opened_at) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ua = request.headers.get("user-agent") || "";
    await db.from("signing_tokens")
      .update({ opened_at: new Date().toISOString(), open_ip: ip, open_ua: ua.slice(0, 500) })
      .eq("id", tok.id);
  }

  const { data: req } = await db
    .from("requests")
    .select("id, template, title_th, title_en, payload, steps, status, created_at")
    .eq("id", params.id).maybeSingle();
  if (!req) return NextResponse.json({ error: "invalid" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    request: {
      id: req.id,
      template: req.template,
      titleTh: req.title_th,
      titleEn: req.title_en,
      status: req.status,
      createdAt: req.created_at,
    },
    token: {
      stepIdx: tok.step_idx,
      recipientName: tok.recipient_name,
      recipientTitle: tok.recipient_title,
      expiresAt: tok.expires_at,
    },
  });
}

/* ── POST /api/sign/[id]/[token] ──
   Public — submit signature image to consume the token.
   Body: { signature: "data:image/png;base64,..." }
*/
export async function POST(request, { params }) {
  if (!hasSupabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const db = createServiceClient();
  const { token: tok, error, status } = await loadToken(db, params.id, params.token);
  if (error) return NextResponse.json({ error, message: errorMessage(error) }, { status });

  const body = await request.json().catch(() => null);
  const sig = body?.signature;
  if (!sig || typeof sig !== "string" || !sig.startsWith("data:image/")) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  if (sig.length > 700_000) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  // 1) update the token row → mark used, store signature
  const now = new Date().toISOString();
  const { error: tErr } = await db
    .from("signing_tokens")
    .update({ used_at: now, signature: sig })
    .eq("id", tok.id);
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // 2) update the step in requests.steps to reflect the signature
  const { data: req } = await db
    .from("requests").select("steps, status, current_step")
    .eq("id", params.id).maybeSingle();
  if (req) {
    const steps = Array.isArray(req.steps) ? [...req.steps] : [];
    if (steps[tok.step_idx]) {
      steps[tok.step_idx] = {
        ...steps[tok.step_idx],
        action: "received",
        at: now.slice(0, 16).replace("T", " "),
        signed: true,
        signature: sig,
      };
    }
    // If this was the LAST step, complete the request
    const isLast = tok.step_idx >= steps.length - 1;
    const updates = { steps, updated_at: now };
    if (isLast && req.status === "pending") {
      updates.status = "done";
    } else if (!isLast) {
      // advance currentStep past the external step if needed
      const nextIdx = tok.step_idx + 1;
      if ((req.current_step ?? 0) <= tok.step_idx) updates.current_step = nextIdx;
      if (steps[nextIdx]) steps[nextIdx] = { ...steps[nextIdx], action: "pending" };
    }
    await db.from("requests").update(updates).eq("id", params.id);
  }

  return NextResponse.json({ ok: true });
}

function errorMessage(code) {
  switch (code) {
    case "invalid": return "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก / Invalid or revoked link";
    case "expired": return "ลิงก์หมดอายุแล้ว / Link has expired";
    case "used":    return "ลิงก์นี้ถูกใช้ไปแล้ว / Link has already been used";
    default:        return "Unknown error";
  }
}
