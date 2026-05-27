"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Avatar, Badge, Button, Card, Input, SectionTitle, StatusPill, Tabs } from "./Ui";
import { useAppData } from "../lib/AppDataContext";

const FLOW_STATUS_KIND = {
  pending: "neutral",
  inProgress: "violet",
  approved: "green",
  done: "green",
  rejected: "red",
  active: "blue",
};

export function FlowsPage({ lang, t, openFlow, startFlow, openFlowBuilder }) {
  const [tab, setTab] = React.useState("active");
  const { FLOW_INSTANCES: instances, FLOW_TEMPLATES: templates } = useAppData();

  const filtered = instances.filter(f =>
    tab === "active" ? f.status === "active"
    : tab === "done" ? f.status === "done"
    : true
  );

  return (
    <div className="ttm-page ttm-flows-page">
      <div className="ttm-list-head">
        <div>
          <h2>{t.nav.flows}</h2>
          <p>{lang === "th" ? "ขั้นตอนการทำงานข้ามแผนกที่ขึ้นทะเบียนไว้ — ติดตามได้ว่าตอนนี้อยู่ที่แผนกไหน เอกสารใดเสร็จแล้ว" : "Cross-department workflows registered up-front — see which dept owns each step and what's pending"}</p>
        </div>
        <div className="ttm-list-controls">
          {openFlowBuilder && <Button variant="secondary" icon="plus" onClick={openFlowBuilder}>{lang === "th" ? "สร้าง Flow Template" : "Create Flow Template"}</Button>}
          <Button variant="primary" icon="plus" onClick={startFlow}>{lang === "th" ? "เริ่ม Flow ใหม่" : "Start new Flow"}</Button>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { id: "active", label: lang === "th" ? "กำลังทำงาน" : "Active", count: instances.filter(f => f.status === "active").length, icon: "play" },
        { id: "done", label: lang === "th" ? "เสร็จสิ้น" : "Completed", count: instances.filter(f => f.status === "done").length, icon: "check-circle" },
        { id: "all", label: t.common.all, count: instances.length, icon: "list" },
      ]} />

      <div className="ttm-flow-cards">
        {filtered.map(f => (
          <FlowInstanceCard key={f.id} flow={f} lang={lang} onClick={() => openFlow(f.id)} />
        ))}
        {filtered.length === 0 && (
          <Card className="ttm-empty">{t.common.noResults}</Card>
        )}
      </div>

      <Card>
        <SectionTitle title={lang === "th" ? "Flow Templates ทั้งหมด" : "All Flow Templates"} sub={lang === "th" ? "ขึ้นทะเบียนโดย Admin/QMR ใช้ได้ทุกแผนก" : "Registered by Admin/QMR, available to all departments"} />
        <div className="ttm-flow-template-grid">
          {templates.map(tpl => (
            <button key={tpl.id} className={cls("ttm-flow-template-card", `is-${tpl.color}`)} onClick={startFlow}>
              <div className="ttm-flow-template-icon"><Icon name={tpl.icon} size={20} /></div>
              <div className="ttm-flow-template-meta">
                <div className="ttm-flow-template-title">{lang === "th" ? tpl.titleTh : tpl.titleEn}</div>
                <div className="ttm-flow-template-desc">{lang === "th" ? tpl.descTh : tpl.descEn}</div>
                <div className="ttm-flow-template-stats">
                  <span><Icon name="list" size={11} /> {tpl.steps.length} {lang === "th" ? "ขั้น" : "steps"}</span>
                  <span><Icon name="clock" size={11} /> ~{tpl.avgDays} {lang === "th" ? "วัน" : "days"}</span>
                  <span><Icon name="users" size={11} /> {[...new Set(tpl.steps.map(s => lang === "th" ? s.deptTh : s.deptEn))].join(" → ")}</span>
                </div>
              </div>
              <Icon name="arrow-right" size={14} className="ttm-muted" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FlowInstanceCard({ flow, lang, onClick }) {
  const { FLOW_TEMPLATES, USERS } = useAppData();
  const tpl = FLOW_TEMPLATES.find(t => t.id === flow.template) || { steps: [], icon: "trending-up", color: "blue" };
  const requester = USERS[flow.requester] || { nameTh: flow.requester, nameEn: flow.requester };
  const stepStates = flow.stepStates || [];
  const completed = stepStates.filter(s => ["approved", "done"].includes(s.status)).length;
  const total = Math.max(stepStates.length, 1);
  const pct = (completed / total) * 100;
  const currentStepDef = (tpl.steps || [])[flow.currentStepIdx];

  return (
    <button className={cls("ttm-flow-card", `is-${tpl.color}`, `is-${flow.status}`)} onClick={onClick}>
      <div className="ttm-flow-card-head">
        <div className={cls("ttm-flow-card-icon", `is-${tpl.color}`)}>
          <Icon name={tpl.icon} size={20} />
        </div>
        <div className="ttm-flow-card-meta">
          <div className="ttm-mono ttm-small ttm-muted">{flow.id} · {lang === "th" ? tpl.titleTh : tpl.titleEn}</div>
          <h3 className="ttm-flow-card-title">{lang === "th" ? flow.titleTh : flow.titleEn}</h3>
        </div>
        <Badge kind={FLOW_STATUS_KIND[flow.status] || "neutral"} dot>
          {flow.status === "done"
            ? (lang === "th" ? "เสร็จสิ้น" : "Completed")
            : (lang === "th" ? "กำลังทำงาน" : "Active")}
        </Badge>
      </div>

      <div className="ttm-flow-card-progress">
        <div className="ttm-flow-card-progress-bar">
          <div className="ttm-flow-card-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="ttm-flow-card-progress-text">{completed} / {total} {lang === "th" ? "ขั้นเสร็จ" : "steps done"}</span>
      </div>

      <FlowStepsMini tpl={tpl} states={flow.stepStates} lang={lang} />

      {flow.status === "active" && currentStepDef && (
        <div className="ttm-flow-card-now">
          <Icon name="circle-dot" size={14} />
          <div>
            <span className="ttm-muted ttm-small">{lang === "th" ? "ขั้นปัจจุบัน" : "Currently at"}</span>
            <strong>{lang === "th" ? currentStepDef.deptTh : currentStepDef.deptEn}</strong>
            <span className="ttm-muted ttm-small"> · {currentStepDef.form}</span>
          </div>
        </div>
      )}

      <div className="ttm-flow-card-foot">
        <Avatar user={requester} size={20} />
        <span>{lang === "th" ? requester.nameTh : requester.nameEn}</span>
        <span className="ttm-muted">·</span>
        <span className="ttm-muted">{flow.createdAt}</span>
      </div>
    </button>
  );
}

export function FlowStepsMini({ tpl, states, lang }) {
  const steps = tpl?.steps || [];
  return (
    <div className="ttm-flow-steps-mini">
      {steps.map((s, i) => {
        const st = (states || [])[i];
        const done = st && ["approved", "done"].includes(st.status);
        const prog = st && st.status === "inProgress";
        const pend = !st || st.status === "pending";
        return (
          <React.Fragment key={s.id}>
            <div className={cls("ttm-flow-step-mini", done && "is-done", prog && "is-progress", pend && "is-pending")}>
              <div className="ttm-flow-step-mini-mark">
                {done ? <Icon name="check" size={11} stroke={2.5} /> : prog ? <span className="ttm-flow-step-mini-pulse" /> : i + 1}
              </div>
              <div className="ttm-flow-step-mini-label">
                <span className="ttm-flow-step-mini-dept">{lang === "th" ? s.deptTh : s.deptEn}</span>
              </div>
            </div>
            {i < steps.length - 1 && <div className={cls("ttm-flow-step-mini-arrow", done && "is-done")} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function FlowDetail({ lang, flowId, back, openRequest, openForm }) {
  const { FLOW_INSTANCES, FLOW_TEMPLATES, FORM_TEMPLATES, REQUESTS, USERS } = useAppData();
  const flow = FLOW_INSTANCES.find(f => f.id === flowId) || FLOW_INSTANCES[0];
  if (!flow) return <div className="ttm-page"><div className="ttm-empty">{lang === "th" ? "ไม่พบ Flow" : "Flow not found"}</div></div>;
  const tpl = FLOW_TEMPLATES.find(t => t.id === flow.template) || { steps: [], icon: "trending-up", color: "blue", titleTh: flow.template, titleEn: flow.template, id: flow.template };
  const requester = USERS[flow.requester] || { nameTh: flow.requester, nameEn: flow.requester, avatar: "" };

  const stepStates = flow.stepStates || [];
  const completed = stepStates.filter(s => ["approved", "done"].includes(s.status)).length;
  const total = Math.max(stepStates.length, 1);
  const pct = (completed / total) * 100;

  return (
    <div className="ttm-page ttm-flow-detail">
      <div className="ttm-crumbs">
        <button className="ttm-crumb" onClick={back}><Icon name="arrow-left" size={14} /> {lang === "th" ? "กลับไปรายการ Flow" : "Back to Flows"}</button>
      </div>

      <div className="ttm-detail-head">
        <div className="ttm-detail-head-l">
          <div className={cls("ttm-detail-head-icon", `is-${tpl.color}`)}>
            <Icon name={tpl.icon} size={24} />
          </div>
          <div>
            <div className="ttm-detail-head-code">{flow.id} · {tpl.id}</div>
            <h2>{lang === "th" ? flow.titleTh : flow.titleEn}</h2>
            <div className="ttm-detail-sub">
              <Avatar user={requester} size={20} />
              <span>{lang === "th" ? requester.nameTh : requester.nameEn}</span>
              <span className="ttm-muted">·</span>
              <span className="ttm-muted">{flow.createdAt}</span>
              <span className="ttm-muted">·</span>
              <span>{lang === "th" ? tpl.titleTh : tpl.titleEn}</span>
            </div>
          </div>
        </div>
        <div className="ttm-detail-head-r">
          <Badge kind={FLOW_STATUS_KIND[flow.status] || "neutral"} dot>
            {flow.status === "done"
              ? (lang === "th" ? "เสร็จสิ้น" : "Completed")
              : (lang === "th" ? "กำลังทำงาน" : "Active")}
          </Badge>
        </div>
      </div>

      <Card className="ttm-flow-overview">
        <div className="ttm-flow-overview-stats">
          <div>
            <div className="ttm-muted ttm-small">{lang === "th" ? "ขั้นทั้งหมด" : "Total steps"}</div>
            <strong>{total}</strong>
          </div>
          <div>
            <div className="ttm-muted ttm-small">{lang === "th" ? "เสร็จแล้ว" : "Completed"}</div>
            <strong>{completed}</strong>
          </div>
          <div>
            <div className="ttm-muted ttm-small">{lang === "th" ? "ความคืบหน้า" : "Progress"}</div>
            <strong>{Math.round(pct)}%</strong>
          </div>
          <div>
            <div className="ttm-muted ttm-small">{lang === "th" ? "ปัจจุบันที่" : "Currently at"}</div>
            <strong>{(tpl.steps || [])[flow.currentStepIdx] ? (lang === "th" ? tpl.steps[flow.currentStepIdx].deptTh : tpl.steps[flow.currentStepIdx].deptEn) : "—"}</strong>
          </div>
        </div>
        <div className="ttm-flow-overview-progress">
          <div className="ttm-flow-overview-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title={lang === "th" ? "ขั้นตอนของ Flow" : "Flow Steps"}
          sub={lang === "th" ? "เอกสารที่ผูกกับแต่ละขั้น — คลิกเพื่อเปิดดูฟอร์มจริง" : "Forms attached to each step — click to open"}
        />
        <ol className="ttm-flow-steps">
          {(tpl.steps || []).map((s, i) => {
            const st = stepStates[i];
            const fdef = FORM_TEMPLATES.find(t => t.code === s.form) || { icon: "file-text", color: "blue", code: s.form, titleTh: s.form, titleEn: s.form };
            const done = st && ["approved", "done"].includes(st.status);
            const prog = st && st.status === "inProgress";
            const pend = !st || st.status === "pending";
            const reqIds = (st && st.reqIds) || [];
            const reqDetails = reqIds.map(id => REQUESTS.find(r => r.id === id)).filter(Boolean);

            return (
              <li key={s.id} className={cls("ttm-flow-step", done && "is-done", prog && "is-progress", pend && "is-pending")}>
                <div className="ttm-flow-step-mark">
                  {done && <Icon name="check" size={14} stroke={2.5} />}
                  {prog && <span className="ttm-flow-step-pulse" />}
                  {pend && i + 1}
                </div>
                <div className="ttm-flow-step-body">
                  <div className="ttm-flow-step-head">
                    <div className={cls("ttm-flow-step-icon", `is-${fdef?.color || "neutral"}`)}>
                      <Icon name={fdef?.icon || "file-text"} size={14} />
                    </div>
                    <div className="ttm-flow-step-meta">
                      <div className="ttm-flow-step-title">
                        {s.labelTh ? (lang === "th" ? s.labelTh : s.labelEn) : (lang === "th" ? fdef?.titleTh : fdef?.titleEn) || s.form}
                      </div>
                      <div className="ttm-flow-step-sub">
                        <span className="ttm-mono">{s.form}</span>
                        <span className="ttm-muted"> · </span>
                        <Badge kind="neutral" className="ttm-flow-dept">{lang === "th" ? s.deptTh : s.deptEn}</Badge>
                        {s.optional && <Badge kind="neutral">{lang === "th" ? "ไม่บังคับ" : "Optional"}</Badge>}
                        {s.multiplePerHeadcount && <Badge kind="violet">×N {lang === "th" ? "ต่อพนักงาน" : "per headcount"}</Badge>}
                        {s.parallelWith && <Badge kind="amber">{lang === "th" ? "ขนานกับขั้นก่อน" : "Parallel"}</Badge>}
                      </div>
                    </div>
                    <div className="ttm-flow-step-status">
                      {done && <Badge kind="green" dot>{lang === "th" ? "เสร็จ" : "Done"}</Badge>}
                      {prog && <Badge kind="violet" dot>{lang === "th" ? "กำลังดำเนินการ" : "In progress"}</Badge>}
                      {pend && <Badge kind="neutral">{lang === "th" ? "รอคิว" : "Queued"}</Badge>}
                      {st?.completedAt && <span className="ttm-muted ttm-small">{st.completedAt}</span>}
                    </div>
                  </div>

                  {reqDetails.length > 0 && (
                    <div className="ttm-flow-step-requests">
                      {reqDetails.map(r => (
                        <button key={r.id} className="ttm-flow-step-request" onClick={() => openRequest(r.id)}>
                          <Icon name="file-text" size={13} />
                          <div>
                            <div className="ttm-mono ttm-small">{r.id}</div>
                            <div className="ttm-flow-step-request-title">{lang === "th" ? r.titleTh : r.titleEn}</div>
                          </div>
                          <StatusPill status={r.status} lang={lang} />
                          <Icon name="chevron-right" size={13} className="ttm-muted" />
                        </button>
                      ))}
                    </div>
                  )}

                  {pend && reqDetails.length === 0 && (
                    <div className="ttm-flow-step-pending-note">
                      <Icon name="clock" size={13} />
                      <span>{lang === "th"
                        ? `จะเริ่มเมื่อขั้นก่อนหน้าเสร็จ — ${s.deptTh} จะได้รับแจ้งเตือนอัตโนมัติ`
                        : `Will start after the previous step completes — ${s.deptEn} will be auto-notified`}</span>
                    </div>
                  )}

                  {prog && reqDetails.length === 0 && openForm && (
                    <Button variant="primary" size="sm" icon="plus" onClick={() => openForm(s.form)}>{lang === "th" ? "เริ่มกรอกฟอร์มขั้นนี้" : "Start this step"}</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

export function FlowPicker({ lang, back, onStart }) {
  const [picked, setPicked] = React.useState(null);
  const [title, setTitle] = React.useState("");
  const { FLOW_TEMPLATES } = useAppData();

  return (
    <div className="ttm-page ttm-flow-picker">
      <div className="ttm-crumbs">
        <button className="ttm-crumb" onClick={back}><Icon name="arrow-left" size={14} /> {lang === "th" ? "กลับ" : "Back"}</button>
      </div>

      <div className="ttm-list-head">
        <div>
          <h2>{lang === "th" ? "เริ่ม Flow ใหม่" : "Start a new Flow"}</h2>
          <p>{lang === "th" ? "เลือกขั้นตอนงานที่ขึ้นทะเบียนไว้ ระบบจะสร้างคำขอที่ผูกตามลำดับให้อัตโนมัติ" : "Pick a registered workflow — the system will provision requests in order automatically"}</p>
        </div>
      </div>

      <div className="ttm-picker-grid">
        {FLOW_TEMPLATES.map(tpl => (
          <button key={tpl.id}
            className={cls("ttm-picker-card", `is-${tpl.color}`, picked === tpl.id && "is-active")}
            onClick={() => setPicked(tpl.id)}>
            <div className="ttm-picker-card-head">
              <div className={cls("ttm-picker-icon", `is-${tpl.color}`)}><Icon name={tpl.icon} size={20} /></div>
              <div>
                <h3>{lang === "th" ? tpl.titleTh : tpl.titleEn}</h3>
                <div className="ttm-muted ttm-small">{(tpl.steps || []).length} {lang === "th" ? "ขั้น" : "steps"} · ~{tpl.avgDays} {lang === "th" ? "วัน" : "days"}</div>
              </div>
              {picked === tpl.id && <div className="ttm-picker-check"><Icon name="check" size={13} stroke={2.5} /></div>}
            </div>
            <p>{lang === "th" ? tpl.descTh : tpl.descEn}</p>
            <FlowStepsMini tpl={tpl} states={(tpl.steps || []).map(() => ({ status: "pending" }))} lang={lang} />
          </button>
        ))}
      </div>

      {picked && (
        <Card className="ttm-picker-name">
          <SectionTitle title={lang === "th" ? "ตั้งชื่อ Flow ของคุณ" : "Name your Flow"} sub={lang === "th" ? "ใช้ในการอ้างอิง — ปกติจะเป็นชื่อโครงการหรือชื่อพนักงาน" : "Used for reference — typically a project or person name"} />
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={lang === "th" ? "เช่น โครงการ AIS Premier Q4/2026" : "e.g. AIS Premier Q4/2026"} autoFocus />
          <div className="ttm-form-actions" style={{ marginTop: 14, position: "static", boxShadow: "none", padding: 0, border: 0, background: "transparent" }}>
            <Button variant="ghost" onClick={back}>{lang === "th" ? "ยกเลิก" : "Cancel"}</Button>
            <div className="ttm-spacer" />
            <Button variant="primary" icon="play" disabled={!title} onClick={() => onStart(picked, title)}>
              {lang === "th" ? "เริ่ม Flow" : "Start Flow"} <Icon name="arrow-right" size={15} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
