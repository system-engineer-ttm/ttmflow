export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { NOTIFICATIONS } from "@/lib/data";

async function getUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

function rowToNotif(r) {
  return {
    id: r.id, channel: r.channel, to: r.recipient, subject: r.subject,
    status: r.status, reqId: r.req_id,
    at: typeof r.created_at === "string" ? r.created_at.replace("T", " ").slice(0, 16) : r.created_at,
  };
}

/* ── GET /api/notifications ── */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");

  if (hasSupabase) {
    const db = createServiceClient();
    let q = db.from("notifications").select("*").order("created_at", { ascending: false });
    if (channel && channel !== "all") q = q.eq("channel", channel);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(rowToNotif));
  }

  const list = channel && channel !== "all" ? NOTIFICATIONS.filter(n => n.channel === channel) : NOTIFICATIONS;
  return NextResponse.json(list);
}

/* ── POST /api/notifications ── (log new notification) */
export async function POST(request) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (hasSupabase) {
    const db = createServiceClient();
    const id = body.id || `N-${Date.now().toString().slice(-6)}`;
    const row = {
      id,
      channel: body.channel,
      recipient: body.to ?? body.recipient ?? "",
      subject: body.subject ?? "",
      status: body.status ?? "delivered",
      req_id: body.reqId ?? null,
    };
    const { data, error } = await db.from("notifications").insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(rowToNotif(data));
  }

  const newN = { ...body, id: body.id || `N-${Date.now().toString().slice(-6)}`, at: new Date().toISOString().slice(0, 16).replace("T", " ") };
  NOTIFICATIONS.unshift(newN);
  return NextResponse.json(newN);
}
