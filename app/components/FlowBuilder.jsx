"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Button, Card, Check, Field, IconButton, Input, Select, Stepper, Textarea } from "./Ui";
import { FORM_TEMPLATES } from "../lib/data";
import { SumRow } from "./TemplateBuilder";

const FLOW_COLOR_CHOICES = ["blue", "violet", "amber", "rose", "teal", "emerald"];
const FLOW_ICON_CHOICES = ["trending-up", "user-plus", "users", "wallet", "tool", "monitor", "phone", "wrench", "archive", "shield-check"];
const FLOW_OWNER_CHOICES = [
  { id: "Sales", th: "ฝ่ายขาย", en: "Sales" },
  { id: "HR", th: "ฝ่ายบุคคล", en: "HR" },
  { id: "IT", th: "ฝ่ายไอที", en: "IT" },
  { id: "Finance", th: "ฝ่ายการเงิน", en: "Finance" },
  { id: "Operations", th: "ฝ่ายปฏิบัติการ", en: "Operations" },
  { id: "Admin", th: "ธุรการ / QMR", en: "Admin / QMR" },
];

function fbUid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function FlowBuilder({ lang, back, onSave }) {
  const [step, setStep] = React.useState(0);
  const [flow, setFlow] = React.useState({
    id: "FT-NEW-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    titleTh: lang === "th" ? "Flow ใหม่" : "New Flow",
    titleEn: "New Flow Template",
    descTh: "",
    descEn: "",
    icon: "trending-up",
    color: "blue",
    owner: "Operations",
    avgDays: 7,
    steps: [
      { id: fbUid("s"), form: FORM_TEMPLATES[0].code, deptTh: "ฝ่ายปฏิบัติการ", deptEn: "Operations", optional: false, multiplePerHeadcount: false, parallelWith: null, dependsOn: null, labelTh: "", labelEn: "" },
    ],
  });

  const setF = (k, v) => setFlow(p => ({ ...p, [k]: v }));

  const addStep = () => {
    setFlow(p => ({
      ...p, steps: [...p.steps, {
        id: fbUid("s"), form: FORM_TEMPLATES[0].code,
        deptTh: "ฝ่ายปฏิบัติการ", deptEn: "Operations",
        optional: false, multiplePerHeadcount: false, parallelWith: null,
        dependsOn: p.steps.length > 0 ? p.steps[p.steps.length - 1].id : null,
        labelTh: "", labelEn: "",
      }]
    }));
  };
  const updateStep = (idx, patch) => setFlow(p => {
    const steps = [...p.steps]; steps[idx] = { ...steps[idx], ...patch }; return { ...p, steps };
  });
  const moveStep = (idx, dir) => setFlow(p => {
    const steps = [...p.steps]; const j = idx + dir; if (j < 0 || j >= steps.length) return p;
    [steps[idx], steps[j]] = [steps[j], steps[idx]]; return { ...p, steps };
  });
  const deleteStep = (idx) => setFlow(p => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }));

  const steps = lang === "th"
    ? ["ข้อมูลพื้นฐาน", "กำหนดขั้นตอน", "ตรวจสอบ & เผยแพร่"]
    : ["Basic info", "Define steps", "Review & publish"];

  return (
    <div className="ttm-page ttm-builder">
      <div className="ttm-crumbs">
        <button className="ttm-crumb" onClick={back}><Icon name="arrow-left" size={14} /> {lang === "th" ? "กลับ" : "Back"}</button>
      </div>

      <Card className="ttm-builder-head">
        <div className="ttm-builder-head-meta">
          <div className={cls("ttm-form-head-icon", `is-${flow.color}`)}><Icon name={flow.icon} size={24} /></div>
          <div>
            <div className="ttm-form-head-code">{lang === "th" ? "สร้าง Flow Template ใหม่" : "Create new Flow Template"}</div>
            <h2>{lang === "th" ? flow.titleTh : flow.titleEn}</h2>
          </div>
        </div>
        <div className="ttm-form-head-doc">
          <div className="ttm-form-head-label">
            <Icon name="trending-up" size={13} />
            <span>{lang === "th" ? "จำนวนขั้น / ระยะเวลา" : "Steps / duration"}</span>
          </div>
          <div className="ttm-form-head-docno ttm-mono">{flow.steps.length} {lang === "th" ? "ขั้น" : "steps"} · ~{flow.avgDays}{lang === "th" ? " วัน" : "d"}</div>
        </div>
      </Card>

      <Stepper steps={steps} current={step} />

      <div className="ttm-builder-grid">
        <div className="ttm-builder-main">
          {step === 0 && <FBInfo lang={lang} flow={flow} setF={setF} />}
          {step === 1 && <FBSteps lang={lang} flow={flow} updateStep={updateStep} moveStep={moveStep} deleteStep={deleteStep} addStep={addStep} />}
          {step === 2 && <FBReview lang={lang} flow={flow} />}
        </div>
        <div className="ttm-builder-side">
          <Card className="ttm-builder-preview">
            <div className="ttm-builder-preview-head">
              <Icon name="trending-up" size={14} />
              <strong>{lang === "th" ? "ตัวอย่าง Flow" : "Live preview"}</strong>
            </div>
            <FBLivePreview flow={flow} lang={lang} />
          </Card>
        </div>
      </div>

      <div className="ttm-form-actions">
        <Button variant="ghost" icon="trash" onClick={back}>{lang === "th" ? "ยกเลิก" : "Cancel"}</Button>
        <div className="ttm-spacer" />
        <Button variant="ghost" icon="file-text">{lang === "th" ? "บันทึกฉบับร่าง" : "Save draft"}</Button>
        {step > 0 && <Button variant="secondary" icon="arrow-left" onClick={() => setStep(step - 1)}>{lang === "th" ? "ย้อนกลับ" : "Back"}</Button>}
        {step < 2 && <Button variant="primary" onClick={() => setStep(step + 1)}>{lang === "th" ? "ถัดไป" : "Next"} <Icon name="arrow-right" size={15} /></Button>}
        {step === 2 && <Button variant="primary" icon="shield-check" onClick={() => onSave(flow)}>{lang === "th" ? "เผยแพร่ Flow" : "Publish Flow"}</Button>}
      </div>
    </div>
  );
}

function FBInfo({ lang, flow, setF }) {
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ข้อมูลพื้นฐานของ Flow" : "Basic info"}</h3>
        <span className="ttm-section-hint">{lang === "th" ? "ผู้ใช้จะเห็นข้อมูลนี้ตอนเลือก Flow" : "Shown when users pick this Flow to start"}</span>
      </div>
      <div className="ttm-form-grid">
        <Field label={lang === "th" ? "ชื่อ Flow (ไทย)" : "Title (Thai)"} required span={2}>
          <Input value={flow.titleTh} onChange={e => setF("titleTh", e.target.value)} />
        </Field>
        <Field label={lang === "th" ? "ชื่อ Flow (อังกฤษ)" : "Title (English)"} span={1}>
          <Input value={flow.titleEn} onChange={e => setF("titleEn", e.target.value)} />
        </Field>

        <Field label={lang === "th" ? "คำอธิบาย (ไทย)" : "Description (Thai)"} span={3}>
          <Textarea rows={2} value={flow.descTh} onChange={e => setF("descTh", e.target.value)} placeholder={lang === "th" ? "อธิบายให้ผู้ใช้รู้ว่า flow นี้ใช้เมื่อไหร่" : "Tell users when to use this flow"} />
        </Field>

        <Field label={lang === "th" ? "แผนกเจ้าของ" : "Owner department"} required>
          <Select value={flow.owner} onChange={e => setF("owner", e.target.value)}>
            {FLOW_OWNER_CHOICES.map(o => <option key={o.id} value={o.id}>{lang === "th" ? o.th : o.en}</option>)}
          </Select>
        </Field>

        <Field label={lang === "th" ? "ระยะเวลาประมาณ (วัน)" : "Estimated duration (days)"}>
          <Input type="number" value={flow.avgDays} onChange={e => setF("avgDays", Number(e.target.value))} />
        </Field>

        <Field label={lang === "th" ? "รหัส Flow" : "Flow ID"}>
          <Input value={flow.id} onChange={e => setF("id", e.target.value.toUpperCase())} className="ttm-mono" />
        </Field>
      </div>

      <div className="ttm-form-subsection">
        <h4>{lang === "th" ? "ไอคอน" : "Icon"}</h4>
        <div className="ttm-icon-picker">
          {FLOW_ICON_CHOICES.map(ic => (
            <button key={ic} className={cls("ttm-icon-swatch", `is-${flow.color}`, flow.icon === ic && "is-active")} onClick={() => setF("icon", ic)} type="button">
              <Icon name={ic} size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className="ttm-form-subsection">
        <h4>{lang === "th" ? "สีประจำ Flow" : "Color"}</h4>
        <div className="ttm-color-picker">
          {FLOW_COLOR_CHOICES.map(c => (
            <button key={c} className={cls("ttm-color-swatch", `is-${c}`, flow.color === c && "is-active")} onClick={() => setF("color", c)} type="button" title={c}>
              {flow.color === c && <Icon name="check" size={13} stroke={2.5} />}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function FBSteps({ lang, flow, updateStep, moveStep, deleteStep, addStep }) {
  return (
    <Card className="ttm-form-section">
      <div className="ttm-form-section-head">
        <h3>{lang === "th" ? "ขั้นตอนใน Flow" : "Flow steps"}</h3>
        <Button variant="secondary" size="sm" icon="plus" onClick={addStep}>{lang === "th" ? "เพิ่มขั้น" : "Add step"}</Button>
      </div>

      <ol className="ttm-fb-steps">
        {flow.steps.map((s, idx) => (
          <FBStepRow
            key={s.id}
            step={s} idx={idx} flow={flow} lang={lang}
            onChange={patch => updateStep(idx, patch)}
            onMove={dir => moveStep(idx, dir)}
            onDelete={() => deleteStep(idx)}
          />
        ))}
        {flow.steps.length === 0 && (
          <div className="ttm-builder-empty">{lang === "th" ? "ยังไม่มีขั้น — กดเพิ่มขั้นเพื่อเริ่ม" : "No steps yet — click Add to start"}</div>
        )}
      </ol>

      <div className="ttm-info-banner" style={{ marginTop: 14 }}>
        <Icon name="bell" size={16} />
        <span>{lang === "th"
          ? "ขั้นที่มี \"ขนานกับขั้นก่อน\" จะถูก trigger พร้อมกัน — ใช้สำหรับงานที่ทำคู่ขนานได้ เช่น HR กรอกพร้อม IT จัดอุปกรณ์"
          : "Steps marked 'Parallel with previous' fire together — useful when two departments can work in parallel."}</span>
      </div>
    </Card>
  );
}

function FBStepRow({ step, idx, flow, lang, onChange, onMove, onDelete }) {
  const formChoices = FORM_TEMPLATES;
  const selectedForm = formChoices.find(f => f.code === step.form);
  const dependsOptions = flow.steps.filter((_, i) => i < idx);

  return (
    <li className="ttm-fb-step">
      <div className="ttm-fb-step-head">
        <div className="ttm-chain-num">{idx + 1}</div>
        <div className={cls("ttm-fb-step-icon", `is-${selectedForm?.color || "neutral"}`)}>
          <Icon name={selectedForm?.icon || "file-text"} size={14} />
        </div>
        <div className="ttm-fb-step-title">{lang === "th" ? selectedForm?.titleTh : selectedForm?.titleEn} <span className="ttm-mono ttm-muted">{step.form}</span></div>
        <IconButton icon="chevron-down" onClick={() => onMove(1)} title="Move down" />
        <IconButton icon="trash" onClick={onDelete} />
      </div>

      <div className="ttm-fb-step-body">
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "เลือกฟอร์ม" : "Form template"} required span={2}>
            <Select value={step.form} onChange={e => onChange({ form: e.target.value })}>
              {formChoices.map(f => <option key={f.code} value={f.code}>{f.code} — {lang === "th" ? f.titleTh : f.titleEn}</option>)}
            </Select>
          </Field>

          <Field label={lang === "th" ? "แผนกรับผิดชอบ" : "Responsible dept"} required>
            <Select value={step.deptEn} onChange={e => {
              const o = FLOW_OWNER_CHOICES.find(x => x.en === e.target.value);
              onChange({ deptEn: e.target.value, deptTh: o?.th || e.target.value });
            }}>
              {FLOW_OWNER_CHOICES.map(o => <option key={o.id} value={o.en}>{lang === "th" ? o.th : o.en}</option>)}
            </Select>
          </Field>

          <Field label={lang === "th" ? "ป้ายชื่อขั้น (ทับชื่อฟอร์ม)" : "Step label (overrides form title)"} span={2} hint={lang === "th" ? "ไม่บังคับ" : "Optional"}>
            <Input value={lang === "th" ? (step.labelTh || "") : (step.labelEn || "")}
              onChange={e => onChange(lang === "th" ? { labelTh: e.target.value } : { labelEn: e.target.value })}
              placeholder={lang === "th" ? "เช่น แจ้งปิดโครงการ" : "e.g. Closure notice"} />
          </Field>

          {idx > 0 && (
            <Field label={lang === "th" ? "เริ่มเมื่อขั้นนี้เสร็จ" : "Starts after"}>
              <Select value={step.dependsOn || ""} onChange={e => onChange({ dependsOn: e.target.value || null })}>
                <option value="">{lang === "th" ? "เริ่มทันที (parallel แรก)" : "Start immediately"}</option>
                {dependsOptions.map((d, i) => (
                  <option key={d.id} value={d.id}>{lang === "th" ? "ขั้นที่ " : "Step "}{i + 1} — {d.form}</option>
                ))}
              </Select>
            </Field>
          )}

          <Field label={lang === "th" ? "ตัวเลือกพิเศษ" : "Special flags"} span={3}>
            <div className="ttm-fb-flags">
              <Check checked={!!step.optional} onChange={e => onChange({ optional: e.target.checked })} label={lang === "th" ? "ไม่บังคับ (Optional)" : "Optional"} />
              <Check checked={!!step.parallelWith} onChange={e => onChange({ parallelWith: e.target.checked ? (flow.steps[idx - 1]?.id || null) : null })} label={lang === "th" ? "ขนานกับขั้นก่อน (Parallel)" : "Parallel with previous"} />
              <Check checked={!!step.multiplePerHeadcount} onChange={e => onChange({ multiplePerHeadcount: e.target.checked })} label={lang === "th" ? "×N ต่อกำลังพล (ใบหนึ่งต่อพนักงานหนึ่งคน)" : "×N per headcount (one per hire)"} />
            </div>
          </Field>
        </div>
      </div>
    </li>
  );
}

function FBReview({ lang, flow }) {
  return (
    <>
      <Card className="ttm-form-section">
        <div className="ttm-form-section-head">
          <h3>{lang === "th" ? "ตรวจสอบและเผยแพร่" : "Review & publish"}</h3>
        </div>
        <div className="ttm-builder-summary">
          <SumRow icon="file-text" label={lang === "th" ? "รหัส Flow" : "Flow ID"} value={flow.id} mono />
          <SumRow icon="trending-up" label={lang === "th" ? "ชื่อ" : "Title"} value={lang === "th" ? flow.titleTh : flow.titleEn} />
          <SumRow icon="users" label={lang === "th" ? "แผนกเจ้าของ" : "Owner"} value={flow.owner} />
          <SumRow icon="list" label={lang === "th" ? "จำนวนขั้น" : "Steps"} value={`${flow.steps.length}`} />
          <SumRow icon="clock" label={lang === "th" ? "ระยะเวลาประมาณ" : "Estimated duration"} value={`~${flow.avgDays} ${lang === "th" ? "วัน" : "days"}`} />
          <SumRow icon="archive" label={lang === "th" ? "แผนกที่เกี่ยวข้อง" : "Departments involved"} value={[...new Set(flow.steps.map(s => lang === "th" ? s.deptTh : s.deptEn))].join(" → ")} />
        </div>

        <div className="ttm-info-banner">
          <Icon name="shield-check" size={16} />
          <span>{lang === "th"
            ? "เมื่อเผยแพร่ Flow Template จะปรากฏในรายการให้ทุกแผนกเรียกใช้ได้ — ทุกการเปลี่ยนแปลงจะถูกบันทึก revision พร้อม timestamp"
            : "On publish, this Flow Template becomes available to all departments — every revision is timestamped for ISO audit."}</span>
        </div>
      </Card>

      <Card className="ttm-form-section">
        <div className="ttm-form-section-head">
          <h3>{lang === "th" ? "รายการขั้นโดยละเอียด" : "Detailed step list"}</h3>
        </div>
        <ol className="ttm-fb-summary-steps">
          {flow.steps.map((s, i) => {
            const f = FORM_TEMPLATES.find(t => t.code === s.form);
            return (
              <li key={s.id} className="ttm-fb-summary-step">
                <div className="ttm-chain-num">{i + 1}</div>
                <div className={cls("ttm-fb-step-icon", `is-${f?.color || "neutral"}`)}>
                  <Icon name={f?.icon || "file-text"} size={14} />
                </div>
                <div className="ttm-fb-summary-meta">
                  <strong>{s.labelTh && lang === "th" ? s.labelTh : s.labelEn && lang === "en" ? s.labelEn : (lang === "th" ? f?.titleTh : f?.titleEn)}</strong>
                  <div className="ttm-muted ttm-small">
                    <span className="ttm-mono">{s.form}</span> · {lang === "th" ? s.deptTh : s.deptEn}
                    {s.optional && <> · {lang === "th" ? "ไม่บังคับ" : "optional"}</>}
                    {s.parallelWith && <> · {lang === "th" ? "ขนาน" : "parallel"}</>}
                    {s.multiplePerHeadcount && <> · ×N {lang === "th" ? "ต่อกำลังพล" : "per headcount"}</>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </>
  );
}

function FBLivePreview({ flow, lang }) {
  return (
    <div className="ttm-preview-paper">
      <div className="ttm-preview-paper-top">
        <div className={cls("ttm-preview-icon", `is-${flow.color}`)}><Icon name={flow.icon} size={18} /></div>
        <div>
          <div className="ttm-mono ttm-small ttm-muted">{flow.id}</div>
          <strong>{lang === "th" ? flow.titleTh : flow.titleEn}</strong>
        </div>
      </div>
      <div className="ttm-fb-preview-meta">
        <span><Icon name="list" size={11} /> {flow.steps.length} {lang === "th" ? "ขั้น" : "steps"}</span>
        <span><Icon name="clock" size={11} /> ~{flow.avgDays}{lang === "th" ? " วัน" : "d"}</span>
        <span><Icon name="users" size={11} /> {flow.owner}</span>
      </div>
      {flow.descTh && lang === "th" && <p className="ttm-fb-preview-desc">{flow.descTh}</p>}
      {flow.descEn && lang === "en" && <p className="ttm-fb-preview-desc">{flow.descEn}</p>}

      <div className="ttm-fb-preview-flow">
        {flow.steps.map((s, i) => {
          const f = FORM_TEMPLATES.find(t => t.code === s.form);
          return (
            <React.Fragment key={s.id}>
              <div className="ttm-fb-preview-node">
                <div className="ttm-fb-preview-step-num">{i + 1}</div>
                <div className={cls("ttm-fb-step-icon", `is-${f?.color || "neutral"}`)}>
                  <Icon name={f?.icon || "file-text"} size={12} />
                </div>
                <div className="ttm-fb-preview-node-meta">
                  <div className="ttm-fb-preview-node-dept">{lang === "th" ? s.deptTh : s.deptEn}</div>
                  <div className="ttm-fb-preview-node-form ttm-mono">{s.form}</div>
                </div>
                {s.optional && <span className="ttm-fb-preview-flag">opt</span>}
                {s.multiplePerHeadcount && <span className="ttm-fb-preview-flag">×N</span>}
                {s.parallelWith && <span className="ttm-fb-preview-flag">∥</span>}
              </div>
              {i < flow.steps.length - 1 && <div className="ttm-fb-preview-arrow"><Icon name="chevron-down" size={12} /></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
