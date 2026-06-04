"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Avatar, Badge, Button, Card, Check, Field, Input, Select, Stepper, Textarea } from "./Ui";
import { shortFormCode, fmtBKK, todayBKK } from "../lib/data";
import { useAppData } from "../lib/AppDataContext";

// Walk the given sections and return labels of required fields that are empty.
// Respects showWhen visibility — invisible fields are not required.
function collectMissingRequired(sections, sch, lang = "th") {
  const missing = [];
  const visible = (f, siblings) => {
    if (!f.showWhen || !siblings) return true;
    const target = siblings[f.showWhen.field];
    if (f.showWhen.equals !== undefined && target !== f.showWhen.equals) return false;
    if (Array.isArray(f.showWhen.in)  && !f.showWhen.in.includes(target)) return false;
    return true;
  };
  const isEmpty = (v) => {
    if (v === undefined || v === null) return true;
    if (typeof v === "string") return v.trim() === "";
    if (Array.isArray(v)) return v.length === 0;
    return false;
  };
  const walk = (fields, values) => {
    (fields || []).forEach(f => {
      if (!visible(f, values)) return;
      // For a checkbox carrying subFields, the value shape is { checked, sub }.
      if (f.type === "checkbox" && Array.isArray(f.subFields) && f.subFields.length > 0) {
        const v = values[f.id];
        const checked = v && typeof v === "object" ? v.checked === true : v === true;
        if (f.required && !checked) {
          missing.push(lang === "th" ? f.labelTh : f.labelEn);
        }
        if (checked) {
          const sub = (v && typeof v === "object" ? v.sub : null) || {};
          walk(f.subFields, sub);
        }
        return;
      }
      if (f.required && isEmpty(values[f.id])) {
        missing.push(lang === "th" ? f.labelTh : f.labelEn);
      }
    });
  };
  (sections || []).forEach(sec => walk(sec.fields, sch));
  return missing;
}

// Local fallback when the running-number API is unreachable
function genDocNoFallback(code) {
  const d = new Date();
  const yymmdd = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `${shortFormCode(code)}-${yymmdd}-${n}`;
}

export function FormFill({ lang, t, code, back, onSubmitted, currentUser }) {
  const { FORM_TEMPLATES, USERS } = useAppData();
  const tmpl = FORM_TEMPLATES.find(f => f.code === code) || FORM_TEMPLATES[0] || { code, color: "blue", icon: "file-text", titleTh: code, titleEn: code, approvers: [], sections: [] };
  const hasSections = Array.isArray(tmpl.sections) && tmpl.sections.length > 0;
  const [submitting, setSubmitting] = React.useState(false);
  const [stepIdx, setStepIdx] = React.useState(0);
  const today = todayBKK();
  const [state, setState] = React.useState(() => ({
    docNo: "",  // will be filled in by server-side running-number API on mount
    // Hardcoded path defaults (used when template has no sections)
    employeeName: lang === "th" ? "นพดล ศรีจันทร์" : "Nopadol Srichan",
    employeeId: "EMP-2526-014",
    position: "Call Center Agent",
    department: "Operations / Project AIS",
    section: "Inbound Service",
    dateRequest: "2026-05-25",
    dateEffective: "2026-06-01",
    time: "09:00",
    employeeType: "permanent",
    requestKind: "use",
    items: {
      email: true, emailRole: "user", emailSize: "10", emailCalendar: true, emailAddr: "nopadol.s",
      group: false, members: ["", "", ""],
      pbx: true, pbxRole: "user",
      pc: false, notebook: true, headset: true,
      vpn: false, msoffice: true, idcard: true, deskchair: false,
      project: "AIS Premier",
      other: "",
    },
    purpose: lang === "th"
      ? "พนักงานใหม่เริ่มงาน 1 มิ.ย. 2569 ในตำแหน่ง Call Center Agent โครงการ AIS Premier ต้องการ Email, สิทธิ์ PBX, Notebook และอุปกรณ์ครบเซ็ตเพื่อเริ่มงานในวันแรก"
      : "New hire starts 1 Jun 2026 as a Call Center Agent on Project AIS Premier — needs email, PBX access, notebook, and a full equipment set for day one.",
    // Dynamic schema bucket — prefill basic fields from currentUser
    sch: {
      employeeName: lang === "th" ? (currentUser?.nameTh || "") : (currentUser?.nameEn || ""),
      employeeId: currentUser?.id || "",
      position: lang === "th" ? (currentUser?.titleTh || "") : (currentUser?.titleEn || ""),
      department: currentUser?.dept || "",
      dateRequest: today,
    },
  }));

  const set = (k, v) => setState(s => ({ ...s, [k]: v }));
  const setItem = (k, v) => setState(s => ({ ...s, items: { ...s.items, [k]: v } }));

  // Reserve a real running document number from the server when the form mounts
  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/forms/${encodeURIComponent(tmpl.code)}/next-number`, { method: "POST" })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => { if (!cancelled && d?.docNo) setState(s => ({ ...s, docNo: d.docNo })); })
      .catch(err => {
        console.warn("next-number API failed, using fallback:", err);
        if (!cancelled) setState(s => ({ ...s, docNo: genDocNoFallback(tmpl.code) }));
      });
    return () => { cancelled = true; };
  }, [tmpl.code]);

  const steps = lang === "th"
    ? ["ข้อมูลผู้แจ้ง", "รายละเอียดคำขอ", "ผู้อนุมัติ", "ตรวจสอบ & ส่ง"]
    : ["Requester info", "Request details", "Approver chain", "Review & submit"];

  return (
    <div className="ttm-page ttm-form-fill">
      <div className="ttm-crumbs">
        <button className="ttm-crumb" onClick={back}><Icon name="arrow-left" size={14} /> {lang === "th" ? "กลับไปเลือกฟอร์ม" : "Back to forms"}</button>
      </div>

      <Card className="ttm-form-head">
        <div className="ttm-form-head-meta">
          <div className={cls("ttm-form-head-icon", `is-${tmpl.color}`)}>
            <Icon name={tmpl.icon} size={24} />
          </div>
          <div>
            <div className="ttm-form-head-code">{tmpl.code} · Rev 00 · {lang === "th" ? "บังคับใช้ 01/03/2569" : "Effective 01/03/2026"}</div>
            <h2>{lang === "th" ? tmpl.titleTh : tmpl.titleEn}</h2>
          </div>
        </div>
        <div className="ttm-form-head-doc">
          <div className="ttm-form-head-label">
            <Icon name="fingerprint" size={13} />
            <span>{t.common.runningNumber}</span>
          </div>
          <div className="ttm-form-head-docno ttm-mono">{state.docNo}</div>
        </div>
      </Card>

      <Stepper steps={steps} current={stepIdx} />

      {hasSections ? (
        <>
          {stepIdx === 0 && <StepDynamicSchema lang={lang} sections={[tmpl.sections[0]]} state={state} set={set} />}
          {stepIdx === 1 && <StepDynamicSchema lang={lang} sections={tmpl.sections.slice(1)} state={state} set={set} />}
          {stepIdx === 2 && <StepDynamicApprovers lang={lang} tmpl={tmpl} currentUser={currentUser} />}
          {stepIdx === 3 && <StepDynamicReview lang={lang} state={state} tmpl={tmpl} currentUser={currentUser} />}
        </>
      ) : (
        <>
          {stepIdx === 0 && <StepRequester lang={lang} t={t} state={state} set={set} />}
          {stepIdx === 1 && <StepDetails lang={lang} state={state} set={set} setItem={setItem} />}
          {stepIdx === 2 && <StepApprovers lang={lang} />}
          {stepIdx === 3 && <StepReview lang={lang} t={t} state={state} tmpl={tmpl} />}
        </>
      )}

      <div className="ttm-form-actions">
        <Button variant="ghost" icon="trash" onClick={() => {
          if (confirm(lang === "th" ? "ยกเลิกและกลับไปเลือกฟอร์ม? ข้อมูลที่กรอกจะหายไป" : "Cancel and go back? Your input will be lost.")) {
            back();
          }
        }}>{t.common.cancel}</Button>
        <div className="ttm-spacer" />
        <Button variant="ghost" icon="file-text" onClick={async () => {
          // Save as draft to localStorage (offline-friendly)
          try {
            const key = `ttmflow.draft.${tmpl.code}`;
            localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), state }));
            alert(lang === "th" ? "✓ บันทึกฉบับร่างในเครื่องแล้ว" : "✓ Draft saved locally");
          } catch {
            alert(lang === "th" ? "บันทึกไม่สำเร็จ" : "Save failed");
          }
        }}>{t.common.saveDraft}</Button>
        {stepIdx > 0 && <Button variant="secondary" icon="arrow-left" onClick={() => setStepIdx(stepIdx - 1)}>{t.common.back}</Button>}
        {stepIdx < 3 && <Button variant="primary" onClick={() => {
          // Validate the current dynamic step before advancing
          if (hasSections && (stepIdx === 0 || stepIdx === 1)) {
            const stepSections = stepIdx === 0 ? [tmpl.sections[0]] : tmpl.sections.slice(1);
            const missing = collectMissingRequired(stepSections, state.sch || {});
            if (missing.length > 0) {
              alert((lang === "th" ? "กรุณากรอกข้อมูลที่จำเป็น:\n• " : "Please fill required fields:\n• ") + missing.join("\n• "));
              return;
            }
          }
          setStepIdx(stepIdx + 1);
        }}>{t.common.next} <Icon name="arrow-right" size={15} /></Button>}
        {stepIdx === 3 && <Button variant="primary" icon="send" disabled={submitting || !state.docNo} onClick={async () => {
          if (submitting || !state.docNo) return;
          setSubmitting(true);
            // Safety: filter out any "ผู้แจ้งเรื่อง / Requester" entry from the template
            // chain — that step is added by us below and would otherwise duplicate.
            const isRequesterRole = (r) => {
              const role = typeof r === "string" ? r : (r.roleTh || r.roleEn || "");
              const n = role.trim().toLowerCase();
              return n === "ผู้แจ้งเรื่อง" || n === "ผู้แจ้ง" || n === "requester" || n === "submitter";
            };
            const approvers = (tmpl.approvers || []).filter(a => !isRequesterRole(a));
            // Resolve display values for external-signer steps from form data
            const sch = state.sch || {};
            const steps = [
              { role: lang === "th" ? "ผู้แจ้งเรื่อง" : "Requester", user: currentUser?.id || "REQ003", action: "submitted", at: fmtBKK(), signed: true },
              ...approvers.map((a, i) => {
                const isExternal = typeof a === "object" && a.source === "external";
                const baseRole = typeof a === "string" ? a : (a.roleTh || a.roleEn || `Step ${i+1}`);
                if (isExternal) {
                  return {
                    role: baseRole,
                    source: "external",
                    user: "",
                    displayName:  a.nameField  ? (sch[a.nameField]  || "") : "",
                    displayTitle: a.titleField ? (sch[a.titleField] || "") : "",
                    expiresInDays: a.expiresInDays || 7,
                    action: i === 0 ? "pending" : "queued",
                    at: null, signed: false,
                  };
                }
                return {
                  role: baseRole,
                  user: typeof a === "string" ? "" : (a.userId || ""),
                  action: i === 0 ? "pending" : "queued",
                  at: null, signed: false,
                };
              }),
            ];
            // For dynamic-section forms use the template title; for legacy forms use the purpose text
            const reqTitleTh = hasSections
              ? tmpl.titleTh
              : (state.purpose?.slice(0, 80) || tmpl.titleTh);
            const reqTitleEn = hasSections
              ? tmpl.titleEn
              : (state.purpose?.slice(0, 80) || tmpl.titleEn);
            let ok = false;
            try {
              const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: state.docNo,
                  template: tmpl.code,
                  titleTh: reqTitleTh,
                  titleEn: reqTitleEn,
                  priority: "normal",
                  status: "pending",
                  currentStep: 1,
                  steps,
                  payload: state,
                }),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert((lang === "th" ? "บันทึกไม่สำเร็จ: " : "Submit failed: ") + (err.error || res.statusText || res.status));
                console.error("Submit failed:", res.status, err);
              } else {
                ok = true;
              }
            } catch (e) {
              alert((lang === "th" ? "เกิดข้อผิดพลาด: " : "Error: ") + e.message);
              console.error("Submit error:", e);
            } finally {
              setSubmitting(false);
            }
            if (ok) onSubmitted(state.docNo);
          }}>{t.common.submit}</Button>}
      </div>
    </div>
  );
}

function StepRequester({ lang, t, state, set }) {
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>1. {lang === "th" ? "ข้อมูลผู้แจ้ง / ผู้ขอใช้บริการ" : "Requester information"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "ดึงจาก SSO อัตโนมัติ — แก้ไขเฉพาะข้อมูลพนักงานปลายทาง" : "Auto-filled from SSO — edit only the target employee"}</span>
      </div>
      <div className="ttm-form-grid">
        <Field label={lang === "th" ? "ชื่อ-นามสกุล" : "Full name"} required>
          <Input value={state.employeeName} onChange={e => set("employeeName", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "รหัสพนักงาน" : "Employee ID"} required>
          <Input value={state.employeeId} onChange={e => set("employeeId", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "ตำแหน่ง" : "Position"} required>
          <Input value={state.position} onChange={e => set("position", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "ฝ่ายงาน / แผนก" : "Department"} required>
          <Input value={state.department} onChange={e => set("department", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "ส่วนงาน / โครงการ" : "Section / Project"}>
          <Input value={state.section} onChange={e => set("section", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "วันที่แจ้ง" : "Request date"} required>
          <Input type="date" value={state.dateRequest} onChange={e => set("dateRequest", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "วันที่ต้องการให้มีผล" : "Effective date"} required>
          <Input type="date" value={state.dateEffective} onChange={e => set("dateEffective", e.target.value)} />
        </Field>
        <Field label={t.common.time}>
          <Input type="time" value={state.time} onChange={e => set("time", e.target.value)} />
        </Field>
      </div>

      <div className="ttm-form-subsection">
        <h4>{lang === "th" ? "ส่วนที่ 2 — ประเภทพนักงาน" : "Section 2 — Employment type"}</h4>
        <div className="ttm-radio-row">
          <Check radio name="emp" checked={state.employeeType === "permanent"} onChange={() => set("employeeType", "permanent")} label={lang === "th" ? "ประจำ" : "Permanent"} />
          <Check radio name="emp" checked={state.employeeType === "contract"} onChange={() => set("employeeType", "contract")} label={lang === "th" ? "สัญญาจ้าง" : "Contract"} />
        </div>
      </div>

      <div className="ttm-form-subsection">
        <h4>{lang === "th" ? "ส่วนที่ 3 — ประเภทการร้องขอ" : "Section 3 — Request type"}</h4>
        <div className="ttm-radio-row">
          <Check radio name="kind" checked={state.requestKind === "use"} onChange={() => set("requestKind", "use")} label={lang === "th" ? "ใช้งาน" : "Use / Grant"} />
          <Check radio name="kind" checked={state.requestKind === "cancel"} onChange={() => set("requestKind", "cancel")} label={lang === "th" ? "ยกเลิก" : "Cancel"} />
          <Check radio name="kind" checked={state.requestKind === "transfer"} onChange={() => set("requestKind", "transfer")} label={lang === "th" ? "โอนสิทธิ์" : "Transfer"} />
        </div>
      </div>
    </Card>
  );
}

function StepDetails({ lang, state, set, setItem }) {
  const it = state.items;
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>4. {lang === "th" ? "รายการสิทธิ์และอุปกรณ์" : "Items & permissions"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "ติ๊กเลือกรายการที่ต้องการขอ" : "Tick the items to request"}</span>
      </div>

      <div className={cls("ttm-tile", it.email && "is-on")}>
        <div className="ttm-tile-head">
          <Check checked={it.email} onChange={e => setItem("email", e.target.checked)} label={
            <span><strong>Email บริษัท</strong> <span className="ttm-muted">— ขอเปิดอีเมลบริษัท พร้อมตั้งค่าสิทธิ์ ขนาดพื้นที่ และฟีเจอร์</span></span>
          } />
        </div>
        {it.email && (
          <div className="ttm-tile-body">
            <Field label={lang === "th" ? "ชื่ออีเมลที่ต้องการ" : "Desired email"} hint="@talktome.co.th">
              <div className="ttm-input-suffix">
                <Input value={it.emailAddr} onChange={e => setItem("emailAddr", e.target.value)} />
                <span>@talktome.co.th</span>
              </div>
            </Field>
            <div className="ttm-mini-row">
              <span className="ttm-mini-label">{lang === "th" ? "สิทธิ์" : "Role"}</span>
              <Check radio checked={it.emailRole === "user"} onChange={() => setItem("emailRole", "user")} label="User" />
              <Check radio checked={it.emailRole === "admin"} onChange={() => setItem("emailRole", "admin")} label="Administrator" />
            </div>
            <div className="ttm-mini-row">
              <span className="ttm-mini-label">{lang === "th" ? "ขนาดพื้นที่" : "Mailbox size"}</span>
              <Check radio checked={it.emailSize === "5"} onChange={() => setItem("emailSize", "5")} label="5 GB" />
              <Check radio checked={it.emailSize === "10"} onChange={() => setItem("emailSize", "10")} label="10 GB" />
              <Check radio checked={it.emailSize === "custom"} onChange={() => setItem("emailSize", "custom")} label={lang === "th" ? "อื่นๆ" : "Custom"} />
              {it.emailSize === "custom" && <Input className="ttm-input-mini" placeholder="GB" />}
            </div>
            <div className="ttm-mini-row">
              <span className="ttm-mini-label">{lang === "th" ? "ฟีเจอร์ปฏิทิน" : "Calendar"}</span>
              <Check radio checked={it.emailCalendar} onChange={() => setItem("emailCalendar", true)} label={lang === "th" ? "ต้องการ" : "Yes"} />
              <Check radio checked={!it.emailCalendar} onChange={() => setItem("emailCalendar", false)} label={lang === "th" ? "ไม่ต้องการ" : "No"} />
            </div>
          </div>
        )}
      </div>

      <div className={cls("ttm-tile", it.group && "is-on")}>
        <div className="ttm-tile-head">
          <Check checked={it.group} onChange={e => setItem("group", e.target.checked)} label={
            <span><strong>Group Email</strong> <span className="ttm-muted">— สำหรับแจกจ่าย, ระบุสมาชิก</span></span>
          } />
        </div>
        {it.group && (
          <div className="ttm-tile-body">
            {[0, 1, 2].map(i => (
              <Field key={i} label={`Member ${i + 1}`}>
                <div className="ttm-input-suffix">
                  <Input value={it.members[i]} onChange={e => {
                    const m = [...it.members]; m[i] = e.target.value; setItem("members", m);
                  }} />
                  <span>@talktome.co.th</span>
                </div>
              </Field>
            ))}
          </div>
        )}
      </div>

      <div className={cls("ttm-tile", it.pbx && "is-on")}>
        <div className="ttm-tile-head">
          <Check checked={it.pbx} onChange={e => setItem("pbx", e.target.checked)} label={
            <span><strong>{lang === "th" ? "User ระบบโทรศัพท์ PBX (Extension)" : "PBX User (Extension)"}</strong></span>
          } />
        </div>
        {it.pbx && (
          <div className="ttm-tile-body">
            <div className="ttm-mini-row">
              <span className="ttm-mini-label">{lang === "th" ? "สิทธิ์" : "Role"}</span>
              <Check radio checked={it.pbxRole === "user"} onChange={() => setItem("pbxRole", "user")} label="User" />
              <Check radio checked={it.pbxRole === "supervisor"} onChange={() => setItem("pbxRole", "supervisor")} label="Supervisor" />
              <Check radio checked={it.pbxRole === "admin"} onChange={() => setItem("pbxRole", "admin")} label="Administrator" />
            </div>
          </div>
        )}
      </div>

      <div className="ttm-tile">
        <div className="ttm-tile-head">
          <strong>{lang === "th" ? "อุปกรณ์ / สิทธิ์อื่นๆ" : "Other equipment / permissions"}</strong>
        </div>
        <div className="ttm-tile-body ttm-equip-grid">
          {[
            ["pc", lang === "th" ? "PC ตั้งโต๊ะ (Personal)" : "PC Desktop (Personal)"],
            ["notebook", lang === "th" ? "Notebook (Personal)" : "Notebook (Personal)"],
            ["headset", lang === "th" ? "Headset (Personal)" : "Headset (Personal)"],
            ["vpn", "VPN Account (Work from home)"],
            ["msoffice", "License MS Office"],
            ["idcard", lang === "th" ? "บัตรพนักงาน + สายคล้อง" : "Employee ID card + lanyard"],
            ["deskchair", lang === "th" ? "โต๊ะ + เก้าอี้" : "Desk + chair"],
          ].map(([k, label]) => (
            <Check key={k} checked={!!it[k]} onChange={e => setItem(k, e.target.checked)} label={label} />
          ))}
        </div>
        <div className="ttm-tile-body">
          <Field label={lang === "th" ? "สิทธิ์ในการเข้าถึงระบบ / โครงการ" : "System / Project access"}>
            <Input value={it.project} onChange={e => setItem("project", e.target.value)} />
          </Field>
          <Field label={lang === "th" ? "อื่นๆ (ระบุ)" : "Other (specify)"}>
            <Input value={it.other} onChange={e => setItem("other", e.target.value)} placeholder={lang === "th" ? "ระบุรายการเพิ่มเติม..." : "Specify..."} />
          </Field>
        </div>
      </div>

      <div className="ttm-form-section-head">
        <h3>5. {lang === "th" ? "จุดประสงค์ในการขอ" : "Purpose"}</h3>
      </div>
      <Textarea rows={4} value={state.purpose} onChange={e => set("purpose", e.target.value)} />
    </Card>
  );
}

function StepApprovers({ lang }) {
  const { USERS } = useAppData();
  const fallback = { nameTh: "—", nameEn: "—", titleTh: "—", titleEn: "—", avatar: "?" };
  const chain = [
    { user: USERS.REQ003 || fallback, role: lang === "th" ? "ผู้แจ้งเรื่อง" : "Requester", auto: true },
    { user: USERS.APP001 || fallback, role: lang === "th" ? "หัวหน้าฝ่ายผู้แจ้ง" : "Line Manager", sla: "1 " + (lang === "th" ? "วันทำการ" : "business day") },
    { user: USERS.APP002 || fallback, role: lang === "th" ? "ผู้จัดการฝ่าย IT" : "IT Manager", sla: "1 " + (lang === "th" ? "วันทำการ" : "business day") },
    { user: USERS.IT001 || fallback, role: lang === "th" ? "เจ้าหน้าที่ IT ผู้รับงาน" : "IT Staff (assignee)", sla: "ตาม SLA งาน" },
  ];
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ลำดับการอนุมัติ" : "Approval chain"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "กำหนดตาม template ของฟอร์มนี้ — แก้ไขได้ในหน้า ตั้งค่าฟอร์ม" : "Inherited from form template — edit in Form Templates"}</span>
      </div>
      <ol className="ttm-approver-chain">
        {chain.map((c, i) => (
          <li key={i} className="ttm-approver-row">
            <div className="ttm-approver-num">{i + 1}</div>
            <Avatar user={c.user} size={40} />
            <div className="ttm-approver-meta">
              <div className="ttm-approver-name">{lang === "th" ? c.user.nameTh : c.user.nameEn}</div>
              <div className="ttm-approver-role">{c.role} · <span className="ttm-muted">{lang === "th" ? c.user.titleTh : c.user.titleEn}</span></div>
            </div>
            <div className="ttm-approver-sla">
              {c.auto
                ? <Badge kind="green">{lang === "th" ? "ลงนามอัตโนมัติเมื่อส่ง" : "Auto-sign on submit"}</Badge>
                : <Badge kind="neutral"><Icon name="clock" size={11} /> SLA {c.sla}</Badge>}
            </div>
            {i < chain.length - 1 && <div className="ttm-approver-line" />}
          </li>
        ))}
      </ol>
      <div className="ttm-info-banner">
        <Icon name="bell" size={16} />
        <span>{lang === "th"
          ? "เมื่อกดส่ง ระบบจะแจ้งเตือนผู้อนุมัติคนที่ 1 ผ่าน LINE + Email พร้อมลิงก์อนุมัติและไฟล์ PDF ต้นฉบับ"
          : "On submit, the first approver will receive a LINE + email notification with an approval link and the source PDF."}</span>
      </div>
    </Card>
  );
}

function StepReview({ lang, t, state, tmpl }) {
  return (
    <Card className="ttm-form-section ttm-review">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ตรวจสอบข้อมูลก่อนส่ง" : "Review before submission"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "ระบบจะสร้างไฟล์ PDF ตามแบบฟอร์มต้นฉบับและบันทึกประวัติทันทีที่ส่ง" : "A PDF will be generated from the registered template and logged immediately on submit."}</span>
      </div>

      <div className="ttm-review-grid">
        <ReviewBlock title={lang === "th" ? "ผู้แจ้ง" : "Requester"} items={[
          [lang === "th" ? "ชื่อ-นามสกุล" : "Name", state.employeeName],
          [lang === "th" ? "รหัสพนักงาน" : "Employee ID", state.employeeId],
          [lang === "th" ? "ตำแหน่ง" : "Position", state.position],
          [lang === "th" ? "แผนก" : "Department", state.department],
          [lang === "th" ? "วันที่ต้องการให้มีผล" : "Effective", `${state.dateEffective} ${state.time}`],
        ]} />
        <ReviewBlock title={lang === "th" ? "ประเภท" : "Type"} items={[
          [lang === "th" ? "พนักงาน" : "Employment", state.employeeType === "permanent" ? (lang === "th" ? "ประจำ" : "Permanent") : (lang === "th" ? "สัญญาจ้าง" : "Contract")],
          [lang === "th" ? "การร้องขอ" : "Request", { use: lang === "th" ? "ใช้งาน" : "Use", cancel: lang === "th" ? "ยกเลิก" : "Cancel", transfer: lang === "th" ? "โอนสิทธิ์" : "Transfer" }[state.requestKind]],
        ]} />
        <ReviewBlock wide title={lang === "th" ? "รายการที่ขอ" : "Requested items"} items={[
          ...(state.items.email ? [["Email", `${state.items.emailAddr}@talktome.co.th · ${state.items.emailRole} · ${state.items.emailSize} GB · ${state.items.emailCalendar ? (lang === "th" ? "+ปฏิทิน" : "+calendar") : ""}`]] : []),
          ...(state.items.pbx ? [["PBX", `${state.items.pbxRole}`]] : []),
          ...(state.items.notebook ? [["Notebook", "Personal"]] : []),
          ...(state.items.headset ? [["Headset", "Personal"]] : []),
          ...(state.items.msoffice ? [["MS Office", "License"]] : []),
          ...(state.items.idcard ? [[lang === "th" ? "บัตรพนักงาน" : "ID card", "+ สายคล้อง"]] : []),
          ...(state.items.project ? [[lang === "th" ? "เข้าถึงโครงการ" : "Project access", state.items.project]] : []),
        ]} />
        <ReviewBlock wide title={lang === "th" ? "จุดประสงค์" : "Purpose"} items={[["", state.purpose]]} freeform />
      </div>

      <Card className="ttm-pdf-preview-mini">
        <div className="ttm-pdf-mini-head">
          <Icon name="file-text" size={16} />
          <span>{lang === "th" ? "ตัวอย่าง PDF ที่จะถูกสร้าง" : "PDF preview"}</span>
          <span className="ttm-mono ttm-muted" style={{ marginLeft: 8 }}>{state.docNo}.pdf</span>
          <div className="ttm-spacer" />
          <span className="ttm-muted ttm-small">{lang === "th" ? "(ดูตัวอย่างเต็มหลังกดส่ง)" : "(Full preview after submit)"}</span>
        </div>
        <div className="ttm-pdf-mini-body">
          <PDFPaperMini state={state} tmpl={tmpl} />
        </div>
      </Card>
    </Card>
  );
}

function ReviewBlock({ title, items, wide, freeform }) {
  return (
    <div className={cls("ttm-review-block", wide && "is-wide", freeform && "is-freeform")}>
      <div className="ttm-review-title">{title}</div>
      <dl className="ttm-review-list">
        {items.map(([k, v], i) => (
          <div key={i} className="ttm-review-pair">
            {k && <dt>{k}</dt>}
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PDFPaperMini({ state, tmpl }) {
  return (
    <div className="ttm-pdf-paper ttm-pdf-paper-mini">
      <div className="ttm-pdf-band">
        <div className="ttm-pdf-band-l">
          <div>ชนิดเอกสาร : แบบฟอร์ม</div>
          <div>หน่วยงาน : เทคโนโลยีสารสนเทศ</div>
          <div>หัวข้อเรื่อง : {tmpl.titleTh}</div>
        </div>
        <div className="ttm-pdf-band-r">
          <div>รหัสเอกสาร : <span className="ttm-mono">{tmpl.code}</span></div>
          <div>แก้ไขครั้งที่ : 00</div>
          <div>วันที่บังคับใช้ : 01/03/2569</div>
        </div>
      </div>
      <h3 className="ttm-pdf-title">{tmpl.titleTh}</h3>
      <div className="ttm-pdf-docno">เลขที่เอกสาร <span className="ttm-mono">{state.docNo}</span></div>
      <div className="ttm-pdf-section-title">ส่วนที่ 1 : ข้อมูลพนักงาน</div>
      <div className="ttm-pdf-rows">
        <div>ชื่อ-นามสกุล : <u>{state.employeeName}</u> &nbsp; รหัสพนักงาน : <u>{state.employeeId}</u></div>
        <div>ตำแหน่ง : <u>{state.position}</u> &nbsp; ฝ่ายงาน : <u>{state.department}</u></div>
        <div>วันที่แจ้ง : <u>{state.dateRequest}</u> &nbsp; วันที่ต้องการให้มีผล : <u>{state.dateEffective}</u> &nbsp; เวลา : <u>{state.time}</u></div>
      </div>
      <div className="ttm-pdf-section-title">ส่วนที่ 4 : รายการสิทธิ์และอุปกรณ์</div>
      <div className="ttm-pdf-rows">
        <div>[{state.items.email ? "✓" : " "}] Email บริษัท — <u>{state.items.emailAddr}@talktome.co.th</u> · {state.items.emailSize} GB</div>
        <div>[{state.items.pbx ? "✓" : " "}] User ระบบโทรศัพท์ PBX — {state.items.pbxRole}</div>
        <div>[{state.items.notebook ? "✓" : " "}] Notebook Personal &nbsp; [{state.items.headset ? "✓" : " "}] Headset Personal &nbsp; [{state.items.msoffice ? "✓" : " "}] License MS Office</div>
      </div>
      <div className="ttm-pdf-fade">···</div>
    </div>
  );
}

function StepDynamicSchema({ lang, tmpl, sections, state, set }) {
  const sch = state.sch || {};
  const update = (id, v) => set("sch", { ...sch, [id]: v });
  const list = Array.isArray(sections) ? sections : (tmpl?.sections || []);

  if (list.length === 0) {
    return (
      <Card className="ttm-form-section">
        <div className="ttm-empty" style={{ padding: "1.5rem" }}>
          {lang === "th" ? "ไม่มีฟิลด์ในขั้นนี้" : "No fields in this step"}
        </div>
      </Card>
    );
  }

  return (
    <>
      {list.map((sec) => (
        <Card key={sec.id} className="ttm-form-section">
          <div className="ttm-form-section-head">
            <h3>{lang === "th" ? sec.titleTh : sec.titleEn}</h3>
          </div>
          <div className="ttm-form-grid">
            {(sec.fields || []).map(f => (
              <DynField key={f.id} field={f} lang={lang} value={sch[f.id]} siblings={sch} onChange={v => update(f.id, v)} />
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}

function DynField({ field, lang, value, siblings, onChange }) {
  // Conditional visibility — show only when a sibling field has a given value
  // field.showWhen = { field: "<sibling id>", equals: "<value>" }
  // field.showWhen = { field: "<sibling id>", in: ["a", "b"] }
  if (field.showWhen && siblings) {
    const target = siblings[field.showWhen.field];
    if (field.showWhen.equals !== undefined && target !== field.showWhen.equals) return null;
    if (Array.isArray(field.showWhen.in)  && !field.showWhen.in.includes(target)) return null;
  }

  const label = lang === "th" ? field.labelTh : field.labelEn;
  const hasOptions = Array.isArray(field.options) && field.options.length > 0;
  const hasSubFields = Array.isArray(field.subFields) && field.subFields.length > 0;

  // textarea
  if (field.type === "textarea") {
    return (
      <Field label={label} required={field.required} hint={field.hint} span={field.span || 3}>
        <Textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={field.rows || 3} />
      </Field>
    );
  }

  // radio with options
  if (field.type === "radio" && hasOptions) {
    return (
      <Field label={label} required={field.required} hint={field.hint} span={field.span || 3}>
        <div className="ttm-radio-row">
          {field.options.map(o => (
            <Check key={o.id} radio checked={value === o.id} onChange={() => onChange(o.id)} label={lang === "th" ? o.labelTh : o.labelEn} />
          ))}
        </div>
      </Field>
    );
  }

  // toggle (boolean Yes/No)
  if (field.type === "toggle") {
    const on = value === true || value === "yes" || value === "true";
    return (
      <Field label={label} required={field.required} hint={field.hint} span={field.span || 1}>
        <div className="ttm-radio-row">
          <Check radio checked={on} onChange={() => onChange(true)} label={lang === "th" ? "ใช้" : "Yes"} />
          <Check radio checked={!on} onChange={() => onChange(false)} label={lang === "th" ? "ไม่ใช้" : "No"} />
        </div>
      </Field>
    );
  }

  // checkbox with options (multi-select)
  if (field.type === "checkbox" && hasOptions) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <Field label={label} required={field.required} hint={field.hint} span={field.span || 3}>
        <div className="ttm-radio-row">
          {field.options.map(o => (
            <Check key={o.id}
              checked={arr.includes(o.id)}
              onChange={e => onChange(e.target.checked ? [...arr, o.id] : arr.filter(x => x !== o.id))}
              label={lang === "th" ? o.labelTh : o.labelEn} />
          ))}
        </div>
      </Field>
    );
  }

  // single checkbox (boolean) — optionally with sub-fields that appear when checked
  if (field.type === "checkbox") {
    const checked = value && typeof value === "object" ? value.checked === true : value === true;
    const sub = (value && typeof value === "object" ? value.sub : null) || {};
    const updateChecked = (c) => onChange(hasSubFields ? { checked: c, sub } : c);
    const updateSub = (subId, v) => onChange({ checked: true, sub: { ...sub, [subId]: v } });
    return (
      <Field span={field.span || 3}>
        <div className={cls("ttm-tile", checked && "is-on")}>
          <div className="ttm-tile-head">
            <Check checked={checked} onChange={e => updateChecked(e.target.checked)}
              label={<span><strong>{label}</strong>{field.hint && <span className="ttm-muted"> — {field.hint}</span>}</span>} />
          </div>
          {checked && hasSubFields && (
            <div className="ttm-tile-body">
              <div className="ttm-form-grid">
                {field.subFields.map(sf => (
                  <DynField key={sf.id} field={sf} lang={lang} value={sub[sf.id]} siblings={sub} onChange={v => updateSub(sf.id, v)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Field>
    );
  }

  // select
  if (field.type === "select") {
    return (
      <Field label={label} required={field.required} hint={field.hint} span={field.span || 1}>
        <Select value={value || ""} onChange={e => onChange(e.target.value)}>
          <option value="">— {lang === "th" ? "เลือก" : "Select"} —</option>
          {(field.options || []).map(o => <option key={o.id} value={o.id}>{lang === "th" ? o.labelTh : o.labelEn}</option>)}
        </Select>
      </Field>
    );
  }

  // text / date / time / number (default)
  return (
    <Field label={label} required={field.required} hint={field.hint} span={field.span || 1}>
      <Input
        type={field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "number" ? "number" : "text"}
        value={value || ""} onChange={e => onChange(e.target.value)}
        placeholder={field.hint || ""}
      />
    </Field>
  );
}

function StepDynamicApprovers({ lang, tmpl, currentUser }) {
  const { USERS } = useAppData();
  const placeholderUser = { nameTh: "—", nameEn: "—", titleTh: lang === "th" ? "ยังไม่ระบุ" : "Not specified", titleEn: "Not specified", avatar: "?" };
  const fallback = [
    USERS.APP001 || placeholderUser,
    USERS.APP002 || placeholderUser,
    USERS.IT001 || placeholderUser,
    USERS.IT002 || placeholderUser,
  ];
  const me = currentUser || USERS.REQ003 || placeholderUser;
  const approvers = tmpl.approvers || [];
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ลำดับการอนุมัติ" : "Approval chain"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "ตามที่ขึ้นทะเบียนใน template" : "Inherited from template"}</span>
      </div>
      <ol className="ttm-approver-chain">
        <li className="ttm-approver-row">
          <div className="ttm-approver-num">0</div>
          <Avatar user={me} size={40} />
          <div className="ttm-approver-meta">
            <div className="ttm-approver-name">{lang === "th" ? me.nameTh : me.nameEn}</div>
            <div className="ttm-approver-role">{lang === "th" ? "ผู้แจ้งเรื่อง" : "Requester"} · <span className="ttm-muted">{lang === "th" ? me.titleTh : me.titleEn}</span></div>
          </div>
          <div className="ttm-approver-sla"><Badge kind="green">{lang === "th" ? "ลงนามอัตโนมัติ" : "Auto-sign"}</Badge></div>
        </li>
        {approvers.map((role, i) => {
          const assignedUserId = typeof role === "object" ? role.userId : null;
          const assignedUser = assignedUserId ? USERS[assignedUserId] : null;
          const display = assignedUser || fallback[i % fallback.length];
          const sla = typeof role === "object" && role.slaDays ? role.slaDays : 1;
          return (
            <li key={i} className="ttm-approver-row">
              <div className="ttm-approver-num">{i + 1}</div>
              <Avatar user={display} size={40} />
              <div className="ttm-approver-meta">
                <div className="ttm-approver-name">
                  {assignedUser
                    ? (lang === "th" ? assignedUser.nameTh : assignedUser.nameEn)
                    : (typeof role === "string" ? role : (lang === "th" ? role.roleTh : role.roleEn))}
                </div>
                <div className="ttm-approver-role">
                  {assignedUser
                    ? <>{typeof role === "string" ? role : (lang === "th" ? role.roleTh : role.roleEn)} · <span className="ttm-muted">{lang === "th" ? assignedUser.titleTh : assignedUser.titleEn}</span></>
                    : <span className="ttm-muted">{lang === "th" ? "ยังไม่ระบุผู้อนุมัติ — กำหนดได้ที่ ตั้งค่าฟอร์ม" : "No assignee — set in Form Settings"}</span>}
                </div>
              </div>
              <div className="ttm-approver-sla"><Badge kind="neutral"><Icon name="clock" size={11} /> SLA {sla} {lang === "th" ? "วัน" : "d"}</Badge></div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function StepDynamicReview({ lang, state, tmpl, currentUser }) {
  const sch = state.sch || {};
  const me = currentUser;
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ตรวจสอบข้อมูลก่อนส่ง" : "Review before submission"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "ระบบจะสร้าง PDF ตาม template ที่ขึ้นทะเบียน" : "PDF will be generated from the registered template"}</span>
      </div>
      <div className="ttm-review-grid">
        {/* Who is actually submitting this form */}
        {me && (
          <ReviewBlock title={lang === "th" ? "ผู้ส่งเรื่อง (ผู้ Login)" : "Submitted by"} items={[
            [lang === "th" ? "ชื่อ-นามสกุล" : "Name",       lang === "th" ? (me.nameTh  || me.username) : (me.nameEn  || me.username)],
            [lang === "th" ? "ตำแหน่ง"      : "Position",    lang === "th" ? (me.titleTh || me.role)     : (me.titleEn || me.role)],
            [lang === "th" ? "แผนก"          : "Department",  me.dept || "—"],
          ]} />
        )}
        {tmpl.sections.map((sec) => (
          <ReviewBlock key={sec.id} wide title={lang === "th" ? sec.titleTh : sec.titleEn}
            items={sec.fields.map(f => {
              const v = sch[f.id];
              const hasOptions = Array.isArray(f.options) && f.options.length > 0;
              let display = v;
              if (f.type === "radio" && hasOptions) {
                const o = f.options.find(o => o.id === v);
                display = o ? (lang === "th" ? o.labelTh : o.labelEn) : "—";
              } else if (f.type === "toggle") {
                const on = v === true || v === "yes" || v === "true";
                display = on ? (lang === "th" ? "ใช้" : "Yes") : (lang === "th" ? "ไม่ใช้" : "No");
              } else if (f.type === "checkbox" && hasOptions) {
                const arr = Array.isArray(v) ? v : [];
                display = arr.map(id => {
                  const o = f.options.find(o => o.id === id);
                  return o ? (lang === "th" ? o.labelTh : o.labelEn) : "";
                }).filter(Boolean).join(", ") || "—";
              } else if (f.type === "checkbox") {
                // single checkbox (boolean) — may include sub-fields
                const checked = v && typeof v === "object" ? v.checked === true : v === true;
                if (!checked) return [lang === "th" ? f.labelTh : f.labelEn, lang === "th" ? "ไม่เลือก" : "Not selected"];
                if (Array.isArray(f.subFields) && f.subFields.length > 0) {
                  const sub = (v && typeof v === "object" ? v.sub : null) || {};
                  const parts = f.subFields.map(sf => {
                    const sv = sub[sf.id];
                    if (sv === undefined || sv === null || sv === "") return null;
                    if (sf.type === "radio" && Array.isArray(sf.options)) {
                      const opt = sf.options.find(o => o.id === sv);
                      return opt ? `${lang === "th" ? sf.labelTh : sf.labelEn}: ${lang === "th" ? opt.labelTh : opt.labelEn}` : null;
                    }
                    return `${lang === "th" ? sf.labelTh : sf.labelEn}: ${sv}`;
                  }).filter(Boolean);
                  display = parts.length ? `✓ ${parts.join(" · ")}` : (lang === "th" ? "เลือก" : "Selected");
                } else {
                  display = lang === "th" ? "✓ เลือก" : "✓ Selected";
                }
              } else if (f.type === "select" && hasOptions) {
                const o = f.options.find(o => o.id === v);
                display = o ? (lang === "th" ? o.labelTh : o.labelEn) : "—";
              }
              return [lang === "th" ? f.labelTh : f.labelEn, display || "—"];
            })}
          />
        ))}
      </div>
    </Card>
  );
}
