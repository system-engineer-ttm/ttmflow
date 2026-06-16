export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { POSITIONS } from "@/lib/data";

async function getRole() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role ?? null;
}

/* Next POSxxx id from the max existing suffix — count-based ids collide after deletes */
async function nextPositionId(db) {
  const { data } = await db.from("positions").select("id").like("id", "POS%");
  const max = (data ?? []).reduce((m, r) => {
    const n = parseInt(r.id.slice(3), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `POS${String(max + 1).padStart(3, "0")}`;
}

/* ── GET /api/positions ── (any signed-in user can read the list) */
export async function GET() {
  if (hasSupabase) {
    const db = createServiceClient();
    const { data, error } = await db
      .from("positions")
      .select("id,name_th,name_en,sort_order")
      .order("sort_order", { ascending: true })
      .order("name_en", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data.map(toPosition));
  }
  return NextResponse.json(POSITIONS);
}

/* ── POST /api/positions ── (admin only) */
export async function POST(request) {
  if (await getRole() !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const nameTh = (body.nameTh ?? "").trim();
  const nameEn = (body.nameEn ?? "").trim();
  if (!nameTh && !nameEn)
    return NextResponse.json({ error: "ต้องระบุชื่อตำแหน่ง / Position name required" }, { status: 400 });

  if (hasSupabase) {
    const db = createServiceClient();
    const id = await nextPositionId(db);
    const { data, error } = await db.from("positions").insert({
      id,
      name_th: nameTh || nameEn,
      name_en: nameEn || nameTh,
      sort_order: Number.isFinite(body.sortOrder) ? body.sortOrder : 999,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(toPosition(data));
  }

  // Mock fallback
  const max = POSITIONS.reduce((m, p) => {
    const n = parseInt(p.id.slice(3), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  const pos = {
    id: `POS${String(max + 1).padStart(3, "0")}`,
    nameTh: nameTh || nameEn, nameEn: nameEn || nameTh,
    sortOrder: Number.isFinite(body.sortOrder) ? body.sortOrder : 999,
  };
  POSITIONS.push(pos);
  return NextResponse.json(pos);
}

function toPosition(p) {
  return { id: p.id, nameTh: p.name_th, nameEn: p.name_en, sortOrder: p.sort_order };
}
