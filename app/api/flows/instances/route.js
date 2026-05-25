export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { FLOW_INSTANCES } from "@/lib/data";

async function getUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

function rowToInst(r) {
  return {
    id: r.id, template: r.template,
    titleTh: r.title_th, titleEn: r.title_en,
    requester: r.requester, status: r.status,
    currentStepIdx: r.current_step_idx,
    stepStates: r.step_states ?? [],
    createdAt: typeof r.created_at === "string" ? r.created_at.replace("T", " ").slice(0, 16) : r.created_at,
    updatedAt: typeof r.updated_at === "string" ? r.updated_at.replace("T", " ").slice(0, 16) : r.updated_at,
  };
}

/* ── GET /api/flows/instances ── */
export async function GET() {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db.from("flow_instances").select("*").order("updated_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(rowToInst));
  }
  return NextResponse.json(FLOW_INSTANCES);
}

/* ── POST /api/flows/instances ── (start new flow) */
export async function POST(request) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const row = {
      id: body.id || `FL-${Date.now().toString().slice(-9)}`,
      template: body.template,
      title_th: body.titleTh ?? "",
      title_en: body.titleEn ?? "",
      requester: me.id,
      status: body.status ?? "active",
      current_step_idx: body.currentStepIdx ?? 0,
      step_states: body.stepStates ?? [],
    };
    const { data, error } = await db.from("flow_instances").insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(rowToInst(data));
  }

  const inst = { ...body, requester: me.id, id: body.id || `FL-${Date.now()}` };
  FLOW_INSTANCES.unshift(inst);
  return NextResponse.json(inst);
}
