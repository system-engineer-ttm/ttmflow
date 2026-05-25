export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { REQUESTS } from "@/lib/data";

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
    createdAt: typeof r.created_at === "string" ? r.created_at.replace("T", " ").slice(0, 16) : r.created_at,
    updatedAt: typeof r.updated_at === "string" ? r.updated_at.replace("T", " ").slice(0, 16) : r.updated_at,
  };
}

/* ── GET /api/requests/[id] ── */
export async function GET(_, { params }) {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db.from("requests").select("*").eq("id", params.id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rowToReq(data));
  }
  const r = REQUESTS.find(x => x.id === params.id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(r);
}

/* ── PUT /api/requests/[id] ── (update status / steps / approve / reject) */
export async function PUT(request, { params }) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const updates = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) updates.status = body.status;
    if (body.currentStep !== undefined) updates.current_step = body.currentStep;
    if (body.steps !== undefined) updates.steps = body.steps;
    if (body.payload !== undefined) updates.payload = body.payload;
    if (body.links !== undefined) updates.links = body.links;
    if (body.rejectReason !== undefined) updates.reject_reason = body.rejectReason;
    if (body.priority !== undefined) updates.priority = body.priority;

    const { data, error } = await db.from("requests")
      .update(updates).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(rowToReq(data));
  }

  const r = REQUESTS.find(x => x.id === params.id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  Object.assign(r, body, { updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
  return NextResponse.json(r);
}

/* ── DELETE /api/requests/[id] ── (admin only) */
export async function DELETE(_, { params }) {
  const me = await getUser();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (hasSupabase) {
    const db = createServiceClient();
    const { error } = await db.from("requests").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
