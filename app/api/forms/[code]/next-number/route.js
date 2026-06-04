export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { shortFormCode } from "@/lib/data";

async function getMe() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

/* Compute current period key based on reset mode */
function periodKey(resetMode, now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  if (resetMode === "day")   return `${y}-${m}-${d}`;
  if (resetMode === "year")  return String(y);
  if (resetMode === "month") return `${y}-${m}`;
  return "never";
}

/* ── POST /api/forms/[code]/next-number ──
   Reserves the next running number for this form template.

   Two paths, picked automatically:
   (A) If form_templates.numbering exists, read/increment/write it
       respecting the configured reset cadence and digit width.
   (B) Fallback if numbering column is missing OR the configured-counter
       path errors: count existing rows in requests whose id starts with
       PREFIX-YYMMDD- and return count+1 padded to 4 digits.

   Path B always produces a clean 0001+ sequence — no random fallback,
   no need for the migration.
*/
export async function POST(_, { params }) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const prefix = shortFormCode(params.code);
  const todayPrefix = `${prefix}-${yymmdd}-`;

  if (!hasSupabase) {
    return NextResponse.json({ docNo: `${prefix}-${yymmdd}-0001`, current: 1 });
  }

  const db = createServiceClient();

  /* ── Path A: configured counter (requires numbering column) ── */
  let nextNum = null;
  try {
    const { data: tmpl, error: rErr } = await db
      .from("form_templates")
      .select("code, numbering")
      .eq("code", params.code)
      .maybeSingle();

    if (!rErr && tmpl) {
      const numbering = tmpl.numbering || { reset: "day", digits: 4, current: 0, lastResetPeriod: "" };
      const reset = numbering.reset || "day";
      const digits = Number(numbering.digits) || 4;
      const currentPeriod = periodKey(reset, now);

      let candidate = Number(numbering.current) || 0;
      if (numbering.lastResetPeriod !== currentPeriod) candidate = 0;
      candidate += 1;

      const { error: uErr } = await db
        .from("form_templates")
        .update({
          numbering: { ...numbering, current: candidate, lastResetPeriod: currentPeriod },
          updated_at: now.toISOString(),
        })
        .eq("code", params.code);

      if (!uErr) {
        const padded = String(candidate).padStart(digits, "0");
        return NextResponse.json({ docNo: `${prefix}-${yymmdd}-${padded}`, current: candidate });
      }
    }
  } catch (_) {
    // Fall through to Path B
  }

  /* ── Path B: count-based fallback (works without the numbering column) ── */
  try {
    const { count, error: cErr } = await db
      .from("requests")
      .select("id", { count: "exact", head: true })
      .like("id", `${todayPrefix}%`);
    if (cErr) throw cErr;
    nextNum = (count ?? 0) + 1;
  } catch (_) {
    nextNum = 1;
  }

  const padded = String(nextNum).padStart(4, "0");
  return NextResponse.json({ docNo: `${prefix}-${yymmdd}-${padded}`, current: nextNum });
}
