"use client";
import React from "react";
import { Icon } from "./Icon";
import { Avatar, cls } from "./Ui";

/* ── API helpers ── */
async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

/* ── colour options for avatar ── */
const AVATAR_COLORS = [
  "#3b82f6","#a855f7","#f59e0b","#0ea5e9","#10b981",
  "#06b6d4","#8b5cf6","#ec4899","#64748b","#0284c7",
  "#0369a1","#0d9488","#14b8a6","#059669","#e11d48",
];

const ROLES = ["requester","approver","it","admin","auditor","ticketreport"];

const ROLE_LABEL = {
  th: { requester:"พนักงาน", approver:"ผู้อนุมัติ", it:"ทีม IT", admin:"Admin / QMR", auditor:"Auditor", ticketreport:"รายงาน Ticket" },
  en: { requester:"Employee", approver:"Approver",  it:"IT Staff", admin:"Admin / QMR", auditor:"Auditor", ticketreport:"Ticket Report" },
};

/* Labels for each permission row */
const PERM_ROWS = [
  { key:"dashboard",    th:"แดชบอร์ด",               en:"Dashboard" },
  { key:"flows",        th:"ขั้นตอนงาน (Flows)",      en:"Flows" },
  { key:"new",          th:"สร้างคำขอใหม่",            en:"New Request" },
  { key:"my",           th:"คำขอของฉัน",              en:"My Requests" },
  { key:"approvals",    th:"รออนุมัติ",               en:"Approvals" },
  { key:"it",           th:"งานที่ได้รับมอบหมาย",     en:"IT Queue" },
  { key:"archive",      th:"คลังเอกสาร",              en:"Archive" },
  { key:"notif",        th:"บันทึกการแจ้งเตือน",      en:"Notification Log" },
  { key:"caseSummary",  th:"Service Ticket Summary",  en:"Service Ticket Summary" },
  { key:"settings",     th:"ตั้งค่าฟอร์ม",           en:"Form Templates" },
  { key:"integrations", th:"เชื่อมต่อการแจ้งเตือน",   en:"Integrations" },
  { key:"users",        th:"จัดการผู้ใช้งาน",         en:"User Management" },
];

/* ── blank user template ── */
function blankUser() {
  return {
    nameTh:"", nameEn:"", titleTh:"", titleEn:"",
    dept:"", username:"", password:"",
    role:"requester", color: AVATAR_COLORS[0], isActive: true,
  };
}

/* ── derive avatar initials ── */
function initials(nameTh, nameEn) {
  const src = nameEn || nameTh || "??";
  const parts = src.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : src.slice(0, 2).toUpperCase();
}

/* ──────────────────────────────────────────────────────────────────────────
   UserManagement — main export
   ────────────────────────────────────────────────────────────────────────── */
export function UserManagement({ lang }) {
  const [tab, setTab] = React.useState("members");
  const [, forceRender] = React.useState(0);
  const refresh = () => forceRender((v) => v + 1);

  return (
    <div className="ttm-um-page">
      {/* Tab bar */}
      <div className="ttm-um-tabs">
        <button className={cls("ttm-um-tab", tab === "members" && "is-active")} onClick={() => setTab("members")}>
          <Icon name="users" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {lang === "th" ? "สมาชิก" : "Members"}
        </button>
        <button className={cls("ttm-um-tab", tab === "permissions" && "is-active")} onClick={() => setTab("permissions")}>
          <Icon name="shield-check" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {lang === "th" ? "สิทธิ์การเข้าถึงเมนู" : "Menu Permissions"}
        </button>
      </div>

      {tab === "members"
        ? <MembersTab lang={lang} refresh={refresh} />
        : <PermissionsTab lang={lang} refresh={refresh} />
      }
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MembersTab
   ────────────────────────────────────────────────────────────────────────── */
function MembersTab({ lang, refresh }) {
  const [search, setSearch] = React.useState("");
  const [modal, setModal] = React.useState(null);
  const [deleteId, setDeleteId] = React.useState(null);
  const [allUsers, setAllUsers] = React.useState([]);
  const [loadingList, setLoadingList] = React.useState(true);

  const loadUsers = React.useCallback(() => {
    setLoadingList(true);
    apiFetch("/api/users")
      .then(setAllUsers)
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  React.useEffect(() => { loadUsers(); }, [loadUsers]);

  const users = allUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.nameTh ?? "").includes(q) || (u.nameEn ?? "").toLowerCase().includes(q) ||
      (u.username ?? "").includes(q) || (u.dept ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Toolbar */}
      <div className="ttm-um-toolbar">
        <span className="ttm-um-title">
          {lang === "th"
            ? `ผู้ใช้งานทั้งหมด (${allUsers.length} คน)`
            : `All users (${allUsers.length})`}
        </span>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div className="ttm-um-search-wrap">
            <Icon name="search" size={14} />
            <input
              placeholder={lang === "th" ? "ค้นหาชื่อ, แผนก…" : "Search name, dept…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="ttm-btn ttm-btn-primary" style={{ display:"flex", alignItems:"center", gap:6 }}
            onClick={() => setModal({ mode:"add" })}>
            <Icon name="plus" size={15} />
            {lang === "th" ? "เพิ่มผู้ใช้" : "Add user"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ttm-card" style={{ overflow:"auto", padding:0 }}>
        <table className="ttm-um-table">
          <thead>
            <tr>
              <th>{lang === "th" ? "ผู้ใช้" : "User"}</th>
              <th>{lang === "th" ? "แผนก" : "Department"}</th>
              <th>{lang === "th" ? "บทบาท" : "Role"}</th>
              <th>{lang === "th" ? "ชื่อผู้ใช้" : "Username"}</th>
              <th>{lang === "th" ? "สถานะ" : "Status"}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Avatar user={u} size={34} />
                    <div>
                      <div style={{ fontWeight:600, fontSize:"0.875rem" }}>
                        {lang === "th" ? u.nameTh : u.nameEn}
                      </div>
                      <div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>
                        {lang === "th" ? u.titleTh : u.titleEn}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize:"0.8125rem", color:"var(--muted)" }}>{u.dept}</td>
                <td><RoleBadge role={u.role} lang={lang} /></td>
                <td style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"0.8125rem" }}>{u.username}</td>
                <td>
                  <span className={cls("ttm-active-dot", u.isActive ? "on" : "off")}>
                    {u.isActive
                      ? (lang === "th" ? "ใช้งาน" : "Active")
                      : (lang === "th" ? "ปิดใช้งาน" : "Inactive")}
                  </span>
                </td>
                <td>
                  <div className="ttm-um-actions">
                    <button className="ttm-um-action-btn" title={lang === "th" ? "แก้ไข" : "Edit"}
                      onClick={() => setModal({ mode:"edit", userId: u.id })}>
                      <Icon name="edit" size={14} />
                    </button>
                    <button className="ttm-um-action-btn danger" title={lang === "th" ? "ลบ" : "Delete"}
                      onClick={() => setDeleteId(u.id)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign:"center", color:"var(--muted)", padding:"2rem" }}>
                  {lang === "th" ? "ไม่พบผู้ใช้งาน" : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <UserModal
          lang={lang}
          mode={modal.mode}
          user={modal.mode === "edit" ? allUsers.find(u => u.id === modal.userId) : null}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            try {
              if (modal.mode === "add") {
                await apiFetch("/api/users", { method: "POST", body: JSON.stringify(data) });
              } else {
                await apiFetch(`/api/users/${modal.userId}`, { method: "PUT", body: JSON.stringify(data) });
              }
              loadUsers(); refresh(); setModal(null);
            } catch (e) { alert(e.message); }
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmModal
          lang={lang}
          message={
            lang === "th"
              ? `ต้องการลบ "${allUsers.find(u => u.id === deleteId)?.nameTh}" ออกจากระบบหรือไม่?`
              : `Remove "${allUsers.find(u => u.id === deleteId)?.nameEn}" from the system?`
          }
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => {
            try {
              await apiFetch(`/api/users/${deleteId}`, { method: "DELETE" });
              setDeleteId(null); loadUsers(); refresh();
            } catch (e) { alert(e.message); }
          }}
        />
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   UserModal — Add / Edit
   ────────────────────────────────────────────────────────────────────────── */
function UserModal({ lang, mode, user: existing, onClose, onSave }) {
  const [form, setForm] = React.useState(existing
    ? { nameTh: existing.nameTh ?? "", nameEn: existing.nameEn ?? "",
        titleTh: existing.titleTh ?? "", titleEn: existing.titleEn ?? "",
        dept: existing.dept ?? "", username: existing.username ?? "",
        password: "", role: existing.role ?? "requester",
        color: existing.color ?? AVATAR_COLORS[0], isActive: existing.isActive !== false }
    : blankUser()
  );
  const [showPw, setShowPw] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nameTh.trim()) e.nameTh = true;
    if (!form.username.trim()) e.username = true;
    if (mode === "add" && !form.password) e.password = true;
    // (username uniqueness is enforced server-side)
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...form,
      username: form.username.trim().toLowerCase(),
      // Keep existing password if blank during edit
      password: form.password || (existing?.password ?? "1234"),
    });
  };

  const isAdd = mode === "add";
  const th = lang === "th";

  return (
    <div className="ttm-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ttm-modal">
        <div className="ttm-modal-head">
          <h3>{isAdd ? (th ? "เพิ่มผู้ใช้งานใหม่" : "Add new user") : (th ? "แก้ไขข้อมูลผู้ใช้" : "Edit user")}</h3>
          <button className="ttm-icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="ttm-modal-body">
          {/* Preview avatar */}
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0.75rem", background:"var(--surface-2)", borderRadius:10 }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background: form.color,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"#fff", fontWeight:700, fontSize:"1rem" }}>
              {initials(form.nameTh, form.nameEn)}
            </div>
            <div>
              <div style={{ fontWeight:600 }}>{form.nameTh || (th ? "(ยังไม่ระบุชื่อ)" : "(no name yet)")}</div>
              <div style={{ fontSize:"0.8rem", color:"var(--muted)" }}>{form.username || "username"}</div>
            </div>
          </div>

          {/* Name row */}
          <div className="ttm-mf-row">
            <div className="ttm-mf-group">
              <label className="req">{th ? "ชื่อ-นามสกุล (ภาษาไทย)" : "Full name (Thai)"}</label>
              <input className={cls("ttm-mf-input", errors.nameTh && "is-error")}
                value={form.nameTh} onChange={(e) => set("nameTh", e.target.value)}
                placeholder="ชื่อ นามสกุล" />
              {errors.nameTh && <span style={{ fontSize:"0.75rem", color:"#be123c" }}>{th ? "กรุณาระบุชื่อ" : "Required"}</span>}
            </div>
            <div className="ttm-mf-group">
              <label>{th ? "ชื่อ-นามสกุล (English)" : "Full name (English)"}</label>
              <input className="ttm-mf-input" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="First Last" />
            </div>
          </div>

          {/* Title row */}
          <div className="ttm-mf-row">
            <div className="ttm-mf-group">
              <label>{th ? "ตำแหน่ง (ภาษาไทย)" : "Job title (Thai)"}</label>
              <input className="ttm-mf-input" value={form.titleTh} onChange={(e) => set("titleTh", e.target.value)} placeholder="ตำแหน่งงาน" />
            </div>
            <div className="ttm-mf-group">
              <label>{th ? "ตำแหน่ง (English)" : "Job title (English)"}</label>
              <input className="ttm-mf-input" value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} placeholder="Job Title" />
            </div>
          </div>

          {/* Dept + Role */}
          <div className="ttm-mf-row">
            <div className="ttm-mf-group">
              <label>{th ? "แผนก / ฝ่าย" : "Department"}</label>
              <input className="ttm-mf-input" value={form.dept} onChange={(e) => set("dept", e.target.value)} placeholder="Operations / IT / HR…" />
            </div>
            <div className="ttm-mf-group">
              <label className="req">{th ? "บทบาท" : "Role"}</label>
              <select className="ttm-mf-select" value={form.role} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[lang === "th" ? "th" : "en"][r]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Credentials */}
          <div className="ttm-mf-row">
            <div className="ttm-mf-group">
              <label className="req">{th ? "ชื่อผู้ใช้งาน" : "Username"}</label>
              <input className={cls("ttm-mf-input", (errors.username || errors.usernameTaken) && "is-error")}
                value={form.username} onChange={(e) => set("username", e.target.value.toLowerCase())}
                placeholder="username" autoComplete="off" />
              {errors.username && <span style={{ fontSize:"0.75rem", color:"#be123c" }}>{th ? "กรุณาระบุ Username" : "Required"}</span>}
              {errors.usernameTaken && <span style={{ fontSize:"0.75rem", color:"#be123c" }}>{th ? "Username นี้ถูกใช้งานแล้ว" : "Username already taken"}</span>}
            </div>
            <div className="ttm-mf-group">
              <label className={isAdd ? "req" : ""}>{th ? `รหัสผ่าน${isAdd ? "" : " (เว้นว่างเพื่อคงเดิม)"}` : `Password${isAdd ? "" : " (blank = keep current)"}`}</label>
              <div className="ttm-mf-pw">
                <input className={cls("ttm-mf-input", errors.password && "is-error")}
                  type={showPw ? "text" : "password"}
                  value={form.password} onChange={(e) => set("password", e.target.value)}
                  placeholder={isAdd ? "รหัสผ่าน" : "••••••••"} autoComplete="new-password" />
                <button type="button" className="ttm-mf-pw-toggle" onClick={() => setShowPw((v) => !v)}>
                  <Icon name={showPw ? "eye-off" : "eye"} size={15} />
                </button>
              </div>
              {errors.password && <span style={{ fontSize:"0.75rem", color:"#be123c" }}>{th ? "กรุณาระบุรหัสผ่าน" : "Required"}</span>}
            </div>
          </div>

          {/* Avatar color */}
          <div className="ttm-mf-group">
            <label>{th ? "สีอวตาร" : "Avatar color"}</label>
            <div className="ttm-color-swatches">
              {AVATAR_COLORS.map((c) => (
                <button key={c} type="button"
                  className={cls("ttm-color-swatch", form.color === c && "sel")}
                  style={{ background: c }}
                  onClick={() => set("color", c)}>
                  {form.color === c && <Icon name="check" size={12} stroke={3} style={{ color:"#fff" }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="ttm-mf-group" style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
            <input type="checkbox" id="um-active" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)}
              style={{ width:16, height:16, accentColor:"var(--brand)", cursor:"pointer" }} />
            <label htmlFor="um-active" style={{ cursor:"pointer", marginBottom:0, fontSize:"0.875rem" }}>
              {th ? "เปิดใช้งานบัญชี (Active)" : "Account active"}
            </label>
          </div>
        </div>

        <div className="ttm-modal-footer">
          <button className="ttm-btn ttm-btn-ghost" onClick={onClose}>{th ? "ยกเลิก" : "Cancel"}</button>
          <button className="ttm-btn ttm-btn-primary" onClick={handleSave}>
            {isAdd ? (th ? "เพิ่มผู้ใช้" : "Add user") : (th ? "บันทึก" : "Save changes")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   PermissionsTab — permission matrix
   ────────────────────────────────────────────────────────────────────────── */
function PermissionsTab({ lang, refresh }) {
  const [perms, setPerms] = React.useState(null); // null = loading
  const [saved, setSaved] = React.useState(false);

  const loadPerms = React.useCallback(() => {
    return apiFetch("/api/permissions").then(setPerms).catch(() => {});
  }, []);

  React.useEffect(() => { loadPerms(); }, [loadPerms]);

  const toggle = (route, role) => {
    setPerms((p) => {
      if (!p) return p;
      const routeRow = p[route] || {};            // ← guard: row may not exist yet
      return { ...p, [route]: { ...routeRow, [role]: !routeRow[role] } };
    });
    setSaved(false);
  };

  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Ensure every (route, role) cell has an explicit boolean — the API
      // upserts whatever rows we send, so undefined values would be dropped.
      const payload = {};
      PERM_ROWS.forEach(r => {
        payload[r.key] = {};
        ROLES.forEach(role => {
          payload[r.key][role] = perms?.[r.key]?.[role] === true;
        });
      });
      const res = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body.error || `HTTP ${res.status}`;
        const detail = body.details || body.hint || body.code || "";
        const full = detail ? `${msg}\n\n${detail}` : msg;
        alert((lang === "th" ? "บันทึกไม่สำเร็จ:\n" : "Save failed:\n") + full);
        return;
      }
      // Success — keep the "Saved!" badge visible for a clear 4 seconds so
      // the user can't miss it, and reload from the DB to prove it persisted.
      setSaved(true);
      try { await loadPerms(); } catch (_) { /* non-fatal */ }
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      alert((lang === "th" ? "บันทึกไม่สำเร็จ (network):\n" : "Save failed (network):\n") + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => { loadPerms(); setSaved(false); };

  const th = lang === "th";

  if (!perms) return (
    <div style={{ textAlign:"center", padding:"3rem", color:"var(--muted)" }}>
      {th ? "กำลังโหลด…" : "Loading…"}
    </div>
  );

  return (
    <div>
      <p className="ttm-perm-note">
        {th
          ? "กำหนดว่าแต่ละบทบาทสามารถเข้าถึงเมนูใดบ้าง ✓ = มีสิทธิ์เข้าถึง"
          : "Define which menus each role can access. ✓ = allowed"}
      </p>

      <div className="ttm-card" style={{ padding:0, overflow:"auto" }}>
        <div className="ttm-perm-wrap">
          <table className="ttm-perm-table">
            <thead>
              <tr>
                <th>{th ? "เมนู" : "Menu"}</th>
                {ROLES.map((r) => (
                  <th key={r}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <RoleBadge role={r} lang={lang} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_ROWS.map((row) => (
                <tr key={row.key}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <RouteIcon route={row.key} />
                      {th ? row.th : row.en}
                    </div>
                  </td>
                  {ROLES.map((role) => {
                    const checked = perms[row.key]?.[role] ?? false;
                    return (
                      <td key={role}>
                        <div className="ttm-perm-cell">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(row.key, role)}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ttm-perm-save">
        <button className="ttm-btn ttm-btn-ghost" onClick={handleReset}>
          {th ? "รีเซ็ต" : "Reset"}
        </button>
        <button
          className="ttm-btn ttm-btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: saved ? "#10b981" : undefined,  // green flash when saved
            transition: "background 0.2s",
          }}
        >
          {saving
            ? <>{th ? "กำลังบันทึก..." : "Saving..."}</>
            : saved
              ? <><Icon name="check" size={15} stroke={2.5} />{th ? "บันทึกสำเร็จ!" : "Saved!"}</>
              : <>{th ? "บันทึกการตั้งค่า" : "Save permissions"}</>
          }
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */
function RoleBadge({ role, lang }) {
  const labels = {
    th: { requester:"พนักงาน", approver:"ผู้อนุมัติ", it:"ทีม IT", admin:"Admin", auditor:"Auditor", ticketreport:"รายงาน Ticket" },
    en: { requester:"Employee", approver:"Approver",   it:"IT Staff", admin:"Admin", auditor:"Auditor", ticketreport:"Ticket Report" },
  };
  return (
    <span className={cls("ttm-role-badge", `role-${role}`)}>
      {labels[lang === "th" ? "th" : "en"][role] ?? role}
    </span>
  );
}

function RouteIcon({ route }) {
  const map = {
    dashboard:"home", flows:"trending-up", new:"plus", my:"list",
    approvals:"check-circle", it:"tool", archive:"archive",
    notif:"log", caseSummary:"trending-up", settings:"settings", integrations:"external", users:"users",
  };
  return <Icon name={map[route] ?? "circle"} size={14} style={{ color:"var(--muted)", flexShrink:0 }} />;
}

function ConfirmModal({ lang, message, onCancel, onConfirm }) {
  const th = lang === "th";
  return (
    <div className="ttm-modal-scrim" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="ttm-modal" style={{ maxWidth:400 }}>
        <div className="ttm-modal-head">
          <h3 style={{ color:"#be123c" }}>
            <Icon name="alert-circle" size={18} style={{ verticalAlign:"middle", marginRight:6 }} />
            {th ? "ยืนยันการลบ" : "Confirm delete"}
          </h3>
          <button className="ttm-icon-btn" onClick={onCancel}><Icon name="x" size={18} /></button>
        </div>
        <div className="ttm-modal-body">
          <p style={{ margin:0, fontSize:"0.9rem", color:"var(--text)" }}>{message}</p>
          <p style={{ margin:0, fontSize:"0.8rem", color:"var(--muted)" }}>
            {th ? "การกระทำนี้ไม่สามารถย้อนกลับได้" : "This action cannot be undone."}
          </p>
        </div>
        <div className="ttm-modal-footer">
          <button className="ttm-btn ttm-btn-ghost" onClick={onCancel}>{th ? "ยกเลิก" : "Cancel"}</button>
          <button className="ttm-btn" style={{ background:"#be123c", color:"#fff" }} onClick={onConfirm}>
            {th ? "ลบออก" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
