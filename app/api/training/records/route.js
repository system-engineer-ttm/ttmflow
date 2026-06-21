export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";

async function getMe() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

/* DB row → camelCase record used by the dashboard */
function rowToRec(r) {
  return {
    id: r.id,
    userId: r.user_id, name: r.name, empId: r.emp_id, dept: r.dept,
    preScore: r.pre_score, postBest: r.post_best, postLast: r.post_last,
    total: r.total, attempts: r.attempts, passed: r.passed,
    scorePct: r.score_pct, thresholdPct: r.threshold_pct,
    startedAt: r.started_at, completedAt: r.completed_at,
  };
}

/* In-memory fallback when Supabase isn't configured (local dev) */
const MOCK = [];

/* ── GET /api/training/records ── (admin/auditor only — KPI dashboard) */
export async function GET() {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin" && me.role !== "auditor")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!hasSupabase) return NextResponse.json(MOCK);

  const db = createServiceClient();
  const { data, error } = await db
    .from("training_records")
    .select("*")
    .order("completed_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(rowToRec));
}

/* ── POST /api/training/records ── (save a completed attempt) */
export async function POST(request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json();
  const row = {
    user_id: me.id,
    name: (b.name ?? "").trim(),
    emp_id: (b.empId ?? "").trim(),
    dept: (b.dept ?? "").trim(),
    pre_score: b.preScore ?? null,
    post_best: b.postBest ?? null,
    post_last: b.postLast ?? null,
    total: b.total ?? null,
    attempts: b.attempts ?? null,
    passed: !!b.passed,
    score_pct: b.scorePct ?? null,
    threshold_pct: b.thresholdPct ?? null,
    started_at: b.startedAt ?? null,
    completed_at: b.completedAt ?? new Date().toISOString(),
  };

  if (!hasSupabase) {
    const rec = { id: `MOCK-${MOCK.length + 1}`, ...rowToRec({ ...row, ...row }) };
    MOCK.push({ ...rowToRec(row), id: rec.id });
    return NextResponse.json({ ok: true, id: rec.id });
  }

  const db = createServiceClient();
  const { data, error } = await db.from("training_records").insert(row).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}
