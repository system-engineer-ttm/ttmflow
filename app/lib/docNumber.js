import { shortFormCode } from "@/lib/data";

/* Current period key for the configured reset cadence */
function periodKey(resetMode, now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  if (resetMode === "day")   return `${y}-${m}-${d}`;
  if (resetMode === "year")  return String(y);
  if (resetMode === "month") return `${y}-${m}`;
  return "never";
}

function yymmddOf(now) {
  return `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

/* ── allocateDocNo ──
   Allocates (consumes) the next running document number for a form template.
   Call this only when a request is actually being saved — never on form open —
   so cancelled/abandoned drafts don't burn numbers and leave gaps.

   Two paths, picked automatically:
   (A) form_templates.numbering counter — read/increment/write respecting the
       configured reset cadence + digit width.
   (B) Fallback: count existing requests rows whose id starts with PREFIX-YYMMDD-
       and use count+1 padded to 4 digits.

   Returns the docNo string, e.g. "IT01-260616-0001".
*/
export async function allocateDocNo(db, code, now = new Date()) {
  const yymmdd = yymmddOf(now);
  const prefix = shortFormCode(code);
  const todayPrefix = `${prefix}-${yymmdd}-`;

  /* Path A: configured counter */
  try {
    const { data: tmpl, error: rErr } = await db
      .from("form_templates")
      .select("code, numbering")
      .eq("code", code)
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
        .eq("code", code);

      if (!uErr) return `${prefix}-${yymmdd}-${String(candidate).padStart(digits, "0")}`;
    }
  } catch (_) {
    // fall through to Path B
  }

  /* Path B: count-based fallback */
  let nextNum;
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
  return `${prefix}-${yymmdd}-${String(nextNum).padStart(4, "0")}`;
}

/* ── peekDocNo ──
   Non-consuming preview of what the next number would roughly look like.
   Does NOT increment any counter, so two callers may see the same value.
   Use only for display hints, never as the saved id. */
export async function peekDocNo(db, code, now = new Date()) {
  const yymmdd = yymmddOf(now);
  const prefix = shortFormCode(code);
  const todayPrefix = `${prefix}-${yymmdd}-`;

  try {
    const { data: tmpl } = await db
      .from("form_templates")
      .select("numbering")
      .eq("code", code)
      .maybeSingle();
    if (tmpl?.numbering) {
      const n = tmpl.numbering;
      const reset = n.reset || "day";
      const digits = Number(n.digits) || 4;
      let candidate = Number(n.current) || 0;
      if (n.lastResetPeriod !== periodKey(reset, now)) candidate = 0;
      return `${prefix}-${yymmdd}-${String(candidate + 1).padStart(digits, "0")}`;
    }
  } catch (_) { /* fall through */ }

  let nextNum;
  try {
    const { count } = await db
      .from("requests")
      .select("id", { count: "exact", head: true })
      .like("id", `${todayPrefix}%`);
    nextNum = (count ?? 0) + 1;
  } catch (_) {
    nextNum = 1;
  }
  return `${prefix}-${yymmdd}-${String(nextNum).padStart(4, "0")}`;
}
