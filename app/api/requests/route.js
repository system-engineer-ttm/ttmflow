export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { REQUESTS, fmtBKK } from "@/lib/data";

async function getUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

function rowToReq(r) {
  return {
    id: r.id, template: r.template,
    titleTh: r.title_th, titleEn: r.title_en,
    requester: r.requester, priority: r.priority,
    status: r.status, currentStep: r.current_step,
    steps: r.steps ?? [], payload: r.payload ?? {}, links: r.links ?? {},
    rejectReason: r.reject_reason ?? "",
    autoSpawned: r.auto_spawned === true,
    createdAt: fmtBKK(r.created_at) || r.created_at,
    updatedAt: fmtBKK(r.updated_at) || r.updated_at,
  };
}

/* ── GET /api/requests ── */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope"); // my | approvals | it | archive | all
  const me = await getUser();

  if (hasSupabase) {
    const db = createServiceClient();
    let query = db.from("requests").select("*").order("updated_at", { ascending: false });

    if (scope === "my" && me?.id) query = query.eq("requester", me.id);
    if (scope === "approvals") query = query.eq("status", "pending");
    if (scope === "it") query = query.in("status", ["pending", "inProgress", "approved"]);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(rowToReq));
  }

  let list = REQUESTS;
  if (scope === "my" && me?.id) list = list.filter(r => r.requester === me.id);
  if (scope === "approvals") list = list.filter(r => r.status === "pending");
  if (scope === "it") list = list.filter(r => ["pending", "inProgress", "approved"].includes(r.status));
  return NextResponse.json(list);
}

/* ── POST /api/requests ── (create new request) */
export async function POST(request) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const row = {
      id: body.id,
      template: body.template,
      title_th: body.titleTh ?? "",
      title_en: body.titleEn ?? "",
      requester: me.id,
      priority: body.priority ?? "normal",
      status: body.status ?? "pending",
      current_step: body.currentStep ?? 1,
      steps: body.steps ?? [],
      payload: body.payload ?? {},
      links: body.links ?? {},
    };
    const { data, error } = await db.from("requests").insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(rowToReq(data));
  }

  const newReq = {
    ...body, requester: me.id,
    createdAt: fmtBKK(),
    updatedAt: fmtBKK(),
  };
  REQUESTS.unshift(newReq);
  return NextResponse.json(newReq);
}
