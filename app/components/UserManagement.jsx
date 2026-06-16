"use client";
import React from "react";
import { Icon } from "./Icon";
import { Avatar, cls } from "./Ui";
import { useAppData } from "../lib/AppDataContext";
import { PositionSelect } from "./PositionSelect";

/* ── API helpers ── */
async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

/* ── Excel template columns ── */
const IMPORT_COLUMNS = [
  { key: "nameTh",   label: "ชื่อ-นามสกุล (ภาษาไทย)*" },
  { key: "nameEn",   label: "Full Name (English)" },
  { key: "titleTh",  label: "ตำแหน่ง (ภาษาไทย)" },
  { key: "titleEn",  label: "Job Title (English)" },
  { key: "dept",     label: "แผนก / Department" },
  { key: "username", label: "Username*" },
  { key: "password", label: "Password (default: 1234)" },
  { key: "role",     label: "Role* (requester/approver/it/admin/auditor/ticketreport)" },
];

function downloadTemplate() {
  // Dynamic import so xlsx stays out of the initial bundle
  import("xlsx").then(({ utils, writeFile }) => {
    const ws = utils.aoa_to_sheet([
      IMPORT_COLUMNS.map(c => c.label),
      ["สมชาย ใจดี", "Somchai Jaidee", "พนักงาน", "Staff", "Operations", "somchai.j", "P@ssw0rd", "requester"],
      ["สมหญิง รักงาน", "Somying Rakngarn", "หัวหน้าทีม", "Team Lead", "IT", "somying.r", "P@ssw0rd", "it"],
    ]);
    // Style the header row (column widths)
    ws["!cols"] = IMPORT_COLUMNS.map((_, i) => ({ wch: i === 7 ? 52 : 28 }));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Users");
    writeFile(wb, "TTMFlow_User_Import_Template.xlsx");
  });
}

function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    import("xlsx").then(({ read, utils }) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = read(e.target.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const raw = utils.sheet_to_json(ws, { header: 1, defval: "" });
          if (raw.length < 2) { reject(new Error("ไฟล์ไม่มีข้อมูล")); return; }
          // Use row 0 as header to map columns by position
          const rows = raw.slice(1).filter(r => r.some(c => String(c).trim()));
          const users = rows.map(r => ({
            nameTh:   String(r[0] ?? "").trim(),
            nameEn:   String(r[1] ?? "").trim(),
            titleTh:  String(r[2] ?? "").trim(),
            titleEn:  String(r[3] ?? "").trim(),
            dept:     String(r[4] ?? "").trim(),
            username: String(r[5] ?? "").trim().toLowerCase(),
            password: String(r[6] ?? "").trim() || "1234",
            role:     String(r[7] ?? "").trim().toLowerCase() || "requester",
          }));
          resolve(users);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error("อ่านไฟล์ไม่ได้"));
      reader.readAsArrayBuffer(file);
    }).catch(reject);
  });
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
    email:"", phone:"", lineId:"", employeeId:"",
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
export function UserManagement({ lang, currentUser }) {
  const [tab, setTab] = React.useState("members");
  const [, forceRender] = React.useState(0);
  const refresh = () => forceRender((v) => v + 1);

  // Positions are shared between the member form (dropdown) and the Positions tab
  const [positions, setPositions] = React.useState([]);
  const loadPositions = React.useCallback(() => {
    return apiFetch("/api/positions").then(setPositions).catch(() => {});
  }, []);
  React.useEffect(() => { loadPositions(); }, [loadPositions]);

  return (
    <div className="ttm-um-page">
      {/* Tab bar */}
      <div className="ttm-um-tabs">
        <button className={cls("ttm-um-tab", tab === "members" && "is-active")} onClick={() => setTab("members")}>
          <Icon name="users" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {lang === "th" ? "สมาชิก" : "Members"}
        </button>
        <button className={cls("ttm-um-tab", tab === "positions" && "is-active")} onClick={() => setTab("positions")}>
          <Icon name="briefcase" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {lang === "th" ? "ตำแหน่งงาน" : "Positions"}
        </button>
        <button className={cls("ttm-um-tab", tab === "permissions" && "is-active")} onClick={() => setTab("permissions")}>
          <Icon name="shield-check" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {lang === "th" ? "สิทธิ์การเข้าถึงเมนู" : "Menu Permissions"}
        </button>
      </div>

      {tab === "members" && <MembersTab lang={lang} refresh={refresh} currentUser={currentUser} positions={positions} />}
      {tab === "positions" && <PositionsTab lang={lang} positions={positions} reload={loadPositions} />}
      {tab === "permissions" && <PermissionsTab lang={lang} refresh={refresh} />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MembersTab
   ────────────────────────────────────────────────────────────────────────── */
function MembersTab({ lang, refresh, currentUser, positions }) {
  const [search, setSearch] = React.useState("");
  const [modal, setModal] = React.useState(null);
  const [deleteId, setDeleteId] = React.useState(null);
  const [forceLogoutId, setForceLogoutId] = React.useState(null);
  const [allUsers, setAllUsers] = React.useState([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [importRows, setImportRows] = React.useState(null); // null = closed
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);
  const fileInputRef = React.useRef(null);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      setImportRows(rows);
      setImportResult(null);
    } catch (err) {
      alert((lang === "th" ? "อ่านไฟล์ไม่ได้:\n" : "Cannot read file:\n") + err.message);
    }
  };

  const handleImportConfirm = async () => {
    if (!importRows || importing) return;
    setImporting(true);
    try {
      const res = await apiFetch("/api/users/import", {
        method: "POST",
        body: JSON.stringify(importRows),
      });
      setImportResult(res);
      loadUsers(); refresh();
    } catch (err) {
      alert((lang === "th" ? "นำเข้าไม่สำเร็จ:\n" : "Import failed:\n") + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Toolbar */}
      <div className="ttm-um-toolbar">
        <span className="ttm-um-title">
          {lang === "th"
            ? `ผู้ใช้งานทั้งหมด (${allUsers.length} คน)`
            : `All users (${allUsers.length})`}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <div className="ttm-um-search-wrap">
            <Icon name="search" size={14} />
            <input
              placeholder={lang === "th" ? "ค้นหาชื่อ, แผนก…" : "Search name, dept…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="ttm-btn ttm-btn-ghost"
            style={{ display:"flex", alignItems:"center", gap:6 }}
            onClick={downloadTemplate}
            title={lang === "th" ? "ดาวน์โหลด Template Excel" : "Download Excel Template"}
          >
            <Icon name="download" size={15} />
            {lang === "th" ? "Template" : "Template"}
          </button>
          <button
            className="ttm-btn ttm-btn-ghost"
            style={{ display:"flex", alignItems:"center", gap:6 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="upload" size={15} />
            {lang === "th" ? "นำเข้า Excel" : "Import Excel"}
          </button>
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
                    {currentUser?.id !== u.id && (
                      <button className="ttm-um-action-btn warn"
                        title={lang === "th" ? "บังคับออกจากระบบ" : "Force sign out"}
                        onClick={() => setForceLogoutId(u.id)}>
                        <Icon name="log-out" size={14} />
                      </button>
                    )}
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
          positions={positions}
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

      {/* Force logout confirm */}
      {forceLogoutId && (
        <ConfirmModal
          lang={lang}
          icon="log-out"
          color="#d97706"
          title={lang === "th" ? "บังคับออกจากระบบ" : "Force sign out"}
          message={
            lang === "th"
              ? `บังคับให้ "${allUsers.find(u => u.id === forceLogoutId)?.nameTh}" ออกจากระบบทันที session ปัจจุบันของเขาจะใช้งานไม่ได้`
              : `"${allUsers.find(u => u.id === forceLogoutId)?.nameEn}" will be signed out immediately and their current session will be invalidated.`
          }
          confirmLabel={lang === "th" ? "บังคับออก" : "Force sign out"}
          confirmStyle={{ background: "#d97706", color: "#fff" }}
          onCancel={() => setForceLogoutId(null)}
          onConfirm={async () => {
            try {
              await apiFetch(`/api/users/${forceLogoutId}/force-logout`, { method: "PUT" });
              setForceLogoutId(null);
            } catch (e) { alert(e.message); }
          }}
        />
      )}

      {/* Import Preview Modal */}
      {importRows && (
        <ImportModal
          lang={lang}
          rows={importRows}
          result={importResult}
          importing={importing}
          onClose={() => { setImportRows(null); setImportResult(null); }}
          onConfirm={handleImportConfirm}
        />
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   UserModal — Add / Edit
   ────────────────────────────────────────────────────────────────────────── */
function UserModal({ lang, mode, user: existing, onClose, onSave, positions = [] }) {
  const [form, setForm] = React.useState(existing
    ? { nameTh: existing.nameTh ?? "", nameEn: existing.nameEn ?? "",
        titleTh: existing.titleTh ?? "", titleEn: existing.titleEn ?? "",
        dept: existing.dept ?? "", username: existing.username ?? "",
        password: "", role: existing.role ?? "requester",
        color: existing.color ?? AVATAR_COLORS[0], isActive: existing.isActive !== false,
        email: existing.email ?? "", phone: existing.phone ?? "",
        lineId: existing.lineId ?? "", employeeId: existing.employeeId ?? "" }
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

          {/* Position dropdown — managed in the Positions tab */}
          <div className="ttm-mf-group">
            <label>{th ? "ตำแหน่งงาน" : "Position"}</label>
            <PositionSelect
              lang={lang}
              positions={positions}
              titleTh={form.titleTh}
              titleEn={form.titleEn}
              onChange={(p) => {
                if (!p) { setForm((f) => ({ ...f, titleTh: "", titleEn: "" })); return; }
                setForm((f) => ({ ...f, titleTh: p.nameTh, titleEn: p.nameEn }));
              }}
            />
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

          {/* Contact */}
          <div className="ttm-mf-group">
            <label>Email {th ? "(สำหรับแจ้งเตือน)" : "(for notifications)"}</label>
            <input className="ttm-mf-input" type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" />
          </div>
          <div className="ttm-mf-row">
            <div className="ttm-mf-group">
              <label>{th ? "เบอร์โทรศัพท์" : "Phone"}</label>
              <input className="ttm-mf-input" value={form.phone}
                onChange={(e) => set("phone", e.target.value)} placeholder="0812345678" />
            </div>
            <div className="ttm-mf-group">
              <label>LINE ID</label>
              <input className="ttm-mf-input" value={form.lineId}
                onChange={(e) => set("lineId", e.target.value)} placeholder="line_id" />
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
   PositionsTab — admin CRUD for job positions
   ────────────────────────────────────────────────────────────────────────── */
function PositionsTab({ lang, positions, reload }) {
  const th = lang === "th";
  const [modal, setModal] = React.useState(null);     // { mode, position }
  const [deleteItem, setDeleteItem] = React.useState(null);
  const [search, setSearch] = React.useState("");

  const filtered = positions.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.nameTh ?? "").toLowerCase().includes(q) || (p.nameEn ?? "").toLowerCase().includes(q);
  });

  return (
    <>
      {/* Toolbar */}
      <div className="ttm-um-toolbar">
        <span className="ttm-um-title">
          {th ? `ตำแหน่งงานทั้งหมด (${positions.length})` : `All positions (${positions.length})`}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <div className="ttm-um-search-wrap">
            <Icon name="search" size={14} />
            <input
              placeholder={th ? "ค้นหาตำแหน่ง…" : "Search positions…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="ttm-btn ttm-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => setModal({ mode: "add" })}>
            <Icon name="plus" size={15} />
            {th ? "เพิ่มตำแหน่ง" : "Add position"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ttm-card" style={{ overflow: "auto", padding: 0 }}>
        <table className="ttm-um-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>#</th>
              <th>{th ? "ชื่อตำแหน่ง (ไทย)" : "Position (Thai)"}</th>
              <th>{th ? "ชื่อตำแหน่ง (English)" : "Position (English)"}</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id}>
                <td style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{i + 1}</td>
                <td style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.nameTh || "—"}</td>
                <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{p.nameEn || "—"}</td>
                <td>
                  <div className="ttm-um-actions">
                    <button className="ttm-um-action-btn" title={th ? "แก้ไข" : "Edit"}
                      onClick={() => setModal({ mode: "edit", position: p })}>
                      <Icon name="edit" size={14} />
                    </button>
                    <button className="ttm-um-action-btn danger" title={th ? "ลบ" : "Delete"}
                      onClick={() => setDeleteItem(p)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                  {th ? "ไม่พบตำแหน่งงาน" : "No positions found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <PositionModal
          lang={lang}
          mode={modal.mode}
          position={modal.position}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            try {
              if (modal.mode === "add") {
                await apiFetch("/api/positions", { method: "POST", body: JSON.stringify(data) });
              } else {
                await apiFetch(`/api/positions/${modal.position.id}`, { method: "PUT", body: JSON.stringify(data) });
              }
              await reload(); setModal(null);
            } catch (e) { alert(e.message); }
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteItem && (
        <ConfirmModal
          lang={lang}
          title={th ? "ยืนยันการลบตำแหน่ง" : "Confirm delete position"}
          message={
            th
              ? `ต้องการลบตำแหน่ง "${deleteItem.nameTh}" หรือไม่? ผู้ใช้ที่มีตำแหน่งนี้อยู่จะยังคงข้อมูลเดิมไว้`
              : `Delete position "${deleteItem.nameEn || deleteItem.nameTh}"? Users with this title keep their existing value.`
          }
          onCancel={() => setDeleteItem(null)}
          onConfirm={async () => {
            try {
              await apiFetch(`/api/positions/${deleteItem.id}`, { method: "DELETE" });
              setDeleteItem(null); await reload();
            } catch (e) { alert(e.message); }
          }}
        />
      )}
    </>
  );
}

/* ── Add / Edit position modal ── */
function PositionModal({ lang, mode, position, onClose, onSave }) {
  const th = lang === "th";
  const [form, setForm] = React.useState({
    nameTh: position?.nameTh ?? "",
    nameEn: position?.nameEn ?? "",
  });
  const [error, setError] = React.useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isAdd = mode === "add";

  const handleSave = () => {
    if (!form.nameTh.trim() && !form.nameEn.trim()) { setError(true); return; }
    onSave({ nameTh: form.nameTh.trim(), nameEn: form.nameEn.trim() });
  };

  return (
    <div className="ttm-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ttm-modal" style={{ maxWidth: 440 }}>
        <div className="ttm-modal-head">
          <h3>
            <Icon name="briefcase" size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {isAdd ? (th ? "เพิ่มตำแหน่งงาน" : "Add position") : (th ? "แก้ไขตำแหน่งงาน" : "Edit position")}
          </h3>
          <button className="ttm-icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="ttm-modal-body">
          <div className="ttm-mf-group">
            <label>{th ? "ชื่อตำแหน่ง (ภาษาไทย)" : "Position name (Thai)"}</label>
            <input className={cls("ttm-mf-input", error && "is-error")}
              value={form.nameTh} onChange={(e) => { set("nameTh", e.target.value); setError(false); }}
              placeholder={th ? "เช่น Call Center Agent" : "e.g. Call Center Agent"} autoFocus />
          </div>
          <div className="ttm-mf-group">
            <label>{th ? "ชื่อตำแหน่ง (English)" : "Position name (English)"}</label>
            <input className={cls("ttm-mf-input", error && "is-error")}
              value={form.nameEn} onChange={(e) => { set("nameEn", e.target.value); setError(false); }}
              placeholder="e.g. Call Center Agent" />
          </div>
          {error && (
            <span style={{ fontSize: "0.75rem", color: "#be123c" }}>
              {th ? "กรุณาระบุชื่อตำแหน่งอย่างน้อย 1 ภาษา" : "Enter a name in at least one language"}
            </span>
          )}
        </div>
        <div className="ttm-modal-footer">
          <button className="ttm-btn ttm-btn-ghost" onClick={onClose}>{th ? "ยกเลิก" : "Cancel"}</button>
          <button className="ttm-btn ttm-btn-primary" onClick={handleSave}>
            {isAdd ? (th ? "เพิ่ม" : "Add") : (th ? "บันทึก" : "Save")}
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
  const { refreshPermissions } = useAppData();
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
      setSaved(true);
      try { await loadPerms(); } catch (_) { /* non-fatal */ }
      // Push updated permissions to global context so sidebar/routing reflect immediately
      try { await refreshPermissions(); } catch (_) { /* non-fatal */ }
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

/* ──────────────────────────────────────────────────────────────────────────
   ImportModal — preview rows before confirming bulk import
   ────────────────────────────────────────────────────────────────────────── */
const ROLE_LABEL_SHORT = {
  requester:"พนักงาน", approver:"ผู้อนุมัติ", it:"ทีม IT",
  admin:"Admin", auditor:"Auditor", ticketreport:"Ticket Report",
};
const VALID_ROLES_SET = new Set(["requester","approver","it","admin","auditor","ticketreport"]);

function ImportModal({ lang, rows, result, importing, onClose, onConfirm }) {
  const th = lang === "th";
  const hasError = rows.some(r => !r.nameTh || !r.username);

  return (
    <div className="ttm-modal-scrim" onClick={(e) => e.target === e.currentTarget && !importing && onClose()}>
      <div className="ttm-modal" style={{ maxWidth: 780, width: "95vw" }}>
        <div className="ttm-modal-head">
          <h3>
            <Icon name="upload" size={16} style={{ verticalAlign:"middle", marginRight:6 }} />
            {th ? `นำเข้าผู้ใช้ (${rows.length} รายการ)` : `Import Users (${rows.length} rows)`}
          </h3>
          <button className="ttm-icon-btn" onClick={onClose} disabled={importing}><Icon name="x" size={18} /></button>
        </div>

        <div className="ttm-modal-body" style={{ padding: 0 }}>
          {/* Result banner */}
          {result && (
            <div style={{
              padding: "0.75rem 1.25rem",
              background: result.failed === 0 ? "#d1fae5" : "#fef3c7",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.875rem",
              color: result.failed === 0 ? "#065f46" : "#92400e",
              display: "flex", gap: 8, alignItems: "center",
            }}>
              <Icon name={result.failed === 0 ? "check-circle" : "alert-circle"} size={16} />
              {th
                ? `นำเข้าสำเร็จ ${result.succeeded} คน${result.failed > 0 ? ` · ล้มเหลว ${result.failed} คน` : ""}`
                : `Imported ${result.succeeded} users${result.failed > 0 ? ` · ${result.failed} failed` : ""}`
              }
            </div>
          )}

          {/* Warning if validation errors */}
          {hasError && !result && (
            <div style={{
              padding: "0.6rem 1.25rem", background: "#fef2f2",
              borderBottom: "1px solid var(--border)", fontSize: "0.8rem", color: "#be123c",
              display: "flex", gap: 8, alignItems: "center",
            }}>
              <Icon name="alert-circle" size={14} />
              {th ? "แถวที่มีสีแดง — ขาด nameTh หรือ username (จะถูกข้ามเมื่อนำเข้า)" : "Red rows are missing nameTh or username and will be skipped"}
            </div>
          )}

          <div style={{ overflowX: "auto", maxHeight: 380 }}>
            <table className="ttm-um-table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{th ? "ชื่อ (ไทย)" : "Name (TH)"}</th>
                  <th>{th ? "ชื่อ (EN)" : "Name (EN)"}</th>
                  <th>{th ? "แผนก" : "Dept"}</th>
                  <th>Username</th>
                  <th>{th ? "บทบาท" : "Role"}</th>
                  {result && <th>{th ? "สถานะ" : "Status"}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const rowError = !r.nameTh || !r.username;
                  const badRole = r.role && !VALID_ROLES_SET.has(r.role);
                  const rowResult = result?.results?.[i];
                  return (
                    <tr key={i} style={{ background: rowError ? "rgba(190,18,60,0.06)" : undefined }}>
                      <td style={{ color: "var(--muted)", fontSize:"0.75rem" }}>{i + 1}</td>
                      <td style={{ color: !r.nameTh ? "#be123c" : undefined, fontWeight: 600, fontSize:"0.8125rem" }}>
                        {r.nameTh || <em style={{ opacity:0.6 }}>(empty)</em>}
                      </td>
                      <td style={{ fontSize:"0.8125rem", color:"var(--muted)" }}>{r.nameEn || "—"}</td>
                      <td style={{ fontSize:"0.8125rem", color:"var(--muted)" }}>{r.dept || "—"}</td>
                      <td style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"0.8rem", color: !r.username ? "#be123c" : undefined }}>
                        {r.username || <em style={{ opacity:0.6 }}>(empty)</em>}
                      </td>
                      <td>
                        <span className={cls("ttm-role-badge", `role-${VALID_ROLES_SET.has(r.role) ? r.role : "requester"}`)}>
                          {badRole ? r.role : (ROLE_LABEL_SHORT[r.role] ?? r.role)}
                        </span>
                        {badRole && <span style={{ fontSize:"0.7rem", color:"#f59e0b", marginLeft:4 }}>→ requester</span>}
                      </td>
                      {result && (
                        <td>
                          {rowResult?.ok
                            ? <span style={{ color:"#059669", fontSize:"0.8rem" }}>✓ {rowResult.id}</span>
                            : <span style={{ color:"#be123c", fontSize:"0.75rem" }}>{rowResult?.error ?? "skipped"}</span>
                          }
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ttm-modal-footer">
          <button className="ttm-btn ttm-btn-ghost" onClick={onClose} disabled={importing}>
            {result ? (th ? "ปิด" : "Close") : (th ? "ยกเลิก" : "Cancel")}
          </button>
          {!result && (
            <button
              className="ttm-btn ttm-btn-primary"
              onClick={onConfirm}
              disabled={importing || rows.every(r => !r.nameTh || !r.username)}
              style={{ display:"flex", alignItems:"center", gap:6 }}
            >
              {importing
                ? <>{th ? "กำลังนำเข้า…" : "Importing…"}</>
                : <><Icon name="upload" size={15} />{th ? `นำเข้า ${rows.filter(r => r.nameTh && r.username).length} คน` : `Import ${rows.filter(r => r.nameTh && r.username).length} users`}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  lang, message, onCancel, onConfirm,
  icon = "alert-circle", color = "#be123c",
  title, confirmLabel, confirmStyle,
}) {
  const th = lang === "th";
  const headTitle  = title        ?? (th ? "ยืนยันการลบ"  : "Confirm delete");
  const btnLabel   = confirmLabel ?? (th ? "ลบออก"         : "Delete");
  const btnStyle   = confirmStyle ?? { background: "#be123c", color: "#fff" };
  return (
    <div className="ttm-modal-scrim" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="ttm-modal" style={{ maxWidth:400 }}>
        <div className="ttm-modal-head">
          <h3 style={{ color }}>
            <Icon name={icon} size={18} style={{ verticalAlign:"middle", marginRight:6 }} />
            {headTitle}
          </h3>
          <button className="ttm-icon-btn" onClick={onCancel}><Icon name="x" size={18} /></button>
        </div>
        <div className="ttm-modal-body">
          <p style={{ margin:0, fontSize:"0.9rem", color:"var(--text)" }}>{message}</p>
          <p style={{ margin:"0.5rem 0 0", fontSize:"0.8rem", color:"var(--muted)" }}>
            {th ? "การกระทำนี้ไม่สามารถย้อนกลับได้" : "This action cannot be undone."}
          </p>
        </div>
        <div className="ttm-modal-footer">
          <button className="ttm-btn ttm-btn-ghost" onClick={onCancel}>{th ? "ยกเลิก" : "Cancel"}</button>
          <button className="ttm-btn" style={btnStyle} onClick={onConfirm}>{btnLabel}</button>
        </div>
      </div>
    </div>
  );
}
