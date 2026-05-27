"use client";
import React from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { cls, Avatar, Badge, Button, Card, Field, IconButton, Input, SectionTitle, Select, Switch } from "./Ui";
import { shortFormCode } from "../lib/data";
import { useAppData } from "../lib/AppDataContext";

export function NotificationsLog({ lang, t }) {
  const [channel, setChannel] = React.useState("all");
  const { NOTIFICATIONS: list } = useAppData();
  const filtered = channel === "all" ? list : list.filter(n => n.channel === channel);

  const exportCSV = () => {
    const header = ["ID", "Time", "Channel", "Recipient", "Subject", "Doc No", "Status"];
    const rows = filtered.map(n => [n.id, n.at, n.channel, n.to, (n.subject || "").replace(/"/g, '""'), n.reqId || "", n.status]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notifications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ttm-page ttm-notif-page">
      <div className="ttm-list-head">
        <div>
          <h2>{t.nav.notifications}</h2>
          <p>{lang === "th" ? "บันทึกการส่งข้อความออกจากระบบ — LINE, Email, In-app" : "Outbound notification log — LINE, Email, In-app"}</p>
        </div>
        <Button variant="ghost" icon="download" size="sm" onClick={exportCSV}>{lang === "th" ? "ดาวน์โหลด CSV" : "Export CSV"}</Button>
      </div>

      <div className="ttm-channel-stats">
        {[
          { id: "all", label: t.common.all, value: list.length, icon: "log" },
          { id: "line", label: "LINE", value: list.filter(n => n.channel === "line").length, icon: "line", color: "green" },
          { id: "email", label: "Email", value: list.filter(n => n.channel === "email").length, icon: "mail", color: "blue" },
          { id: "inapp", label: "In-app", value: list.filter(n => n.channel === "inapp").length, icon: "bell", color: "violet" },
        ].map(s => (
          <button key={s.id} className={cls("ttm-channel-stat", channel === s.id && "is-active", s.color && `is-${s.color}`)} onClick={() => setChannel(s.id)}>
            <Icon name={s.icon} size={16} />
            <div>
              <div className="ttm-channel-stat-label">{s.label}</div>
              <div className="ttm-channel-stat-value">{s.value}</div>
            </div>
          </button>
        ))}
      </div>

      <Card className="ttm-table-card">
        <table className="ttm-table">
          <thead>
            <tr>
              <th>{lang === "th" ? "เวลา" : "Time"}</th>
              <th>{lang === "th" ? "ช่องทาง" : "Channel"}</th>
              <th>{lang === "th" ? "ปลายทาง" : "Recipient"}</th>
              <th>{lang === "th" ? "ข้อความ" : "Subject"}</th>
              <th>{t.common.docNo}</th>
              <th>{lang === "th" ? "สถานะ" : "Status"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map(n => (
              <tr key={n.id}>
                <td className="ttm-muted">{n.at}</td>
                <td>
                  <span className={cls("ttm-channel-tag", `is-${n.channel}`)}>
                    <Icon name={n.channel === "line" ? "line" : n.channel === "email" ? "mail" : "bell"} size={13} />
                    {n.channel === "line" ? "LINE" : n.channel === "email" ? "Email" : "In-app"}
                  </span>
                </td>
                <td>{n.to}</td>
                <td className="ttm-notif-subject-cell">{n.subject}</td>
                <td className="ttm-mono ttm-small">{n.reqId}</td>
                <td><Badge kind="green" dot>{n.status}</Badge></td>
                <td><IconButton icon="external" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="ttm-notif-previews">
        <Card>
          <SectionTitle title={lang === "th" ? "ตัวอย่าง LINE Notification" : "LINE message preview"} />
          <LinePreview lang={lang} />
        </Card>
        <Card>
          <SectionTitle title={lang === "th" ? "ตัวอย่าง Email อนุมัติ" : "Approval email preview"} />
          <EmailPreview lang={lang} />
        </Card>
      </div>
    </div>
  );
}

function LinePreview({ lang }) {
  return (
    <div className="ttm-line-preview">
      <div className="ttm-line-header">
        <div className="ttm-line-avatar">
          <Image src="/assets/logo.jpg" alt="TTM" width={32} height={32} />
        </div>
        <div>
          <div className="ttm-line-name">TTMFlow Bot</div>
          <div className="ttm-line-time">{lang === "th" ? "วันนี้ 08:42" : "Today 08:42"}</div>
        </div>
      </div>
      <div className="ttm-line-card">
        <div className="ttm-line-card-hero">
          <div className="ttm-line-card-tag">📋 {lang === "th" ? "คำขอใหม่รออนุมัติ" : "New approval request"}</div>
          <h4>{lang === "th" ? "สร้างคิวใหม่ Project SCB-Premier" : "New PBX queue: Project SCB-Premier"}</h4>
        </div>
        <div className="ttm-line-card-body">
          <div className="ttm-line-kv"><span>{lang === "th" ? "เลขที่" : "Doc"}</span><b className="ttm-mono">IT0109-260525-0143</b></div>
          <div className="ttm-line-kv"><span>{lang === "th" ? "ผู้แจ้ง" : "From"}</span><b>ณัฐกานต์ ว.</b></div>
          <div className="ttm-line-kv"><span>{lang === "th" ? "ขั้นที่" : "Step"}</span><b>1 / 3</b></div>
          <div className="ttm-line-kv"><span>SLA</span><b>1 {lang === "th" ? "วันทำการ" : "business day"}</b></div>
        </div>
        <div className="ttm-line-card-actions">
          <button className="ttm-line-btn is-primary">{lang === "th" ? "เปิดเพื่ออนุมัติ" : "Open to approve"}</button>
          <button className="ttm-line-btn">{lang === "th" ? "ดู PDF" : "View PDF"}</button>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ lang }) {
  return (
    <div className="ttm-email-preview">
      <div className="ttm-email-head">
        <div><span>From</span><b>noreply@talktome.co.th</b></div>
        <div><span>To</span><b>tanawat.s@talktome.co.th</b></div>
        <div><span>Subject</span><b>[Approve Required] IT0101-260524-0142</b></div>
      </div>
      <div className="ttm-email-body">
        <div className="ttm-email-brand">
          <Image src="/assets/logo.jpg" alt="TTM" width={32} height={32} />
          <strong>TTMFlow</strong>
        </div>
        <h3>{lang === "th" ? "คุณมีคำขอใหม่รออนุมัติ" : "You have a request awaiting approval"}</h3>
        <p>{lang === "th" ? "สวัสดี ธนวัฒน์," : "Hi Tanawat,"}</p>
        <p>{lang === "th"
          ? "ณัฐกานต์ ส่งคำขอ \"ขอเปิด Email และสิทธิ์ PBX สำหรับพนักงานใหม่\" (IT0101-260524-0142) มาให้คุณพิจารณาเป็นขั้นที่ 1 จาก 3"
          : "Natthakan submitted \"Email + PBX access for new hire\" (IT0101-260524-0142) for your approval as step 1 of 3."}</p>
        <div className="ttm-email-buttons">
          <button className="ttm-email-btn is-primary">{lang === "th" ? "✓ อนุมัติออนไลน์" : "✓ Approve online"}</button>
          <button className="ttm-email-btn">{lang === "th" ? "ดูรายละเอียด" : "View detail"}</button>
        </div>
        <div className="ttm-email-attach">
          <Icon name="file-text" size={14} />
          <span>IT0101-260524-0142.pdf · 184 KB</span>
        </div>
        <p className="ttm-muted ttm-small">{lang === "th" ? "อีเมลส่งโดยระบบอัตโนมัติ TTMFlow — กรุณาอย่าตอบกลับ" : "Sent automatically by TTMFlow — please do not reply."}</p>
      </div>
    </div>
  );
}

export function Settings({ lang, t, setRoute }) {
  const [selected, setSelected] = React.useState("FM-IT-01-01");
  const { FORM_TEMPLATES: tmpl, refreshForms } = useAppData();
  const cur = tmpl.find(x => x.code === selected) || tmpl[tmpl.length - 1];

  // Draft state for editing the current template's approvers
  const [editApprovers, setEditApprovers] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState("");
  const [users, setUsers] = React.useState([]);

  // Load users for the picker
  React.useEffect(() => {
    fetch("/api/users")
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setUsers(d) : null)
      .catch(() => {});
  }, []);

  // Draft state for numbering + notification settings
  const [editNumbering, setEditNumbering] = React.useState({});
  const [editNotifChannels, setEditNotifChannels] = React.useState({});

  // Reset draft when switching template
  React.useEffect(() => {
    if (cur) {
      const normalized = (cur.approvers || []).map(a => {
        if (typeof a === "string") return { roleTh: a, roleEn: a, slaDays: 1, userId: "" };
        return { roleTh: a.roleTh || a.roleEn || "", roleEn: a.roleEn || a.roleTh || "", slaDays: a.slaDays ?? 1, userId: a.userId || "" };
      });
      setEditApprovers(normalized);
      setEditNumbering(cur.numbering || { reset: "year", digits: "4", current: "0143" });
      setEditNotifChannels(cur.notifications || {
        "line-group": true, "line-personal": true, "email-approver": true,
        "email-it": true, "inapp": true, "requester-line": true,
      });
      setSaveMsg("");
    }
  }, [cur?.code]);  // eslint-disable-line react-hooks/exhaustive-deps

  const savePartial = async (patch) => {
    if (!cur) return;
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(cur.code)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cur, ...patch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveMsg("❌ " + (err.error || "บันทึกไม่สำเร็จ"));
      } else {
        await refreshForms();
        setSaveMsg(lang === "th" ? "✓ บันทึกแล้ว" : "✓ Saved");
        setTimeout(() => setSaveMsg(""), 3000);
      }
    } catch (e) {
      setSaveMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveApprovers   = () => savePartial({ approvers: editApprovers });
  const saveNumbering   = () => savePartial({ numbering: editNumbering });
  const saveNotifChans  = () => savePartial({ notifications: editNotifChannels });

  if (!cur) {
    return (
      <div className="ttm-page ttm-settings-page">
        <div className="ttm-list-head">
          <div>
            <h2>{t.nav.settings}</h2>
            <p>{lang === "th" ? "ยังไม่มีแบบฟอร์มในระบบ" : "No form templates yet"}</p>
          </div>
          <Button variant="primary" icon="plus" onClick={() => setRoute && setRoute("templateBuilder")}>{lang === "th" ? "ขึ้นทะเบียนฟอร์มใหม่" : "Register new form"}</Button>
        </div>
        <div className="ttm-empty" style={{ padding: "3rem", textAlign: "center" }}>
          {lang === "th" ? "ยังไม่มีแบบฟอร์มในฐานข้อมูล — กดปุ่ม \"ขึ้นทะเบียนฟอร์มใหม่\" เพื่อสร้าง" : "No form templates in the database — click \"Register new form\" to create one"}
        </div>
      </div>
    );
  }

  return (
    <div className="ttm-page ttm-settings-page">
      <div className="ttm-list-head">
        <div>
          <h2>{t.nav.settings}</h2>
          <p>{lang === "th" ? "ขึ้นทะเบียนแบบฟอร์ม, กำหนดลำดับผู้อนุมัติ, รูปแบบเลขเอกสาร และช่องทางการแจ้งเตือน" : "Register form templates, approval chains, document numbering, and notification channels"}</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setRoute && setRoute("templateBuilder")}>{lang === "th" ? "ขึ้นทะเบียนฟอร์มใหม่" : "Register new form"}</Button>
      </div>

      <div className="ttm-settings-grid">
        <Card className="ttm-settings-list">
          <div className="ttm-settings-list-head">
            <strong>{lang === "th" ? "แบบฟอร์มทั้งหมด" : "All templates"}</strong>
            <span className="ttm-muted ttm-small">{tmpl.length}</span>
          </div>
          <ul>
            {tmpl.map(f => (
              <li key={f.code}>
                <button className={cls("ttm-settings-item", selected === f.code && "is-active")} onClick={() => setSelected(f.code)}>
                  <div className={cls("ttm-settings-item-icon", `is-${f.color}`)}><Icon name={f.icon} size={14} /></div>
                  <div className="ttm-settings-item-meta">
                    <div className="ttm-mono ttm-small">{f.code}</div>
                    <div>{lang === "th" ? f.titleTh : f.titleEn}</div>
                  </div>
                  {f.custom && <Badge kind="violet" className="ttm-settings-cat">{lang === "th" ? "ใหม่" : "New"}</Badge>}
                  <Badge kind="neutral" className="ttm-settings-cat">{f.category}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="ttm-settings-detail">
          <Card>
            <div className="ttm-settings-detail-head">
              <div className={cls("ttm-form-head-icon", `is-${cur.color}`)}>
                <Icon name={cur.icon} size={24} />
              </div>
              <div>
                <div className="ttm-muted ttm-small">{cur.code} · Rev 00 · {lang === "th" ? "บังคับใช้ 01/03/2569" : "Effective 01/03/2026"}</div>
                <h3>{lang === "th" ? cur.titleTh : cur.titleEn}</h3>
              </div>
              <div className="ttm-spacer" />
              <Button variant="ghost" icon="edit" onClick={() => setRoute && setRoute("templateBuilder")}>{lang === "th" ? "แก้ไข Template" : "Edit Template"}</Button>
            </div>
          </Card>

          <Card>
            <SectionTitle title={lang === "th" ? "รูปแบบเลขเอกสาร" : "Document numbering"} />
            <div className="ttm-numbering">
              <div className="ttm-numbering-reg">
                <span className="ttm-muted ttm-small">{lang === "th" ? "รหัสฟอร์มขึ้นทะเบียน" : "Registered form code"}</span>
                <span className="ttm-mono">{cur.code}</span>
                <Icon name="arrow-right" size={13} className="ttm-muted" />
                <span className="ttm-muted ttm-small">{lang === "th" ? "ตัดเป็นรหัสรัน" : "Short prefix"}</span>
                <span className="ttm-mono ttm-numbering-short">{shortFormCode(cur.code)}</span>
              </div>
              <div className="ttm-numbering-formula">
                <Token label={lang === "th" ? "รหัสรัน" : "Prefix"} value={shortFormCode(cur.code)} color="blue" />
                <span>–</span>
                <Token label={lang === "th" ? "ปีเดือนวัน (YYMMDD)" : "YYMMDD"} value="260525" color="violet" />
                <span>–</span>
                <Token label={lang === "th" ? "Running" : "Running"} value="0143" color="emerald" />
              </div>
              <div className="ttm-numbering-preview">
                <span className="ttm-muted ttm-small">{lang === "th" ? "ตัวอย่าง" : "Preview"}</span>
                <span className="ttm-mono">{shortFormCode(cur.code)}-260525-0143</span>
              </div>
              <div className="ttm-numbering-options">
                <Field label={lang === "th" ? "เริ่มนับใหม่" : "Reset counter"}>
                  <Select value={editNumbering.reset || "year"} onChange={e => setEditNumbering({ ...editNumbering, reset: e.target.value })}>
                    <option value="never">{lang === "th" ? "ไม่รีเซ็ต" : "Never"}</option>
                    <option value="year">{lang === "th" ? "ทุกปี" : "Yearly"}</option>
                    <option value="month">{lang === "th" ? "ทุกเดือน" : "Monthly"}</option>
                  </Select>
                </Field>
                <Field label={lang === "th" ? "จำนวนหลัก Running" : "Running digits"}>
                  <Select value={String(editNumbering.digits || "4")} onChange={e => setEditNumbering({ ...editNumbering, digits: e.target.value })}>
                    <option value="3">3 (001-999)</option>
                    <option value="4">4 (0001-9999)</option>
                    <option value="5">5 (00001-99999)</option>
                  </Select>
                </Field>
                <Field label={lang === "th" ? "ค่า Running ปัจจุบัน" : "Current running"}>
                  <Input value={editNumbering.current || ""} onChange={e => setEditNumbering({ ...editNumbering, current: e.target.value })} />
                </Field>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <Button variant="secondary" size="sm" icon="check" onClick={saveNumbering} disabled={saving}>
                  {lang === "th" ? "บันทึกการตั้งค่าเลขเอกสาร" : "Save numbering"}
                </Button>
                {saveMsg && <span style={{ color: saveMsg.startsWith("✓") ? "var(--c-green)" : "var(--c-red)", fontSize: "0.85rem" }}>{saveMsg}</span>}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              title={lang === "th" ? "ลำดับการอนุมัติ" : "Approval chain"}
              right={
                <Button variant="ghost" size="sm" icon="plus" onClick={() => {
                  setEditApprovers([...(editApprovers || []), { roleTh: "ผู้อนุมัติใหม่", roleEn: "New approver", slaDays: 1, userId: "" }]);
                }}>{lang === "th" ? "เพิ่มขั้น" : "Add step"}</Button>
              }
            />
            <ApprovalChainEditor
              key={cur.code}
              approvers={editApprovers || []}
              users={users}
              lang={lang}
              onChange={setEditApprovers}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <Button variant="primary" icon="check" onClick={saveApprovers} disabled={saving}>
                {saving ? (lang === "th" ? "กำลังบันทึก..." : "Saving...") : (lang === "th" ? "บันทึกการเปลี่ยนแปลง" : "Save changes")}
              </Button>
              {saveMsg && <span style={{ color: saveMsg.startsWith("✓") ? "var(--c-green)" : "var(--c-red)", fontSize: "0.85rem" }}>{saveMsg}</span>}
              <span className="ttm-spacer" />
              <span className="ttm-muted ttm-small">
                {lang === "th" ? "การเปลี่ยนแปลงจะมีผลกับคำขอที่สร้างใหม่เท่านั้น" : "Changes apply only to new requests"}
              </span>
            </div>
          </Card>

          <Card>
            <SectionTitle title={lang === "th" ? "ช่องทางการแจ้งเตือน" : "Notification channels"} />
            <div className="ttm-channel-toggles">
              {[
                { id: "line-group", label: lang === "th" ? "LINE กลุ่ม IT Operations" : "LINE group: IT Operations", icon: "line" },
                { id: "line-personal", label: lang === "th" ? "LINE ผู้อนุมัติเฉพาะคน" : "LINE: assigned approver", icon: "line" },
                { id: "email-approver", label: lang === "th" ? "Email ผู้อนุมัติพร้อมลิงก์" : "Email approver with link", icon: "mail" },
                { id: "email-it", label: lang === "th" ? "Email ทีม IT เมื่ออนุมัติครบ" : "Email IT team on full approval", icon: "mail" },
                { id: "inapp", label: lang === "th" ? "แจ้งเตือนภายในแอป" : "In-app notification", icon: "bell" },
                { id: "requester-line", label: lang === "th" ? "แจ้งผลกลับผู้แจ้งทาง LINE" : "Notify requester via LINE", icon: "line" },
              ].map(ch => (
                <div key={ch.id} className="ttm-channel-toggle">
                  <div className="ttm-channel-toggle-l">
                    <Icon name={ch.icon} size={15} />
                    <span>{ch.label}</span>
                  </div>
                  <Switch
                    checked={editNotifChannels[ch.id] !== false}
                    onChange={e => setEditNotifChannels({ ...editNotifChannels, [ch.id]: e.target.checked })}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <Button variant="secondary" size="sm" icon="check" onClick={saveNotifChans} disabled={saving}>
                {lang === "th" ? "บันทึกช่องทางแจ้งเตือน" : "Save notification channels"}
              </Button>
              {saveMsg && <span style={{ color: saveMsg.startsWith("✓") ? "var(--c-green)" : "var(--c-red)", fontSize: "0.85rem" }}>{saveMsg}</span>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Token({ label, value, color }) {
  return (
    <span className={cls("ttm-token", `is-${color}`)}>
      <span className="ttm-token-label">{label}</span>
      <span className="ttm-token-value ttm-mono">{value}</span>
    </span>
  );
}

function ApprovalChainEditor({ approvers, users = [], lang, onChange }) {
  // Per-step mode: "role" = free-text role name, "user" = pick specific user from DB
  // Initialise from data: if userId is already set → user mode, else → role mode
  const [modeByIdx, setModeByIdx] = React.useState(() =>
    Object.fromEntries(approvers.map((r, i) => [i, (typeof r !== "string" && r.userId) ? "user" : "role"]))
  );

  const switchMode = (i, m) => {
    setModeByIdx(prev => ({ ...prev, [i]: m }));
    if (m === "role") {
      // clear userId when going back to role mode
      const next = [...approvers];
      next[i] = { ...next[i], userId: "" };
      onChange?.(next);
    }
  };

  const update = (i, patch) => {
    const next = [...approvers];
    next[i] = { ...next[i], ...patch };
    onChange?.(next);
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= approvers.length) return;
    const next = [...approvers];
    [next[i], next[j]] = [next[j], next[i]];
    setModeByIdx(prev => { const n = { ...prev }; [n[i], n[j]] = [n[j], n[i]]; return n; });
    onChange?.(next);
  };

  const remove = (i) => {
    setModeByIdx(prev => {
      const n = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = Number(k);
        if (ki < i) n[ki] = v;
        else if (ki > i) n[ki - 1] = v;
      });
      return n;
    });
    onChange?.(approvers.filter((_, idx) => idx !== i));
  };

  if (approvers.length === 0) {
    return (
      <div className="ttm-empty" style={{ padding: "1rem", textAlign: "center", color: "var(--muted)" }}>
        {lang === "th" ? "ยังไม่มีขั้นอนุมัติ — กดปุ่ม \"เพิ่มขั้น\" ด้านบนเพื่อเริ่ม" : "No approval steps yet — click \"Add step\" above"}
      </div>
    );
  }

  return (
    <ol className="ttm-chain-editor">
      {approvers.map((r, i) => {
        const roleTh = typeof r === "string" ? r : (r.roleTh || "");
        const roleEn = typeof r === "string" ? r : (r.roleEn || "");
        const userId = typeof r === "string" ? "" : (r.userId || "");
        const sla   = typeof r === "string" ? 1 : (r.slaDays ?? 1);
        const mode  = modeByIdx[i] ?? (userId ? "user" : "role");
        const selUser = mode === "user" ? (users.find(u => u.id === userId) || null) : null;

        return (
          <li key={i} className="ttm-chain-step">
            <div className="ttm-chain-num">{i + 1}</div>

            <div className="ttm-chain-content">
              {/* ── Mode toggle ── */}
              <div className="ttm-chain-mode-tabs">
                <button type="button" className={cls("ttm-chain-mode-tab", mode === "role" && "is-active")}
                  onClick={() => switchMode(i, "role")}>
                  <Icon name="users" size={13} />
                  {lang === "th" ? "บทบาท" : "By role"}
                </button>
                <button type="button" className={cls("ttm-chain-mode-tab", mode === "user" && "is-active")}
                  onClick={() => switchMode(i, "user")}>
                  <Icon name="user" size={13} />
                  {lang === "th" ? "ระบุชื่อผู้ใช้" : "Specific user"}
                </button>
              </div>

              {mode === "role" ? (
                /* ── Role mode: free-text role name ── */
                <div className="ttm-chain-fields">
                  <Field label={lang === "th" ? "บทบาท (ไทย)" : "Role (TH)"}>
                    <Input value={roleTh} onChange={e => update(i, { roleTh: e.target.value })} />
                  </Field>
                  <Field label={lang === "th" ? "บทบาท (EN)" : "Role (EN)"}>
                    <Input value={roleEn} onChange={e => update(i, { roleEn: e.target.value })} />
                  </Field>
                  <Field label="SLA">
                    <Select value={String(sla)} onChange={e => update(i, { slaDays: Number(e.target.value) })}>
                      <option value="0.5">4 {lang === "th" ? "ชม." : "hrs"}</option>
                      <option value="1">1 {lang === "th" ? "วัน" : "day"}</option>
                      <option value="2">2 {lang === "th" ? "วัน" : "days"}</option>
                      <option value="3">3 {lang === "th" ? "วัน" : "days"}</option>
                    </Select>
                  </Field>
                </div>
              ) : (
                /* ── User mode: pick a real user ── */
                <>
                  <div className="ttm-chain-fields is-user">
                    <Field label={lang === "th" ? "เลือกผู้อนุมัติ" : "Select approver"}>
                      <Select value={userId} onChange={e => {
                        const u = users.find(x => x.id === e.target.value);
                        update(i, {
                          userId:  e.target.value,
                          roleTh:  u ? (u.nameTh  || u.username) : "",
                          roleEn:  u ? (u.nameEn  || u.nameTh || u.username) : "",
                        });
                      }}>
                        <option value="">{lang === "th" ? "— เลือกผู้ใช้ —" : "— Select user —"}</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {(lang === "th" ? u.nameTh : u.nameEn) || u.username}
                            {(lang === "th" ? u.titleTh : u.titleEn) ? ` · ${lang === "th" ? u.titleTh : u.titleEn}` : ""}
                            {` (${u.role})`}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="SLA">
                      <Select value={String(sla)} onChange={e => update(i, { slaDays: Number(e.target.value) })}>
                        <option value="0.5">4 {lang === "th" ? "ชม." : "hrs"}</option>
                        <option value="1">1 {lang === "th" ? "วัน" : "day"}</option>
                        <option value="2">2 {lang === "th" ? "วัน" : "days"}</option>
                        <option value="3">3 {lang === "th" ? "วัน" : "days"}</option>
                      </Select>
                    </Field>
                  </div>

                  {/* Preview card for the selected user */}
                  {selUser && (
                    <div className="ttm-chain-user-preview">
                      <Avatar user={selUser} size={34} />
                      <div>
                        <div className="ttm-chain-user-name">
                          {lang === "th" ? selUser.nameTh : selUser.nameEn}
                        </div>
                        <div className="ttm-chain-user-sub">
                          {(lang === "th" ? selUser.titleTh : selUser.titleEn) || selUser.role}
                          {selUser.dept ? ` · ${selUser.dept}` : ""}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="ttm-chain-actions">
              <IconButton icon="arrow-up"   title={lang === "th" ? "เลื่อนขึ้น" : "Move up"}   onClick={() => move(i, -1)} />
              <IconButton icon="arrow-down" title={lang === "th" ? "เลื่อนลง"  : "Move down"} onClick={() => move(i, 1)}  />
              <IconButton icon="trash"      title={lang === "th" ? "ลบ"        : "Remove"}     onClick={() => remove(i)}   />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
