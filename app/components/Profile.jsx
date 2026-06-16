"use client";
import React from "react";
import { Icon } from "./Icon";
import { Avatar, cls } from "./Ui";
import { PositionSelect } from "./PositionSelect";

const AVATAR_COLORS = [
  "#3b82f6","#a855f7","#f59e0b","#0ea5e9","#10b981",
  "#06b6d4","#8b5cf6","#ec4899","#64748b","#0284c7",
  "#0369a1","#0d9488","#14b8a6","#059669","#e11d48",
];

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

/* ── ProfileModal — opened from Topbar user chip ── */
export function ProfileModal({ lang, currentUser, onClose, onUpdated }) {
  const [tab, setTab] = React.useState("info");
  const th = lang === "th";

  return (
    <div className="ttm-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ttm-modal ttm-profile-modal">
        <div className="ttm-modal-head">
          <h3>
            <Icon name="user" size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {th ? "โปรไฟล์ของฉัน" : "My Profile"}
          </h3>
          <button className="ttm-icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="ttm-profile-tabs">
          <button
            className={cls("ttm-profile-tab", tab === "info" && "is-active")}
            onClick={() => setTab("info")}
          >
            <Icon name="user" size={13} />
            {th ? "ข้อมูลส่วนตัว" : "Personal Info"}
          </button>
          <button
            className={cls("ttm-profile-tab", tab === "password" && "is-active")}
            onClick={() => setTab("password")}
          >
            <Icon name="lock" size={13} />
            {th ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
          </button>
        </div>

        {tab === "info"
          ? <InfoTab lang={lang} currentUser={currentUser} onClose={onClose} onUpdated={onUpdated} />
          : <PasswordTab lang={lang} onClose={onClose} />
        }
      </div>
    </div>
  );
}

/* ── Info tab ── */
function InfoTab({ lang, currentUser, onClose, onUpdated }) {
  const th = lang === "th";
  const [form, setForm] = React.useState({
    nameTh:     currentUser.nameTh     ?? "",
    nameEn:     currentUser.nameEn     ?? "",
    titleTh:    currentUser.titleTh    ?? "",
    titleEn:    currentUser.titleEn    ?? "",
    dept:       currentUser.dept       ?? "",
    employeeId: currentUser.employeeId ?? "",
    email:      currentUser.email      ?? "",
    phone:      currentUser.phone      ?? "",
    lineId:     currentUser.lineId     ?? "",
    color:      currentUser.color      ?? AVATAR_COLORS[0],
  });
  const [saving, setSaving] = React.useState(false);
  const [saved,  setSaved]  = React.useState(false);
  const [error,  setError]  = React.useState(null);
  const [positions, setPositions] = React.useState([]);

  React.useEffect(() => {
    apiFetch("/api/positions").then(setPositions).catch(() => {});
  }, []);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true); setError(null);
    try {
      const updated = await apiFetch("/api/users/me", { method: "PUT", body: JSON.stringify(form) });
      setSaved(true);
      onUpdated?.(updated);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="ttm-modal-body">
        {/* Avatar preview */}
        <div className="ttm-profile-hero">
          <div className="ttm-profile-avatar-wrap">
            <Avatar user={{ ...currentUser, color: form.color, nameTh: form.nameTh, nameEn: form.nameEn }} size={64} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
              {th ? form.nameTh || currentUser.nameTh : form.nameEn || currentUser.nameEn}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
              {currentUser.username} · {currentUser.role}
            </div>
            {currentUser.lastLoginAt && (
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                {th ? "เข้าสู่ระบบล่าสุด: " : "Last login: "}
                {new Date(currentUser.lastLoginAt).toLocaleString(th ? "th-TH" : "en-US")}
              </div>
            )}
          </div>
        </div>

        {/* Section: Personal */}
        <div className="ttm-profile-section-label">
          <Icon name="user" size={12} />
          {th ? "ข้อมูลส่วนตัว" : "Personal"}
        </div>

        <div className="ttm-mf-row">
          <div className="ttm-mf-group">
            <label>{th ? "ชื่อ-นามสกุล (ภาษาไทย)" : "Full name (Thai)"}</label>
            <input className="ttm-mf-input" value={form.nameTh} onChange={e => set("nameTh", e.target.value)} placeholder="ชื่อ นามสกุล" />
          </div>
          <div className="ttm-mf-group">
            <label>{th ? "ชื่อ-นามสกุล (English)" : "Full name (English)"}</label>
            <input className="ttm-mf-input" value={form.nameEn} onChange={e => set("nameEn", e.target.value)} placeholder="First Last" />
          </div>
        </div>

        <div className="ttm-mf-group">
          <label>{th ? "ตำแหน่งงาน" : "Position"}</label>
          <PositionSelect
            lang={lang}
            positions={positions}
            titleTh={form.titleTh}
            titleEn={form.titleEn}
            onChange={(p) => {
              if (!p) { setForm(f => ({ ...f, titleTh: "", titleEn: "" })); setSaved(false); return; }
              setForm(f => ({ ...f, titleTh: p.nameTh, titleEn: p.nameEn })); setSaved(false);
            }}
          />
        </div>

        <div className="ttm-mf-row">
          <div className="ttm-mf-group">
            <label>{th ? "แผนก / ฝ่าย" : "Department"}</label>
            <input className="ttm-mf-input" value={form.dept} onChange={e => set("dept", e.target.value)} />
          </div>
          <div className="ttm-mf-group">
            <label>{th ? "รหัสพนักงาน" : "Employee ID"}</label>
            <input className="ttm-mf-input" value={form.employeeId} onChange={e => set("employeeId", e.target.value)} placeholder="EMP-001" />
          </div>
        </div>

        {/* Section: Contact */}
        <div className="ttm-profile-section-label">
          <Icon name="mail" size={12} />
          {th ? "ช่องทางการติดต่อ (สำหรับแจ้งเตือน)" : "Contact (for notifications)"}
        </div>

        <div className="ttm-mf-group">
          <label>Email</label>
          <div className="ttm-profile-input-icon-wrap">
            <Icon name="mail" size={14} />
            <input
              className="ttm-mf-input"
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div className="ttm-mf-row">
          <div className="ttm-mf-group">
            <label>{th ? "เบอร์โทรศัพท์" : "Phone"}</label>
            <div className="ttm-profile-input-icon-wrap">
              <Icon name="phone" size={14} />
              <input
                className="ttm-mf-input"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="0812345678"
              />
            </div>
          </div>
          <div className="ttm-mf-group">
            <label>LINE ID</label>
            <div className="ttm-profile-input-icon-wrap">
              <Icon name="message-circle" size={14} />
              <input
                className="ttm-mf-input"
                value={form.lineId}
                onChange={e => set("lineId", e.target.value)}
                placeholder="line_id"
              />
            </div>
          </div>
        </div>

        {/* Avatar color */}
        <div className="ttm-mf-group">
          <label>{th ? "สีอวตาร" : "Avatar color"}</label>
          <div className="ttm-color-swatches">
            {AVATAR_COLORS.map(c => (
              <button key={c} type="button"
                className={cls("ttm-color-swatch", form.color === c && "sel")}
                style={{ background: c }}
                onClick={() => set("color", c)}>
                {form.color === c && <Icon name="check" size={12} stroke={3} style={{ color: "#fff" }} />}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="ttm-profile-error">
            <Icon name="alert-circle" size={14} />
            {error}
          </div>
        )}
      </div>

      <div className="ttm-modal-footer">
        <button className="ttm-btn ttm-btn-ghost" onClick={onClose}>{th ? "ปิด" : "Close"}</button>
        <button
          className="ttm-btn ttm-btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, background: saved ? "#10b981" : undefined, transition: "background 0.2s" }}
        >
          {saving
            ? (th ? "กำลังบันทึก…" : "Saving…")
            : saved
              ? <><Icon name="check" size={15} stroke={2.5} />{th ? "บันทึกสำเร็จ!" : "Saved!"}</>
              : (th ? "บันทึกข้อมูล" : "Save changes")
          }
        </button>
      </div>
    </>
  );
}

/* ── Password tab ── */
function PasswordTab({ lang, onClose }) {
  const th = lang === "th";
  const [form, setForm] = React.useState({ current: "", newPw: "", confirm: "" });
  const [showCur, setShowCur] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(null); };

  const handleSave = async () => {
    if (!form.current || !form.newPw || !form.confirm) {
      setError(th ? "กรุณากรอกข้อมูลให้ครบ" : "Please fill in all fields"); return;
    }
    if (form.newPw.length < 6) {
      setError(th ? "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" : "New password must be at least 6 characters"); return;
    }
    if (form.newPw !== form.confirm) {
      setError(th ? "รหัสผ่านใหม่ไม่ตรงกัน" : "Passwords do not match"); return;
    }
    setSaving(true); setError(null);
    try {
      await apiFetch("/api/users/me/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
      });
      setDone(true);
      setForm({ current: "", newPw: "", confirm: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (done) return (
    <>
      <div className="ttm-modal-body">
        <div className="ttm-profile-success">
          <Icon name="check-circle" size={40} style={{ color: "#10b981" }} />
          <div style={{ fontWeight: 600 }}>{th ? "เปลี่ยนรหัสผ่านสำเร็จแล้ว" : "Password changed successfully"}</div>
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            {th ? "กรุณาใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งต่อไป" : "Use your new password next time you sign in."}
          </div>
        </div>
      </div>
      <div className="ttm-modal-footer">
        <button className="ttm-btn ttm-btn-primary" onClick={onClose}>{th ? "ปิด" : "Close"}</button>
      </div>
    </>
  );

  return (
    <>
      <div className="ttm-modal-body">
        <div className="ttm-mf-group">
          <label>{th ? "รหัสผ่านปัจจุบัน" : "Current password"}</label>
          <div className="ttm-mf-pw">
            <input
              className="ttm-mf-input"
              type={showCur ? "text" : "password"}
              value={form.current}
              onChange={e => set("current", e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" className="ttm-mf-pw-toggle" onClick={() => setShowCur(v => !v)}>
              <Icon name={showCur ? "eye-off" : "eye"} size={15} />
            </button>
          </div>
        </div>

        <div className="ttm-mf-group">
          <label>{th ? "รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" : "New password (min 6 chars)"}</label>
          <div className="ttm-mf-pw">
            <input
              className="ttm-mf-input"
              type={showNew ? "text" : "password"}
              value={form.newPw}
              onChange={e => set("newPw", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button type="button" className="ttm-mf-pw-toggle" onClick={() => setShowNew(v => !v)}>
              <Icon name={showNew ? "eye-off" : "eye"} size={15} />
            </button>
          </div>
          {form.newPw && (
            <PasswordStrength value={form.newPw} lang={lang} />
          )}
        </div>

        <div className="ttm-mf-group">
          <label>{th ? "ยืนยันรหัสผ่านใหม่" : "Confirm new password"}</label>
          <input
            className={cls("ttm-mf-input", form.confirm && form.confirm !== form.newPw && "is-error")}
            type="password"
            value={form.confirm}
            onChange={e => set("confirm", e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {form.confirm && form.confirm !== form.newPw && (
            <span style={{ fontSize: "0.75rem", color: "#be123c" }}>
              {th ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match"}
            </span>
          )}
        </div>

        {error && (
          <div className="ttm-profile-error">
            <Icon name="alert-circle" size={14} />
            {error}
          </div>
        )}
      </div>

      <div className="ttm-modal-footer">
        <button className="ttm-btn ttm-btn-ghost" onClick={onClose}>{th ? "ยกเลิก" : "Cancel"}</button>
        <button
          className="ttm-btn ttm-btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {saving ? (th ? "กำลังบันทึก…" : "Saving…") : (th ? "เปลี่ยนรหัสผ่าน" : "Change password")}
        </button>
      </div>
    </>
  );
}

/* ── Password strength indicator ── */
function PasswordStrength({ value, lang }) {
  const th = lang === "th";
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { label: th ? "อ่อนมาก" : "Very weak",  color: "#ef4444" },
    { label: th ? "อ่อน" : "Weak",           color: "#f97316" },
    { label: th ? "ปานกลาง" : "Fair",        color: "#eab308" },
    { label: th ? "แข็งแกร่ง" : "Strong",   color: "#22c55e" },
    { label: th ? "แข็งแกร่งมาก" : "Very strong", color: "#16a34a" },
  ];
  const lvl = levels[score] ?? levels[0];

  return (
    <div className="ttm-pw-strength">
      <div className="ttm-pw-bars">
        {[0,1,2,3].map(i => (
          <div key={i} className="ttm-pw-bar" style={{ background: i < score ? lvl.color : "var(--border)" }} />
        ))}
      </div>
      <span style={{ fontSize: "0.75rem", color: lvl.color }}>{lvl.label}</span>
    </div>
  );
}
