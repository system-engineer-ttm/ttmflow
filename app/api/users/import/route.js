export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { USERS, POSITIONS } from "@/lib/data";
import { nextUserId } from "@/lib/userId";

/* Build a case-insensitive lookup: position name (th or en) → { th, en } */
function buildPositionIndex(list) {
  const idx = new Map();
  for (const p of list) {
    const th = p.nameTh ?? p.name_th;
    const en = p.nameEn ?? p.name_en;
    if (th) idx.set(th.trim().toLowerCase(), { th, en: en || th });
    if (en) idx.set(en.trim().toLowerCase(), { th: th || en, en });
  }
  return idx;
}

/* Resolve a row's title: prefer the managed "position" column, matched against
   the positions list; fall back to legacy titleTh/titleEn columns. Unknown
   position text is kept as-is so it isn't lost. */
function resolveTitle(row, posIndex) {
  const posRaw = (row.position ?? "").trim();
  if (posRaw) {
    const match = posIndex.get(posRaw.toLowerCase());
    return match ? { titleTh: match.th, titleEn: match.en } : { titleTh: posRaw, titleEn: posRaw };
  }
  return { titleTh: (row.titleTh ?? "").trim(), titleEn: (row.titleEn ?? "").trim() };
}

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

    // Load positions to resolve the "position" column → title_th / title_en
    const { data: posData } = await db.from("positions").select("name_th,name_en");
    const posIndex = buildPositionIndex(posData ?? []);

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
      const { titleTh, titleEn } = resolveTitle(row, posIndex);

      try {
        const hash = await bcrypt.hash(row.password || "1234", 10);
        const newId = `USR${String(nextNum).padStart(3, "0")}`;

        const { data, error } = await db.from("users").insert({
          id: newId,
          name_th: nameTh,
          name_en: (row.nameEn ?? "").trim(),
          title_th: titleTh,
          title_en: titleEn,
          dept: (row.dept ?? "").trim(),
          avatar: "",
          color,
          username,
          password_hash: hash,
          role,
          is_active: true,
          email: (row.email ?? "").trim() || null,
          phone: (row.phone ?? "").trim() || null,
          line_id: (row.lineId ?? "").trim() || null,
          employee_id: (row.employeeId ?? "").trim() || null,
          must_change_password: true, // force change on first login
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
    const posIndex = buildPositionIndex(POSITIONS);
    let nextNum = Object.keys(USERS).length + 1;
    for (const row of rows) {
      const username = (row.username ?? "").trim().toLowerCase();
      const nameTh = (row.nameTh ?? "").trim();
      if (!username || !nameTh) {
        results.push({ username: username || "(empty)", ok: false, error: "nameTh and username are required" });
        continue;
      }
      const { titleTh, titleEn } = resolveTitle(row, posIndex);
      const newId = `USR${String(nextNum).padStart(3, "0")}`;
      USERS[newId] = {
        id: newId, nameTh, nameEn: row.nameEn ?? "", titleTh, titleEn,
        dept: row.dept ?? "", username,
        role: VALID_ROLES.includes(row.role) ? row.role : "requester",
        color: AVATAR_COLORS[nextNum % AVATAR_COLORS.length], isActive: true,
        email: (row.email ?? "").trim() || null,
        phone: (row.phone ?? "").trim() || null,
        lineId: (row.lineId ?? "").trim() || null,
        employeeId: (row.employeeId ?? "").trim() || null,
      };
      results.push({ username, ok: true, id: newId });
      nextNum++;
    }
  }

  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  return NextResponse.json({ succeeded, failed, results });
}
