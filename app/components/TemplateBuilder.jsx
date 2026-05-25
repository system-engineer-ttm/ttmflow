"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Badge, Button, Card, Field, IconButton, Input, Select, Stepper, Switch, Textarea } from "./Ui";
import { shortFormCode } from "../lib/data";

const ICON_CHOICES = ["monitor", "phone", "wrench", "lifebuoy", "user-plus", "wallet", "file-text", "mail", "users", "shield-check", "tool", "archive"];
const COLOR_CHOICES = ["blue", "violet", "amber", "rose", "teal", "emerald"];
const CATEGORY_CHOICES = [
  { id: "IT", th: "เทคโนโลยีสารสนเทศ (IT)", en: "Information Technology" },
  { id: "HR", th: "ทรัพยากรบุคคล (HR)", en: "Human Resources" },
  { id: "FI", th: "การเงิน (Finance)", en: "Finance" },
  { id: "OP", th: "ปฏิบัติการ (Operations)", en: "Operations" },
  { id: "MK", th: "การตลาด (Marketing)", en: "Marketing" },
  { id: "AD", th: "ธุรการ (Admin)", en: "Admin" },
];

const FIELD_TYPES = [
  { id: "text", icon: "edit", labelTh: "ข้อความสั้น", labelEn: "Short text" },
  { id: "textarea", icon: "file-text", labelTh: "ข้อความยาว", labelEn: "Long text" },
  { id: "number", icon: "list", labelTh: "ตัวเลข", labelEn: "Number" },
  { id: "date", icon: "clock", labelTh: "วันที่", labelEn: "Date" },
  { id: "time", icon: "clock", labelTh: "เวลา", labelEn: "Time" },
  { id: "radio", icon: "circle-dot", labelTh: "เลือก 1 ข้อ (Radio)", labelEn: "Single choice" },
  { id: "checkbox", icon: "check-circle", labelTh: "เลือกหลายข้อ (Checkbox)", labelEn: "Multi choice" },
  { id: "select", icon: "chevron-down", labelTh: "Dropdown", labelEn: "Dropdown" },
];

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultField(type) {
  const base = { id: uid("f"), type, labelTh: "หัวข้อใหม่", labelEn: "New field", required: false, span: 1, hint: "" };
  if (["radio", "checkbox", "select"].includes(type)) {
    base.options = [
      { id: uid("o"), labelTh: "ตัวเลือก 1", labelEn: "Option 1" },
      { id: uid("o"), labelTh: "ตัวเลือก 2", labelEn: "Option 2" },
    ];
  }
  return base;
}

export function TemplateBuilder({ lang, back, onSave }) {
  const [step, setStep] = React.useState(0);
  const [tpl, setTpl] = React.useState({
    code: "FM-OP-01-01",
    category: "OP",
    titleTh: "แบบฟอร์มใหม่",
    titleEn: "New form template",
    descTh: "",
    descEn: "",
    icon: "file-text",
    color: "blue",
    effectiveDate: "2026-06-01",
    revision: "00",
    sections: [
      {
        id: uid("s"),
        titleTh: "ส่วนที่ 1 — ข้อมูลผู้แจ้ง",
        titleEn: "Section 1 — Requester info",
        fields: [
          { id: uid("f"), type: "text", labelTh: "ชื่อ-นามสกุล", labelEn: "Full name", required: true, span: 2 },
          { id: uid("f"), type: "text", labelTh: "รหัสพนักงาน", labelEn: "Employee ID", required: true, span: 1 },
          { id: uid("f"), type: "text", labelTh: "ตำแหน่ง", labelEn: "Position", required: false, span: 1 },
          { id: uid("f"), type: "text", labelTh: "แผนก / โครงการ", labelEn: "Department / Project", required: true, span: 2 },
          { id: uid("f"), type: "date", labelTh: "วันที่แจ้ง", labelEn: "Request date", required: true, span: 1 },
        ],
      },
      {
        id: uid("s"),
        titleTh: "ส่วนที่ 2 — รายละเอียดคำขอ",
        titleEn: "Section 2 — Request details",
        fields: [
          { id: uid("f"), type: "textarea", labelTh: "อธิบายรายละเอียด", labelEn: "Describe the request", required: true, span: 3 },
        ],
      },
    ],
    approvers: [
      { id: uid("a"), roleTh: "หัวหน้าฝ่ายผู้แจ้ง", roleEn: "Line Manager", sla: "1d", assign: "auto" },
      { id: uid("a"), roleTh: "ผู้จัดการฝ่ายปลายทาง", roleEn: "Target Manager", sla: "1d", assign: "auto" },
    ],
    notifications: {
      lineGroup: true, lineApprover: true,
      emailApprover: true, emailTeam: true,
      inApp: true, requesterLine: true,
    },
    numbering: { reset: "year", digits: 4, current: "0001" },
  });

  const setT = (k, v) => setTpl(p => ({ ...p, [k]: v }));
  const setN = (k, v) => setTpl(p => ({ ...p, numbering: { ...p.numbering, [k]: v } }));

  const steps = lang === "th"
    ? ["ข้อมูลพื้นฐาน", "โครงสร้างฟิลด์", "ลำดับอนุมัติ", "แจ้งเตือน & เผยแพร่"]
    : ["Basic info", "Field schema", "Approval chain", "Notifications & publish"];

  const short = shortFormCode(tpl.code);
  const sampleDoc = `${short}-${(() => { const d = new Date(); return `${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`; })()}-${String(tpl.numbering.current || "0001").padStart(tpl.numbering.digits || 4, "0")}`;

  return (
    <div className="ttm-page ttm-builder">
      <div className="ttm-crumbs">
        <button className="ttm-crumb" onClick={back}><Icon name="arrow-left" size={14} /> {lang === "th" ? "กลับไปหน้าตั้งค่าฟอร์ม" : "Back to form templates"}</button>
      </div>

      <Card className="ttm-builder-head">
        <div className="ttm-builder-head-meta">
          <div className={cls("ttm-form-head-icon", `is-${tpl.color}`)}><Icon name={tpl.icon} size={24} /></div>
          <div>
            <div className="ttm-form-head-code">{lang === "th" ? "ขึ้นทะเบียนฟอร์มใหม่" : "Register new form"}</div>
            <h2>{lang === "th" ? tpl.titleTh : tpl.titleEn}</h2>
          </div>
        </div>
        <div className="ttm-form-head-doc">
          <div className="ttm-form-head-label">
            <Icon name="fingerprint" size={13} />
            <span>{lang === "th" ? "ตัวอย่างเลขเอกสาร" : "Sample doc number"}</span>
          </div>
          <div className="ttm-form-head-docno ttm-mono">{sampleDoc}</div>
        </div>
      </Card>

      <Stepper steps={steps} current={step} />

      <div className="ttm-builder-grid">
        <div className="ttm-builder-main">
          {step === 0 && <BuilderInfo lang={lang} tpl={tpl} setT={setT} setN={setN} short={short} />}
          {step === 1 && <BuilderFields lang={lang} tpl={tpl} setTpl={setTpl} />}
          {step === 2 && <BuilderApprovers lang={lang} tpl={tpl} setTpl={setTpl} />}
          {step === 3 && <BuilderNotifications lang={lang} tpl={tpl} setTpl={setTpl} sampleDoc={sampleDoc} />}
        </div>
        <div className="ttm-builder-side">
          <Card className="ttm-builder-preview">
            <div className="ttm-builder-preview-head">
              <Icon name="file-text" size={14} />
              <strong>{lang === "th" ? "ตัวอย่างฟอร์มที่ผู้ใช้จะเห็น" : "Live preview"}</strong>
            </div>
            <BuilderLivePreview tpl={tpl} lang={lang} sampleDoc={sampleDoc} />
          </Card>
        </div>
      </div>

      <div className="ttm-form-actions">
        <Button variant="ghost" icon="trash" onClick={back}>{lang === "th" ? "ยกเลิก" : "Cancel"}</Button>
        <div className="ttm-spacer" />
        <Button variant="ghost" icon="file-text">{lang === "th" ? "บันทึกฉบับร่าง" : "Save draft"}</Button>
        {step > 0 && <Button variant="secondary" icon="arrow-left" onClick={() => setStep(step - 1)}>{lang === "th" ? "ย้อนกลับ" : "Back"}</Button>}
        {step < 3 && <Button variant="primary" onClick={() => setStep(step + 1)}>{lang === "th" ? "ถัดไป" : "Next"} <Icon name="arrow-right" size={15} /></Button>}
        {step === 3 && <Button variant="primary" icon="shield-check" onClick={() => onSave(tpl)}>{lang === "th" ? "ขึ้นทะเบียน & เผยแพร่" : "Register & publish"}</Button>}
      </div>
    </div>
  );
}

function BuilderInfo({ lang, tpl, setT, setN, short }) {
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ข้อมูลพื้นฐานของแบบฟอร์ม" : "Basic form info"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "ใช้สำหรับขึ้นทะเบียนตามมาตรฐาน ISO 9001" : "Used for ISO 9001 registration"}</span>
      </div>

      <div className="ttm-form-grid">
        <Field label={lang === "th" ? "หมวดหมู่ฝ่าย" : "Department category"} required>
          <Select value={tpl.category} onChange={e => {
            const code = `FM-${e.target.value}-01-01`;
            setT("category", e.target.value); setT("code", code);
          }}>
            {CATEGORY_CHOICES.map(c => <option key={c.id} value={c.id}>{c.id} — {lang === "th" ? c.th : c.en}</option>)}
          </Select>
        </Field>

        <Field label={lang === "th" ? "รหัสฟอร์มขึ้นทะเบียน" : "Registered form code"} required hint={lang === "th" ? `จะถูกตัดเป็นรหัสรัน: ${short}` : `Short prefix: ${short}`}>
          <Input value={tpl.code} onChange={e => setT("code", e.target.value.toUpperCase())} className="ttm-mono" />
        </Field>

        <Field label={lang === "th" ? "Revision" : "Revision"}>
          <Input value={tpl.revision} onChange={e => setT("revision", e.target.value)} className="ttm-mono" />
        </Field>

        <Field label={lang === "th" ? "ชื่อแบบฟอร์ม (ไทย)" : "Form title (Thai)"} required span={2}>
          <Input value={tpl.titleTh} onChange={e => setT("titleTh", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "ชื่อแบบฟอร์ม (อังกฤษ)" : "Form title (English)"} span={1}>
          <Input value={tpl.titleEn} onChange={e => setT("titleEn", e.target.value)} />
        </Field>

        <Field label={lang === "th" ? "คำอธิบาย (ไทย)" : "Description (Thai)"} span={3}>
          <Input value={tpl.descTh} onChange={e => setT("descTh", e.target.value)} placeholder={lang === "th" ? "เช่น ขอเปิดสิทธิ์ใช้ระบบ Email, License และอุปกรณ์" : "e.g. Request email, license and equipment"} />
        </Field>

        <Field label={lang === "th" ? "วันที่บังคับใช้" : "Effective date"} required>
          <Input type="date" value={tpl.effectiveDate} onChange={e => setT("effectiveDate", e.target.value)} />
        </Field>

        <Field label={lang === "th" ? "เริ่มนับใหม่" : "Reset counter"}>
          <Select value={tpl.numbering.reset} onChange={e => setN("reset", e.target.value)}>
            <option value="never">{lang === "th" ? "ไม่รีเซ็ต" : "Never"}</option>
            <option value="year">{lang === "th" ? "ทุกปี" : "Yearly"}</option>
            <option value="month">{lang === "th" ? "ทุกเดือน" : "Monthly"}</option>
          </Select>
        </Field>

        <Field label={lang === "th" ? "จำนวนหลัก Running" : "Running digits"}>
          <Select value={tpl.numbering.digits} onChange={e => setN("digits", Number(e.target.value))}>
            <option value="3">3 หลัก</option>
            <option value="4">4 หลัก</option>
            <option value="5">5 หลัก</option>
          </Select>
        </Field>
      </div>

      <div className="ttm-form-subsection">
        <h4>{lang === "th" ? "ไอคอน" : "Icon"}</h4>
        <div className="ttm-icon-picker">
          {ICON_CHOICES.map(ic => (
            <button key={ic} className={cls("ttm-icon-swatch", `is-${tpl.color}`, tpl.icon === ic && "is-active")} onClick={() => setT("icon", ic)} type="button">
              <Icon name={ic} size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className="ttm-form-subsection">
        <h4>{lang === "th" ? "สีประจำฟอร์ม" : "Form color"}</h4>
        <div className="ttm-color-picker">
          {COLOR_CHOICES.map(c => (
            <button key={c} className={cls("ttm-color-swatch", `is-${c}`, tpl.color === c && "is-active")} onClick={() => setT("color", c)} type="button" title={c}>
              {tpl.color === c && <Icon name="check" size={13} stroke={2.5} />}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function BuilderFields({ lang, tpl, setTpl }) {
  const addSection = () => {
    setTpl(p => ({
      ...p,
      sections: [...p.sections, { id: uid("s"), titleTh: `ส่วนที่ ${p.sections.length + 1} — ใหม่`, titleEn: `Section ${p.sections.length + 1} — New`, fields: [] }],
    }));
  };

  const updateSection = (idx, patch) => {
    setTpl(p => {
      const sections = [...p.sections];
      sections[idx] = { ...sections[idx], ...patch };
      return { ...p, sections };
    });
  };

  const moveSection = (idx, dir) => {
    setTpl(p => {
      const sections = [...p.sections];
      const j = idx + dir;
      if (j < 0 || j >= sections.length) return p;
      [sections[idx], sections[j]] = [sections[j], sections[idx]];
      return { ...p, sections };
    });
  };

  const deleteSection = (idx) => {
    setTpl(p => ({ ...p, sections: p.sections.filter((_, i) => i !== idx) }));
  };

  const addField = (idx, type) => {
    setTpl(p => {
      const sections = [...p.sections];
      sections[idx] = { ...sections[idx], fields: [...sections[idx].fields, defaultField(type)] };
      return { ...p, sections };
    });
  };

  const updateField = (sIdx, fIdx, patch) => {
    setTpl(p => {
      const sections = [...p.sections];
      const fields = [...sections[sIdx].fields];
      fields[fIdx] = { ...fields[fIdx], ...patch };
      sections[sIdx] = { ...sections[sIdx], fields };
      return { ...p, sections };
    });
  };

  const moveField = (sIdx, fIdx, dir) => {
    setTpl(p => {
      const sections = [...p.sections];
      const fields = [...sections[sIdx].fields];
      const j = fIdx + dir;
      if (j < 0 || j >= fields.length) return p;
      [fields[fIdx], fields[j]] = [fields[j], fields[fIdx]];
      sections[sIdx] = { ...sections[sIdx], fields };
      return { ...p, sections };
    });
  };

  const deleteField = (sIdx, fIdx) => {
    setTpl(p => {
      const sections = [...p.sections];
      sections[sIdx] = { ...sections[sIdx], fields: sections[sIdx].fields.filter((_, i) => i !== fIdx) };
      return { ...p, sections };
    });
  };

  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "โครงสร้างฟิลด์ของฟอร์ม" : "Form field schema"}</h3>
        <Button variant="secondary" size="sm" icon="plus" onClick={addSection}>{lang === "th" ? "เพิ่มส่วน" : "Add section"}</Button>
      </div>

      {tpl.sections.map((sec, sIdx) => (
        <div key={sec.id} className="ttm-builder-section">
          <div className="ttm-builder-section-head">
            <div className="ttm-builder-section-num">{sIdx + 1}</div>
            <Input
              className="ttm-builder-section-title"
              value={lang === "th" ? sec.titleTh : sec.titleEn}
              onChange={e => updateSection(sIdx, lang === "th" ? { titleTh: e.target.value } : { titleEn: e.target.value })}
              placeholder={lang === "th" ? "ชื่อส่วน" : "Section title"}
            />
            <IconButton icon="chevron-down" title="Move down" onClick={() => moveSection(sIdx, 1)} />
            <IconButton icon="chevron-right" title="Move up" onClick={() => moveSection(sIdx, -1)} className="ttm-rotate-down" />
            <IconButton icon="trash" title="Delete section" onClick={() => deleteSection(sIdx)} />
          </div>

          <div className="ttm-builder-fields">
            {sec.fields.map((f, fIdx) => (
              <FieldEditor
                key={f.id}
                field={f} lang={lang}
                onChange={patch => updateField(sIdx, fIdx, patch)}
                onMove={dir => moveField(sIdx, fIdx, dir)}
                onDelete={() => deleteField(sIdx, fIdx)}
              />
            ))}
            {sec.fields.length === 0 && (
              <div className="ttm-builder-empty">{lang === "th" ? "ยังไม่มีฟิลด์ในส่วนนี้ — เพิ่มจากเมนูด้านล่าง" : "No fields yet — add one from below"}</div>
            )}
          </div>

          <div className="ttm-builder-addfield">
            <span className="ttm-muted ttm-small">{lang === "th" ? "เพิ่มฟิลด์:" : "Add field:"}</span>
            {FIELD_TYPES.map(ft => (
              <button key={ft.id} className="ttm-field-type-btn" onClick={() => addField(sIdx, ft.id)} type="button">
                <Icon name={ft.icon} size={13} />
                <span>{lang === "th" ? ft.labelTh : ft.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}

function FieldEditor({ field, lang, onChange, onMove, onDelete }) {
  const [open, setOpen] = React.useState(false);
  const ft = FIELD_TYPES.find(t => t.id === field.type);

  const addOption = () => {
    const options = [...(field.options || []), { id: uid("o"), labelTh: `ตัวเลือก ${(field.options || []).length + 1}`, labelEn: `Option ${(field.options || []).length + 1}` }];
    onChange({ options });
  };
  const updateOption = (i, patch) => {
    const options = [...(field.options || [])];
    options[i] = { ...options[i], ...patch };
    onChange({ options });
  };
  const deleteOption = (i) => {
    onChange({ options: (field.options || []).filter((_, j) => j !== i) });
  };

  return (
    <div className={cls("ttm-field-editor", open && "is-open")}>
      <div className="ttm-field-editor-bar">
        <div className="ttm-field-type-chip"><Icon name={ft?.icon || "edit"} size={13} /> {lang === "th" ? ft?.labelTh : ft?.labelEn}</div>
        <Input
          className="ttm-field-editor-label"
          value={lang === "th" ? field.labelTh : field.labelEn}
          onChange={e => onChange(lang === "th" ? { labelTh: e.target.value } : { labelEn: e.target.value })}
          placeholder={lang === "th" ? "ชื่อฟิลด์" : "Field label"}
        />
        {field.required && <Badge kind="red" className="ttm-field-req-badge">*</Badge>}
        <IconButton icon={open ? "chevron-down" : "chevron-right"} title="Settings" onClick={() => setOpen(!open)} />
        <IconButton icon="chevron-down" title="Move down" onClick={() => onMove(1)} />
        <IconButton icon="trash" title="Delete" onClick={onDelete} />
      </div>

      {open && (
        <div className="ttm-field-editor-body">
          <div className="ttm-form-grid">
            <Field label={lang === "th" ? "ชื่อฟิลด์ (อีกภาษา)" : "Label (other language)"} span={2}>
              <Input
                value={lang === "th" ? field.labelEn : field.labelTh}
                onChange={e => onChange(lang === "th" ? { labelEn: e.target.value } : { labelTh: e.target.value })}
                placeholder={lang === "th" ? "English label" : "ป้ายภาษาไทย"}
              />
            </Field>
            <Field label={lang === "th" ? "ขนาดความกว้าง" : "Width"}>
              <Select value={field.span} onChange={e => onChange({ span: Number(e.target.value) })}>
                <option value="1">1/3 ({lang === "th" ? "เล็ก" : "Small"})</option>
                <option value="2">2/3 ({lang === "th" ? "กลาง" : "Medium"})</option>
                <option value="3">3/3 ({lang === "th" ? "เต็ม" : "Full"})</option>
              </Select>
            </Field>
            <Field label={lang === "th" ? "ข้อความช่วยเหลือ" : "Hint"} span={2}>
              <Input value={field.hint || ""} onChange={e => onChange({ hint: e.target.value })} placeholder={lang === "th" ? "เช่น เฉพาะตัวเลข 0-9" : "e.g. numbers only"} />
            </Field>
            <Field label={lang === "th" ? "บังคับกรอก" : "Required"}>
              <Switch checked={field.required} onChange={e => onChange({ required: e.target.checked })} label={field.required ? (lang === "th" ? "ต้องกรอก" : "Required") : (lang === "th" ? "ไม่บังคับ" : "Optional")} />
            </Field>
          </div>

          {["radio", "checkbox", "select"].includes(field.type) && (
            <div className="ttm-builder-options">
              <div className="ttm-builder-options-head">
                <strong>{lang === "th" ? "ตัวเลือก" : "Options"}</strong>
                <Button variant="ghost" size="sm" icon="plus" onClick={addOption}>{lang === "th" ? "เพิ่มตัวเลือก" : "Add option"}</Button>
              </div>
              {(field.options || []).map((opt, oi) => (
                <div key={opt.id} className="ttm-builder-option-row">
                  <div className="ttm-builder-option-num">{oi + 1}</div>
                  <Input
                    placeholder={lang === "th" ? "ภาษาไทย" : "Thai"}
                    value={opt.labelTh} onChange={e => updateOption(oi, { labelTh: e.target.value })}
                  />
                  <Input
                    placeholder={lang === "th" ? "English" : "English"}
                    value={opt.labelEn} onChange={e => updateOption(oi, { labelEn: e.target.value })}
                  />
                  <IconButton icon="trash" onClick={() => deleteOption(oi)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BuilderApprovers({ lang, tpl, setTpl }) {
  const add = () => setTpl(p => ({ ...p, approvers: [...p.approvers, { id: uid("a"), roleTh: "ผู้อนุมัติเพิ่มเติม", roleEn: "Additional approver", sla: "1d", assign: "auto" }] }));
  const update = (i, patch) => setTpl(p => {
    const a = [...p.approvers]; a[i] = { ...a[i], ...patch }; return { ...p, approvers: a };
  });
  const move = (i, dir) => setTpl(p => {
    const a = [...p.approvers]; const j = i + dir; if (j < 0 || j >= a.length) return p;
    [a[i], a[j]] = [a[j], a[i]]; return { ...p, approvers: a };
  });
  const remove = (i) => setTpl(p => ({ ...p, approvers: p.approvers.filter((_, j) => j !== i) }));

  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ลำดับการอนุมัติ" : "Approval chain"}</h3>
        <Button variant="secondary" size="sm" icon="plus" onClick={add}>{lang === "th" ? "เพิ่มขั้น" : "Add step"}</Button>
      </div>

      <ol className="ttm-chain-editor">
        {tpl.approvers.map((a, i) => (
          <li key={a.id} className="ttm-chain-step">
            <div className="ttm-chain-num">{i + 1}</div>
            <div className="ttm-chain-content">
              <Field label={lang === "th" ? "บทบาท (ไทย)" : "Role (Thai)"}>
                <Input value={a.roleTh} onChange={e => update(i, { roleTh: e.target.value })} />
              </Field>
              <Field label={lang === "th" ? "ผู้ใช้ที่กำหนด" : "Assignment"}>
                <Select value={a.assign} onChange={e => update(i, { assign: e.target.value })}>
                  <option value="auto">{lang === "th" ? "Auto จาก org chart" : "Auto-resolve from org chart"}</option>
                  <option value="user">{lang === "th" ? "ผู้ใช้เฉพาะ" : "Specific user"}</option>
                  <option value="group">{lang === "th" ? "กลุ่ม" : "Group"}</option>
                </Select>
              </Field>
              <Field label="SLA">
                <Select value={a.sla} onChange={e => update(i, { sla: e.target.value })}>
                  <option value="4h">4 ชม.</option>
                  <option value="1d">1 วันทำการ</option>
                  <option value="2d">2 วันทำการ</option>
                  <option value="3d">3 วันทำการ</option>
                  <option value="5d">5 วันทำการ</option>
                </Select>
              </Field>
            </div>
            <div className="ttm-chain-actions">
              <IconButton icon="chevron-down" onClick={() => move(i, 1)} title="Move down" />
              <IconButton icon="trash" onClick={() => remove(i)} />
            </div>
          </li>
        ))}
      </ol>

      <div className="ttm-info-banner">
        <Icon name="shield-check" size={16} />
        <span>{lang === "th"
          ? "ผู้แจ้งเรื่อง (Requester) จะถูกใส่อัตโนมัติเป็นขั้น 0 — ระบบจะลงนามเมื่อกดส่ง ไม่ต้องเพิ่มในที่นี้"
          : "The requester is implicitly step 0 — auto-signed on submit, no need to add here."}</span>
      </div>
    </Card>
  );
}

function BuilderNotifications({ lang, tpl, setTpl, sampleDoc }) {
  const setN = (k, v) => setTpl(p => ({ ...p, notifications: { ...p.notifications, [k]: v } }));
  const ch = tpl.notifications;

  return (
    <>
      <Card className="ttm-form-section">
        <div className="ttm-form-section-head">
          <h3>{lang === "th" ? "ช่องทางการแจ้งเตือน" : "Notification channels"}</h3>
          <span className="ttm-section-hint">{lang === "th" ? "เปิด/ปิดได้ตามต้องการ — แก้เพิ่มเติมภายหลังได้ในหน้าตั้งค่า" : "Toggle as needed — can edit later in Settings"}</span>
        </div>
        <div className="ttm-channel-toggles">
          {[
            { id: "lineGroup",  label: lang === "th" ? "LINE กลุ่มแผนกเจ้าของฟอร์ม" : "LINE group: form owner team", icon: "line" },
            { id: "lineApprover", label: lang === "th" ? "LINE ผู้อนุมัติทีละคน พร้อมลิงก์ Approve" : "LINE: each approver, with approval link", icon: "line" },
            { id: "emailApprover", label: lang === "th" ? "Email ผู้อนุมัติพร้อมไฟล์ PDF" : "Email approver with PDF", icon: "mail" },
            { id: "emailTeam", label: lang === "th" ? "Email ทีมปลายทางเมื่ออนุมัติครบ" : "Email assignee team on full approval", icon: "mail" },
            { id: "inApp", label: lang === "th" ? "Notification ภายในแอป" : "In-app notification", icon: "bell" },
            { id: "requesterLine", label: lang === "th" ? "แจ้งผู้แจ้งทาง LINE ทุกขั้น" : "Notify requester via LINE at each step", icon: "line" },
          ].map(it => (
            <div key={it.id} className="ttm-channel-toggle">
              <div className="ttm-channel-toggle-l">
                <Icon name={it.icon} size={15} />
                <span>{it.label}</span>
              </div>
              <Switch checked={!!ch[it.id]} onChange={e => setN(it.id, e.target.checked)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="ttm-form-section">
        <div className="ttm-form-section-head">
          <h3>{lang === "th" ? "ตรวจสอบและเผยแพร่" : "Review & publish"}</h3>
        </div>
        <div className="ttm-builder-summary">
          <SumRow icon="file-text" label={lang === "th" ? "รหัสฟอร์ม" : "Form code"} value={`${tpl.code} (${shortFormCode(tpl.code)})`} mono />
          <SumRow icon="archive" label={lang === "th" ? "ชื่อฟอร์ม" : "Title"} value={lang === "th" ? tpl.titleTh : tpl.titleEn} />
          <SumRow icon="list" label={lang === "th" ? "จำนวนส่วน / ฟิลด์" : "Sections / Fields"} value={`${tpl.sections.length} ${lang === "th" ? "ส่วน" : "sections"} · ${tpl.sections.reduce((n, s) => n + s.fields.length, 0)} ${lang === "th" ? "ฟิลด์" : "fields"}`} />
          <SumRow icon="check-circle" label={lang === "th" ? "ขั้นอนุมัติ" : "Approval steps"} value={`${tpl.approvers.length} ${lang === "th" ? "ขั้น" : "steps"}`} />
          <SumRow icon="bell" label={lang === "th" ? "ช่องทางแจ้งเตือนที่เปิด" : "Notification channels enabled"} value={`${Object.values(tpl.notifications).filter(Boolean).length} / 6`} />
          <SumRow icon="fingerprint" label={lang === "th" ? "เลขเอกสารชุดแรก" : "First doc number"} value={sampleDoc} mono />
        </div>
        <div className="ttm-info-banner">
          <Icon name="shield-check" size={16} />
          <span>{lang === "th"
            ? "เมื่อเผยแพร่ ฟอร์มจะถูกขึ้นทะเบียนภายใต้ ISO 9001 — บันทึก revision พร้อม timestamp และผู้สร้างโดยอัตโนมัติ"
            : "On publish, the form is registered under ISO 9001 — revision logged with timestamp and creator."}</span>
        </div>
      </Card>
    </>
  );
}

export function SumRow({ icon, label, value, mono }) {
  return (
    <div className="ttm-sum-row">
      <div className="ttm-sum-icon"><Icon name={icon} size={15} /></div>
      <div className="ttm-sum-label">{label}</div>
      <div className={cls("ttm-sum-value", mono && "ttm-mono")}>{value}</div>
    </div>
  );
}

function BuilderLivePreview({ tpl, lang, sampleDoc }) {
  return (
    <div className="ttm-preview-paper">
      <div className="ttm-preview-paper-top">
        <div className={cls("ttm-preview-icon", `is-${tpl.color}`)}><Icon name={tpl.icon} size={18} /></div>
        <div>
          <div className="ttm-mono ttm-small ttm-muted">{tpl.code} · Rev {tpl.revision}</div>
          <strong>{lang === "th" ? tpl.titleTh : tpl.titleEn}</strong>
        </div>
      </div>
      <div className="ttm-preview-docno">{sampleDoc}</div>

      {tpl.sections.map((sec) => (
        <div key={sec.id} className="ttm-preview-section">
          <div className="ttm-preview-section-title">{lang === "th" ? sec.titleTh : sec.titleEn}</div>
          <div className="ttm-preview-fields">
            {sec.fields.map(f => <PreviewField key={f.id} field={f} lang={lang} />)}
            {sec.fields.length === 0 && <div className="ttm-preview-empty">— {lang === "th" ? "ยังไม่มีฟิลด์" : "no fields yet"} —</div>}
          </div>
        </div>
      ))}

      <div className="ttm-preview-section">
        <div className="ttm-preview-section-title">{lang === "th" ? "ลำดับการอนุมัติ" : "Approval chain"}</div>
        <div className="ttm-preview-approvers">
          {tpl.approvers.map((a, i) => (
            <div key={a.id} className="ttm-preview-approver">
              <div className="ttm-preview-approver-num">{i + 1}</div>
              <div>
                <strong>{lang === "th" ? a.roleTh : a.roleEn}</strong>
                <div className="ttm-muted ttm-small">SLA {a.sla}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewField({ field, lang }) {
  const label = lang === "th" ? field.labelTh : field.labelEn;
  return (
    <div className={cls("ttm-preview-field", `ttm-span-${field.span || 1}`)}>
      <div className="ttm-preview-field-label">
        {label}
        {field.required && <em className="ttm-req">*</em>}
      </div>
      {field.type === "textarea" ? (
        <div className="ttm-preview-textarea" />
      ) : ["radio", "checkbox", "select"].includes(field.type) ? (
        <div className="ttm-preview-options">
          {(field.options || []).slice(0, 4).map(o => (
            <span key={o.id} className="ttm-preview-option">
              {field.type === "radio" && <span className="ttm-preview-radio" />}
              {field.type === "checkbox" && <span className="ttm-preview-check" />}
              <span>{lang === "th" ? o.labelTh : o.labelEn}</span>
            </span>
          ))}
          {field.type === "select" && <Icon name="chevron-down" size={11} className="ttm-muted" />}
        </div>
      ) : (
        <div className="ttm-preview-input">{field.type === "date" ? "📅 yyyy-mm-dd" : field.type === "time" ? "🕒 hh:mm" : "—"}</div>
      )}
    </div>
  );
}
