export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS } from "@/lib/data";
import { nextUserId } from "@/lib/userId";

async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const p = token ? await verifyToken(token) : null;
  return p?.role === "admin";
}

const VALID_ROLES = ["requester", "approver", "it", "admin", "auditor", "ticketreport"];
const AVATAR_COLORS = [
  "#3b82f6","#a855f7","#f59e0b","#0ea5e9","#10b981",
  "#06b6d4","#8b5cf6","#ec4899","#64748b","#0284c7",
];

/* ── POST /api/users/import ── */
export async function POST(request) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let rows;
  try {
    rows = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "Body must be a non-empty array of user rows" }, { status: 400 });

  const results = [];

  if (hasSupabase) {
    const db = createServiceClient();

    // Start from the max existing USR suffix — count-based ids collide after deletes
    let nextNum = parseInt((await nextUserId(db)).slice(3), 10);

    for (const row of rows) {
      const username = (row.username ?? "").trim().toLowerCase();
      const nameTh = (row.nameTh ?? "").trim();
      if (!username || !nameTh) {
        results.push({ username: username || "(empty)", ok: false, error: "nameTh and username are required" });
        continue;
      }
      const role = VALID_ROLES.includes(row.role) ? row.role : "requester";
      const color = AVATAR_COLORS[nextNum % AVATAR_COLORS.length];

      try {
        const hash = await bcrypt.hash(row.password || "1234", 10);
        const newId = `USR${String(nextNum).padStart(3, "0")}`;

        const { data, error } = await db.from("users").insert({
          id: newId,
          name_th: nameTh,
          name_en: (row.nameEn ?? "").trim(),
          title_th: (row.titleTh ?? "").trim(),
          title_en: (row.titleEn ?? "").trim(),
          dept: (row.dept ?? "").trim(),
          avatar: "",
          color,
          username,
          password_hash: hash,
          role,
          is_active: true,
        }).select("id,username").single();

        if (error) {
          results.push({ username, ok: false, error: error.message });
        } else {
          results.push({ username, ok: true, id: data.id });
          nextNum++;
        }
      } catch (e) {
        results.push({ username, ok: false, error: e.message });
      }
    }
  } else {
    // Mock fallback
    let nextNum = Object.keys(USERS).length + 1;
    for (const row of rows) {
      const username = (row.username ?? "").trim().toLowerCase();
      const nameTh = (row.nameTh ?? "").trim();
      if (!username || !nameTh) {
        results.push({ username: username || "(empty)", ok: false, error: "nameTh and username are required" });
        continue;
      }
      const newId = `USR${String(nextNum).padStart(3, "0")}`;
      USERS[newId] = {
        id: newId, nameTh, nameEn: row.nameEn ?? "", titleTh: row.titleTh ?? "",
        titleEn: row.titleEn ?? "", dept: row.dept ?? "", username,
        role: VALID_ROLES.includes(row.role) ? row.role : "requester",
        color: AVATAR_COLORS[nextNum % AVATAR_COLORS.length], isActive: true,
      };
      results.push({ username, ok: true, id: newId });
      nextNum++;
    }
  }

  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  return NextResponse.json({ succeeded, failed, results });
}
