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
  if (resetMode === "year")  return String(now.getFullYear());
  if (resetMode === "month") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return "never";
}

/* ── POST /api/forms/[code]/next-number ──
   Reserves the next running number for this form template.
   Atomic-ish: reads current, increments, writes back. Acceptable for low
   concurrent volumes; for higher volume promote to a Postgres RPC.

   Returns: { docNo, current }
*/
export async function POST(_, { params }) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSupabase) {
    // Fallback: timestamp-based unique number
    const now = new Date();
    const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const n = String(Math.floor(Math.random() * 9000) + 1000);
    return NextResponse.json({ docNo: `${shortFormCode(params.code)}-${yymmdd}-${n}`, current: 0 });
  }

  const db = createServiceClient();
  const { data: tmpl, error: rErr } = await db
    .from("form_templates")
    .select("code, numbering")
    .eq("code", params.code)
    .maybeSingle();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });
  if (!tmpl) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  // Default numbering settings if missing
  const numbering = tmpl.numbering || { reset: "year", digits: 4, current: 0, lastResetPeriod: "" };
  const reset = numbering.reset || "year";
  const digits = Number(numbering.digits) || 4;
  const now = new Date();
  const currentPeriod = periodKey(reset, now);

  // Reset counter if period changed
  let nextNum = Number(numbering.current) || 0;
  if (numbering.lastResetPeriod !== currentPeriod) {
    nextNum = 0;
  }
  nextNum += 1;

  const newNumbering = {
    ...numbering,
    current: nextNum,
    lastResetPeriod: currentPeriod,
  };

  const { error: uErr } = await db
    .from("form_templates")
    .update({ numbering: newNumbering, updated_at: new Date().toISOString() })
    .eq("code", params.code);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  // Build doc number string: PREFIX-YYMMDD-NNNN
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const padded = String(nextNum).padStart(digits, "0");
  const docNo = `${shortFormCode(params.code)}-${yymmdd}-${padded}`;

  return NextResponse.json({ docNo, current: nextNum });
}
