export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { shortFormCode } from "@/lib/data";
import { peekDocNo } from "@/lib/docNumber";

async function getMe() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── POST /api/forms/[code]/next-number ──
   PREVIEW only — returns what the next running number would look like WITHOUT
   consuming it. The number is actually allocated server-side at save time in
   POST /api/requests, so abandoned/cancelled drafts no longer create gaps. */
export async function POST(_, { params }) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  if (!hasSupabase) {
    const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return NextResponse.json({ docNo: `${shortFormCode(params.code)}-${yymmdd}-0001`, preview: true });
  }

  const db = createServiceClient();
  const docNo = await peekDocNo(db, params.code, now);
  return NextResponse.json({ docNo, preview: true });
}
