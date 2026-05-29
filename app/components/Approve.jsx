"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Avatar, Badge, Button, Card, Field, IconButton, SectionTitle, StatusPill, Textarea } from "./Ui";
import { useAppData } from "../lib/AppDataContext";

export function RequestDetail({ lang, t, reqId, back, role, openRequest, openFlow, currentUser }) {
  const { REQUESTS, USERS, FORM_TEMPLATES, FLOW_INSTANCES, NOTIFICATIONS, refreshRequests } = useAppData();
  const req = REQUESTS.find(r => r.id === reqId) || REQUESTS[0];
  if (!req) return <div className="ttm-page"><div className="ttm-empty">{lang === "th" ? "ไม่พบเอกสาร" : "Request not found"}</div></div>;
  const tmpl = FORM_TEMPLATES.find(f => f.code === req.template) || { icon: "file-text", color: "blue", code: req.template, titleTh: req.template, titleEn: req.template };
  const requester = USERS[req.requester] || { nameTh: req.requester, nameEn: req.requester, dept: "", avatar: "" };
  const [signOpen, setSignOpen] = React.useState(false);
  const [decision, setDecision] = React.useState(null);
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const myId = currentUser?.id;
  const currentStepData = (req.steps || [])[req.currentStep ?? 1];
  const canAct = req.status === "pending" && (
    role === "admin" ||
    (currentStepData?.user && currentStepData.user === myId) ||
    (!currentStepData?.user && (role === "approver" || role === "it"))
  );
  const parentFlow = FLOW_INSTANCES.find(f =>
    (f.stepStates || []).some(s => (s.reqIds || []).includes(req.id))
  );

  const submitDecision = async () => {
    if (!decision || busy) return;
    setBusy(true);
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const steps = [...(req.steps || [])];
    const idx = Math.max(0, (req.currentStep ?? 1));
    if (steps[idx]) {
      steps[idx] = {
        ...steps[idx],
        // Claim the step with the actual approver's id if it was empty (role-based step)
        user: steps[idx].user || currentUser?.id || "",
        action: decision,
        at: now,
        signed: true,
        comment: comment || undefined,
      };
    }
    const isLastStep = idx >= steps.length - 1;
    let newStatus = req.status;
    let newCurrent = req.currentStep;
    if (decision === "approved") {
      if (isLastStep) { newStatus = "approved"; }
      else { newCurrent = idx + 1; if (steps[newCurrent]) steps[newCurrent] = { ...steps[newCurrent], action: "pending" }; }
    } else if (decision === "rejected") {
      newStatus = "rejected";
    } else if (decision === "done") {
      newStatus = "done";
    }
    try {
      await fetch(`/api/requests/${req.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, status: newStatus, currentStep: newCurrent, rejectReason: decision === "rejected" ? comment : "" }),
      });
      await refreshRequests();
      setSignOpen(false);
      setDecision(null);
      setComment("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ttm-page ttm-detail">
      <div className="ttm-crumbs">
        <button className="ttm-crumb" onClick={back}><Icon name="arrow-left" size={14} /> {lang === "th" ? "กลับ" : "Back"}</button>
        <span className="ttm-crumb-sep">/</span>
        <span className="ttm-crumb-now">{tmpl.code}</span>
        <span className="ttm-crumb-sep">/</span>
        <span className="ttm-crumb-now ttm-mono">{req.id}</span>
      </div>

      <div className="ttm-detail-head">
        <div className="ttm-detail-head-l">
          <div className={cls("ttm-detail-head-icon", `is-${tmpl.color}`)}>
            <Icon name={tmpl.icon} size={22} />
          </div>
          <div>
            <div className="ttm-detail-head-code">{tmpl.code} · <span className="ttm-mono">{req.id}</span></div>
            <h2>{lang === "th" ? req.titleTh : req.titleEn}</h2>
            <div className="ttm-detail-sub">
              <Avatar user={requester} size={20} />
              <span>{lang === "th" ? requester.nameTh : requester.nameEn}</span>
              <span className="ttm-muted">·</span>
              <span className="ttm-muted">{req.createdAt}</span>
              <span className="ttm-muted">·</span>
              <span className="ttm-muted">{requester.dept}</span>
            </div>
          </div>
        </div>
        <div className="ttm-detail-head-r">
          {req.priority === "urgent" && <Badge kind="red" dot>{lang === "th" ? "ด่วนมาก" : "Urgent"}</Badge>}
          {req.priority === "high" && <Badge kind="amber" dot>{lang === "th" ? "ด่วน" : "High"}</Badge>}
          <StatusPill status={req.status} lang={lang} />
        </div>
      </div>

      <div className="ttm-detail-grid">
        <div className="ttm-detail-main">
          {parentFlow && (
            <Card className="ttm-flow-banner" onClick={() => openFlow && openFlow(parentFlow.id)}>
              <div className="ttm-flow-banner-l">
                <div className="ttm-flow-banner-icon"><Icon name="trending-up" size={18} /></div>
                <div>
                  <div className="ttm-muted ttm-small">{lang === "th" ? "เอกสารนี้เป็นส่วนหนึ่งของ Flow" : "This document is part of a Flow"}</div>
                  <strong>{parentFlow.id} · {lang === "th" ? parentFlow.titleTh : parentFlow.titleEn}</strong>
                </div>
              </div>
              <Button variant="secondary" size="sm" icon="arrow-right" onClick={(e) => { e.stopPropagation(); openFlow && openFlow(parentFlow.id); }}>{lang === "th" ? "ดู Flow" : "View Flow"}</Button>
            </Card>
          )}

          {req.links && (req.links.triggeredBy || req.links.triggers) && (
            <Card className="ttm-workflow-card">
              <SectionTitle
                title={lang === "th" ? "เส้นทางเอกสาร (Linked Workflow)" : "Linked Workflow"}
                sub={lang === "th" ? "ฟอร์มต้นทาง / ฟอร์มที่ถูกสร้างต่อโดยอัตโนมัติ" : "Parent and auto-spawned child requests"}
              />
              <LinkedWorkflowGraph req={req} lang={lang} openRequest={openRequest} />
            </Card>
          )}

          <Card className="ttm-timeline-card">
            <SectionTitle title={lang === "th" ? "ลำดับการอนุมัติ" : "Approval timeline"} />
            <ApprovalTimeline req={req} lang={lang} />
          </Card>

          <Card>
            <SectionTitle title={t.common.detail} />
            <PayloadView req={req} lang={lang} />
          </Card>

          <Card>
            <SectionTitle title={lang === "th" ? "บันทึกกิจกรรม (Audit log)" : "Audit log"} />
            <AuditLog req={req} lang={lang} />
          </Card>
        </div>

        <div className="ttm-detail-side">
          {canAct && (
            <Card className="ttm-action-card">
              <div className="ttm-action-head">
                <Icon name="signature" size={18} />
                <div>
                  <strong>{lang === "th" ? "การดำเนินการของคุณ" : "Your action"}</strong>
                  <div className="ttm-muted ttm-small">{lang === "th" ? `ขั้นที่ ${(req.currentStep ?? 0) + 1} / ${(req.steps || []).length}` : `Step ${(req.currentStep ?? 0) + 1} / ${(req.steps || []).length}`}</div>
                </div>
              </div>
              <Field label={lang === "th" ? "ความเห็น" : "Comment"}>
                <Textarea placeholder={lang === "th" ? "ระบุเหตุผลของการอนุมัติ/ไม่อนุมัติ..." : "Add a comment..."} value={comment} onChange={e => setComment(e.target.value)} />
              </Field>
              <div className="ttm-action-buttons">
                <Button variant="danger" icon="x" onClick={() => { setDecision("rejected"); setSignOpen(true); }}>{t.common.reject}</Button>
                {role === "it"
                  ? <Button variant="primary" icon="check-circle" onClick={() => { setDecision("done"); setSignOpen(true); }}>{lang === "th" ? "เสร็จสิ้น / Done" : "Mark as done"}</Button>
                  : <Button variant="primary" icon="check" onClick={() => { setDecision("approved"); setSignOpen(true); }}>{t.common.approve}</Button>
                }
              </div>
              <div className="ttm-action-foot">
                <Icon name="shield-check" size={14} />
                <span>{lang === "th" ? "ลายเซ็นของคุณจะถูกแนบใน PDF อย่างถาวร" : "Your signature will be embedded in the PDF permanently"}</span>
              </div>
            </Card>
          )}

          <ExternalSignerCards req={req} currentUser={currentUser} role={role} lang={lang} />


          <Card>
            <SectionTitle title={lang === "th" ? "การแจ้งเตือนสำหรับคำขอนี้" : "Notifications for this request"} />
            <ul className="ttm-mini-notif-list">
              {NOTIFICATIONS.filter(n => n.reqId === req.id).map(n => (
                <li key={n.id}>
                  <div className={cls("ttm-notif-chip", `is-${n.channel}`)}>
                    <Icon name={n.channel === "line" ? "line" : n.channel === "email" ? "mail" : "bell"} size={12} />
                  </div>
                  <div className="ttm-mini-notif-meta">
                    <div className="ttm-mini-notif-subj">{n.subject}</div>
                    <div className="ttm-muted ttm-small">{n.to} · {n.at}</div>
                  </div>
                  <Badge kind="green" className="ttm-mini-status">{n.status}</Badge>
                </li>
              ))}
              {NOTIFICATIONS.filter(n => n.reqId === req.id).length === 0 && (
                <li className="ttm-muted ttm-small ttm-pad">{lang === "th" ? "ยังไม่มีการแจ้งเตือน" : "No notifications yet"}</li>
              )}
            </ul>
          </Card>

          <Card>
            <SectionTitle title={lang === "th" ? "ข้อมูลเอกสาร" : "Document info"} />
            <dl className="ttm-keyval">
              <div><dt>{t.common.docNo}</dt><dd className="ttm-mono">{req.id}</dd></div>
              <div><dt>{lang === "th" ? "อ้างอิง template" : "Template"}</dt><dd>{tmpl.code} · Rev 00</dd></div>
              <div><dt>{t.common.created}</dt><dd>{req.createdAt}</dd></div>
              <div><dt>{t.common.updated}</dt><dd>{req.updatedAt}</dd></div>
              <div><dt>{lang === "th" ? "ความสมบูรณ์" : "Completeness"}</dt><dd><Badge kind="green" dot>100% ISO-ready</Badge></dd></div>
            </dl>
            <div className="ttm-detail-pdfs">
              <Button variant="secondary" icon="file-text" onClick={() => window.open(`/print/${encodeURIComponent(req.id)}`, "_blank", "noopener,noreferrer")}>{t.common.preview}</Button>
              <Button variant="ghost" icon="download" onClick={() => window.open(`/print/${encodeURIComponent(req.id)}?print=1`, "_blank", "noopener,noreferrer")}>{t.common.download}</Button>
            </div>
          </Card>
        </div>
      </div>

      {signOpen && <SignatureModal lang={lang} decision={decision} onClose={() => setSignOpen(false)} onConfirm={submitDecision} busy={busy} />}
    </div>
  );
}

function LinkedWorkflowGraph({ req, lang, openRequest }) {
  const { REQUESTS, USERS, FORM_TEMPLATES } = useAppData();
  const parent = req.links?.triggeredBy ? REQUESTS.find(r => r.id === req.links.triggeredBy) : null;
  const children = (req.links?.triggers || []).map(id => REQUESTS.find(r => r.id === id)).filter(Boolean);

  let ancestors = [];
  let cur = parent;
  while (cur && cur.links?.triggeredBy) {
    const p = REQUESTS.find(r => r.id === cur.links.triggeredBy);
    if (!p) break;
    ancestors.unshift(p);
    cur = p;
  }

  const renderNode = (r, kind) => {
    const tobj = FORM_TEMPLATES.find(t => t.code === r.template) || { icon: "file-text", color: "blue" };
    const u = USERS[r.requester] || { nameTh: r.requester, nameEn: r.requester, dept: "", avatar: "" };
    return (
      <div className={cls("ttm-wf-node", `is-${kind}`, `is-${r.status}`, kind !== "current" && "is-clickable")}
           onClick={kind !== "current" && openRequest ? () => openRequest(r.id) : undefined}
           role={kind !== "current" ? "button" : undefined}>
        {kind === "current" && (
          <span className="ttm-wf-current-tag">● {lang === "th" ? "ปัจจุบัน" : "Current"}</span>
        )}
        <div className="ttm-wf-node-head">
          <div className={cls("ttm-wf-node-icon", `is-${tobj.color}`)}>
            <Icon name={tobj.icon} size={14} />
          </div>
          <div className="ttm-wf-node-meta">
            <div className="ttm-wf-node-code ttm-mono">{r.id}</div>
            <StatusPill status={r.status} lang={lang} />
          </div>
        </div>
        <div className="ttm-wf-node-title">{lang === "th" ? r.titleTh : r.titleEn}</div>
        <div className="ttm-wf-node-foot">
          <Avatar user={u} size={16} />
          <span className="ttm-muted ttm-small">{lang === "th" ? u.nameTh : u.nameEn}</span>
          <span className="ttm-muted ttm-small">·</span>
          <span className="ttm-muted ttm-small">{u.dept}</span>
        </div>
        {r.autoSpawned && (
          <div className="ttm-wf-auto">
            <Icon name="fingerprint" size={11} />
            <span>{lang === "th" ? "สร้างอัตโนมัติจากฟอร์มต้นทาง" : "Auto-spawned from parent"}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ttm-wf-graph">
      {ancestors.map((a) => (
        <React.Fragment key={a.id}>
          {renderNode(a, "ancestor")}
          <WFArrow lang={lang} />
        </React.Fragment>
      ))}
      {parent && (
        <>
          {renderNode(parent, "parent")}
          <WFArrow lang={lang} />
        </>
      )}
      {renderNode(req, "current")}
      {children.length > 0 && (
        <>
          <WFArrow lang={lang} fanOut={children.length > 1} />
          <div className="ttm-wf-children">
            {children.map(c => <div key={c.id}>{renderNode(c, "child")}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

function WFArrow({ lang, fanOut }) {
  return (
    <div className={cls("ttm-wf-arrow", fanOut && "is-fan")}>
      <div className="ttm-wf-arrow-line" />
      <div className="ttm-wf-arrow-label">
        <Icon name="arrow-right" size={12} />
        <span>{lang === "th" ? "Trigger อัตโนมัติ" : "Auto-trigger"}</span>
      </div>
      <div className="ttm-wf-arrow-line" />
    </div>
  );
}

function ApprovalTimeline({ req, lang }) {
  const { USERS } = useAppData();
  return (
    <ol className="ttm-approval-timeline">
      {(req.steps || []).map((s, i) => {
        const u = USERS[s.user] || { nameTh: s.user, nameEn: s.user, titleTh: "", titleEn: "", avatar: "" };
        const done = ["submitted", "approved", "done"].includes(s.action);
        const isPending = s.action === "pending";
        const isProg = s.action === "in_progress";
        const isReject = s.action === "rejected";
        return (
          <li key={i} className={cls(
            "ttm-tl-row",
            done && "is-done",
            isPending && "is-pending",
            isProg && "is-progress",
            isReject && "is-reject",
          )}>
            <div className="ttm-tl-mark">
              {done && <Icon name="check" size={13} stroke={2.5} />}
              {isPending && <Icon name="clock" size={13} />}
              {isProg && <span className="ttm-tl-pulse" />}
              {isReject && <Icon name="x" size={13} stroke={2.5} />}
              {!done && !isPending && !isProg && !isReject && i + 1}
            </div>
            <div className="ttm-tl-body">
              <div className="ttm-tl-head">
                <Avatar user={u} size={26} />
                <div className="ttm-tl-info">
                  <div className="ttm-tl-name">{lang === "th" ? u.nameTh : u.nameEn} <span className="ttm-muted">— {s.role}</span></div>
                  <div className="ttm-tl-sub">{lang === "th" ? u.titleTh : u.titleEn}</div>
                </div>
                <div className="ttm-tl-status">
                  {done && <Badge kind="green" dot>{s.action === "submitted" ? (lang === "th" ? "ส่งคำขอ" : "Submitted") : s.action === "approved" ? (lang === "th" ? "อนุมัติ" : "Approved") : (lang === "th" ? "เสร็จสิ้น" : "Done")}</Badge>}
                  {isPending && <Badge kind="amber" dot>{lang === "th" ? "รออนุมัติ" : "Pending"}</Badge>}
                  {isProg && <Badge kind="violet" dot>{lang === "th" ? "กำลังดำเนินการ" : "In progress"}</Badge>}
                  {isReject && <Badge kind="red" dot>{lang === "th" ? "ไม่อนุมัติ" : "Rejected"}</Badge>}
                  {!done && !isPending && !isProg && !isReject && <Badge kind="neutral">{lang === "th" ? "รอคิว" : "Queued"}</Badge>}
                </div>
              </div>
              {s.at && <div className="ttm-tl-time"><Icon name="clock" size={12} /> {s.at}</div>}
              {s.signed && (
                <div className="ttm-tl-signature">
                  <SignatureChip user={u} variant={i % 3 === 0 ? "drawn" : i % 3 === 1 ? "uploaded" : "pin"} />
                </div>
              )}
              {isReject && req.rejectReason && (
                <div className="ttm-tl-reason">
                  <Icon name="x" size={12} />
                  <span>{req.rejectReason}</span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SignatureChip({ user, variant = "drawn" }) {
  if (variant === "drawn") {
    return (
      <div className="ttm-sig">
        <svg viewBox="0 0 160 48" className="ttm-sig-svg" preserveAspectRatio="xMinYMid meet">
          <path d="M5 35 C 18 8, 22 8, 30 30 S 48 12, 60 25 S 80 45, 95 18 L 110 32 L 130 14 L 145 30 L 155 18" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 38 L 150 38" stroke="#1e3a8a" strokeWidth="0.6" opacity="0.3" />
        </svg>
        <div className="ttm-sig-meta">
          <div className="ttm-sig-name">{user.nameTh}</div>
          <div className="ttm-sig-role">{user.titleTh}</div>
        </div>
      </div>
    );
  }
  if (variant === "uploaded") {
    return (
      <div className="ttm-sig">
        <svg viewBox="0 0 160 48" className="ttm-sig-svg" preserveAspectRatio="xMinYMid meet">
          <path d="M8 32 Q 20 10 32 30 T 60 28 T 95 22 T 130 30 T 155 25" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
          <text x="0" y="46" fontFamily="cursive" fontSize="10" fill="#475569" opacity="0.7">— signed by stylus</text>
        </svg>
        <div className="ttm-sig-meta">
          <div className="ttm-sig-name">{user.nameTh}</div>
          <div className="ttm-sig-role">{user.titleTh}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="ttm-sig is-pin">
      <div className="ttm-sig-pin">
        <Icon name="fingerprint" size={20} />
        <div className="ttm-sig-pin-meta">
          <strong>e-Signature (PIN)</strong>
          <span>verified via MS Entra ID</span>
        </div>
      </div>
      <div className="ttm-sig-meta">
        <div className="ttm-sig-name">{user.nameTh}</div>
        <div className="ttm-sig-role">{user.titleTh}</div>
      </div>
    </div>
  );
}

function PayloadView({ req, lang }) {
  const { FORM_TEMPLATES } = useAppData();
  const p = req.payload || {};
  const tmpl = FORM_TEMPLATES.find(f => f.code === req.template);

  // If the request was created via dynamic schema, render from template sections
  if (p.sch && tmpl && Array.isArray(tmpl.sections) && tmpl.sections.length > 0) {
    return <DynamicPayloadView sections={tmpl.sections} sch={p.sch} lang={lang} />;
  }

  if (req.template === "FM-IT-01-01") {
    const itemsList = Array.isArray(p.items) ? p.items : [];
    return (
      <div className="ttm-payload">
        <KV k={lang === "th" ? "พนักงานปลายทาง" : "Target employee"} v={`${p.employeeName || "—"} · ${p.employeeId || "—"}`} />
        <KV k={lang === "th" ? "ตำแหน่ง" : "Position"} v={p.position} />
        <KV k={lang === "th" ? "แผนก" : "Department"} v={p.department} />
        <KV k={lang === "th" ? "วันที่ต้องการให้มีผล" : "Effective"} v={p.effectiveDate} />
        <KV k={lang === "th" ? "ประเภทพนักงาน" : "Employment"} v={p.employeeType} />
        <KV k={lang === "th" ? "ประเภทการร้องขอ" : "Request"} v={p.requestType} />
        <div className="ttm-payload-items">
          <div className="ttm-payload-label">{lang === "th" ? "รายการที่ขอ" : "Items"}</div>
          <div className="ttm-payload-chips">
            {itemsList.map((i, idx) => <span key={idx} className="ttm-chip">{i}</span>)}
          </div>
        </div>
        <KV k={lang === "th" ? "จุดประสงค์" : "Purpose"} v={p.purpose} freeform />
      </div>
    );
  }
  if (req.template === "FM-IT-01-09") {
    return (
      <div className="ttm-payload">
        <KV k="Queue name" v={p.queueName} />
        <KV k="Ring strategy" v={p.ringStrategy} />
        <KV k="Outbound" v={(p.outbound || []).join(", ")} />
        <KV k={lang === "th" ? "จำนวน Member" : "Members"} v={`${p.members} agents`} />
        <KV k="Go-live" v={p.goLive} />
      </div>
    );
  }
  if (req.template === "FM-IT-01-11") {
    return (
      <div className="ttm-payload">
        <KV k="Asset ID" v={p.assetId} />
        <KV k={lang === "th" ? "ระดับความรุนแรง" : "Severity"} v={p.severity} />
        <KV k="Ticket No." v={p.ticketNo} />
        <KV k={lang === "th" ? "อาการ" : "Symptoms"} v={p.symptoms} freeform />
      </div>
    );
  }
  if (req.template === "FM-IT-01-10") {
    return (
      <div className="ttm-payload">
        <KV k={lang === "th" ? "จำนวนจุดติดตั้ง" : "Stations"} v={p.stations} />
        <KV k={lang === "th" ? "รายการอุปกรณ์" : "Items per station"} v={(p.includes || []).join(", ")} />
        <KV k="Go-live" v={p.goLive} />
      </div>
    );
  }
  if (req.template === "FM-SL-04-01") {
    return (
      <div className="ttm-payload">
        <KV k={lang === "th" ? "ชื่อโครงการ" : "Project name"} v={p.projectName} />
        <KV k={lang === "th" ? "ลูกค้า" : "Client"} v={p.client} />
        <KV k={lang === "th" ? "จำนวน Seat ที่ต้องการ" : "Required seats"} v={p.seatCount} />
        <KV k="Go-live" v={p.goLive} />
        <KV k={lang === "th" ? "รายได้ต่อเดือน (ประมาณการ)" : "Estimated monthly revenue"} v={p.monthlyRevenue} />
      </div>
    );
  }
  if (req.template === "FM-HR-02-01") {
    return (
      <div className="ttm-payload">
        <KV k={lang === "th" ? "จำนวนกำลังพล" : "Headcount"} v={p.headcount} />
        <KV k={lang === "th" ? "ตำแหน่ง" : "Positions"} v={(p.positions || []).join(" · ")} />
        <KV k={lang === "th" ? "วันเริ่มงาน" : "Start date"} v={p.startDate} />
        <KV k={lang === "th" ? "โครงการ" : "Project"} v={p.project} />
      </div>
    );
  }
  return <div className="ttm-muted">{lang === "th" ? "ไม่มีรายละเอียดเพิ่มเติม" : "No additional payload."}</div>;
}

function KV({ k, v, freeform }) {
  return (
    <div className={cls("ttm-kv", freeform && "is-freeform")}>
      <div className="ttm-kv-k">{k}</div>
      <div className="ttm-kv-v">{v ?? "—"}</div>
    </div>
  );
}

function DynamicPayloadView({ sections, sch, lang }) {
  const fmt = (f) => {
    const v = sch[f.id];
    const hasOpts = Array.isArray(f.options) && f.options.length > 0;
    if (f.type === "radio" && hasOpts) {
      const o = f.options.find(o => o.id === v);
      return o ? (lang === "th" ? o.labelTh : o.labelEn) : "—";
    }
    if (f.type === "toggle") {
      const on = v === true || v === "yes" || v === "true";
      return on ? (lang === "th" ? "ใช้" : "Yes") : (lang === "th" ? "ไม่ใช้" : "No");
    }
    if (f.type === "checkbox" && hasOpts) {
      const arr = Array.isArray(v) ? v : [];
      return arr.map(id => f.options.find(o => o.id === id)?.[lang === "th" ? "labelTh" : "labelEn"]).filter(Boolean).join(", ") || "—";
    }
    if (f.type === "checkbox") {
      const checked = v && typeof v === "object" ? v.checked === true : v === true;
      if (!checked) return lang === "th" ? "ไม่เลือก" : "Not selected";
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
        return parts.length ? `✓ ${parts.join(" · ")}` : (lang === "th" ? "เลือก" : "Selected");
      }
      return lang === "th" ? "✓ เลือก" : "✓ Selected";
    }
    if (f.type === "select" && hasOpts) {
      const o = f.options.find(o => o.id === v);
      return o ? (lang === "th" ? o.labelTh : o.labelEn) : "—";
    }
    return v || "—";
  };

  return (
    <div className="ttm-payload">
      {sections.map(sec => (
        <div key={sec.id} style={{ marginBottom: "1rem" }}>
          <div className="ttm-payload-label" style={{ fontWeight: 600, marginBottom: 6 }}>
            {lang === "th" ? sec.titleTh : sec.titleEn}
          </div>
          {(sec.fields || []).map(f => (
            <KV key={f.id}
              k={lang === "th" ? f.labelTh : f.labelEn}
              v={fmt(f)}
              freeform={f.type === "textarea"} />
          ))}
        </div>
      ))}
    </div>
  );
}

function AuditLog({ req, lang }) {
  const { USERS } = useAppData();
  const steps = req.steps || [];
  const events = [
    { at: req.createdAt, who: "system", icon: "fingerprint", text: lang === "th" ? `สร้างเลขเอกสารอัตโนมัติ ${req.id}` : `Generated document number ${req.id}` },
    { at: req.createdAt, who: steps[0]?.user, icon: "send", text: lang === "th" ? "ส่งคำขอเข้าระบบ" : "Submitted to workflow" },
    { at: req.createdAt, who: "system", icon: "line", text: lang === "th" ? "แจ้งเตือน LINE → กลุ่ม IT Operations" : "LINE → IT Operations group" },
    { at: req.createdAt, who: "system", icon: "mail", text: lang === "th" ? "ส่ง Email พร้อมลิงก์อนุมัติ" : "Email with approval link sent" },
    ...steps.filter(s => s.action === "approved").map(s => ({ at: s.at, who: s.user, icon: "check-circle", text: lang === "th" ? `${s.role} อนุมัติ` : `${s.role} approved` })),
    ...(req.status === "rejected" ? [{ at: req.updatedAt, who: steps.find(s => s.action === "rejected")?.user, icon: "x", text: lang === "th" ? "ปฏิเสธคำขอ" : "Rejected" }] : []),
    ...(req.status === "done" ? [{ at: req.updatedAt, who: "system", icon: "shield-check", text: lang === "th" ? "บันทึกเอกสารเข้าสู่คลังถาวร" : "Archived to immutable store" }] : []),
  ];
  return (
    <ul className="ttm-audit-list">
      {events.map((e, i) => (
        <li key={i} className="ttm-audit-row">
          <div className="ttm-audit-mark"><Icon name={e.icon} size={14} /></div>
          <div className="ttm-audit-meta">
            <div className="ttm-audit-text">{e.text}</div>
            <div className="ttm-audit-sub">
              <span className="ttm-muted">{e.at}</span>
              {e.who && e.who !== "system" && USERS[e.who] && (
                <>
                  <span className="ttm-muted">·</span>
                  <Avatar user={USERS[e.who]} size={16} />
                  <span>{lang === "th" ? USERS[e.who].nameTh : USERS[e.who].nameEn}</span>
                </>
              )}
              {e.who === "system" && <><span className="ttm-muted">·</span><span className="ttm-muted">system</span></>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SignatureModal({ lang, decision, onClose, onConfirm, busy }) {
  const [mode, setMode] = React.useState("draw");
  const canvasRef = React.useRef(null);
  const [hasInk, setHasInk] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "draw") return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#1e3a8a";
    let drawing = false, last = null;
    const pos = (e) => {
      const rect = c.getBoundingClientRect();
      const tt = e.touches ? e.touches[0] : e;
      return { x: tt.clientX - rect.left, y: tt.clientY - rect.top };
    };
    const start = (e) => { drawing = true; last = pos(e); e.preventDefault(); };
    const move = (e) => {
      if (!drawing) return;
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; setHasInk(true); e.preventDefault();
    };
    const end = () => { drawing = false; };
    c.addEventListener("pointerdown", start);
    c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => {
      c.removeEventListener("pointerdown", start);
      c.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  }, [mode]);

  const clear = () => {
    const c = canvasRef.current;
    if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  return (
    <div className="ttm-modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ttm-modal ttm-sig-modal">
        <div className="ttm-modal-head">
          <div>
            <h3>{decision === "rejected" ? (lang === "th" ? "ยืนยันการไม่อนุมัติ" : "Confirm rejection") : decision === "done" ? (lang === "th" ? "ยืนยันการเสร็จสิ้น" : "Confirm completion") : (lang === "th" ? "ยืนยันการอนุมัติ" : "Confirm approval")}</h3>
            <p>{lang === "th" ? "ลงลายเซ็นเพื่อยืนยันการดำเนินการของคุณ" : "Sign to confirm your action"}</p>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>

        <div className="ttm-modal-body">

        <div className="ttm-sig-modes">
          {[
            { id: "draw", label: lang === "th" ? "วาดลายเซ็น" : "Draw", icon: "signature" },
            { id: "upload", label: lang === "th" ? "อัปโหลดรูป" : "Upload image", icon: "external" },
            { id: "pin", label: lang === "th" ? "ยืนยันด้วย PIN" : "PIN verify", icon: "fingerprint" },
          ].map(m => (
            <button key={m.id} className={cls("ttm-sig-mode", mode === m.id && "is-active")} onClick={() => setMode(m.id)}>
              <Icon name={m.icon} size={15} />
              {m.label}
            </button>
          ))}
        </div>

        {mode === "draw" && (
          <div>
            <div className="ttm-sig-canvas-wrap">
              <canvas ref={canvasRef} width={560} height={180} className="ttm-sig-canvas" />
              {!hasInk && <div className="ttm-sig-canvas-hint">{lang === "th" ? "ใช้นิ้วหรือ stylus วาดในกรอบนี้" : "Draw inside this box"}</div>}
            </div>
            <div className="ttm-sig-canvas-toolbar">
              <button className="ttm-link" onClick={clear}>{lang === "th" ? "ล้าง" : "Clear"}</button>
            </div>
          </div>
        )}

        {mode === "upload" && (
          <div className="ttm-sig-upload">
            <Icon name="external" size={26} />
            <div>
              <strong>{lang === "th" ? "ลากรูปลายเซ็นมาวางที่นี่" : "Drop signature image here"}</strong>
              <p>{lang === "th" ? "PNG, JPG พื้นโปร่งใส ขนาดไม่เกิน 2 MB" : "PNG, JPG with transparent background, up to 2 MB"}</p>
            </div>
          </div>
        )}

        {mode === "pin" && (
          <div className="ttm-sig-pinpad">
            <div className="ttm-sig-pin-display">● ● ● ●</div>
            <div className="ttm-sig-pin-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "✓"].map(n => (
                <button key={n} className={cls("ttm-sig-pin-key", typeof n === "string" && "is-action")}>{n}</button>
              ))}
            </div>
            <p className="ttm-muted ttm-small ttm-pad">{lang === "th" ? "ยืนยันตัวตนผ่าน Microsoft Entra ID — PIN 4 หลัก" : "Identity verified via Microsoft Entra ID — 4-digit PIN"}</p>
          </div>
        )}

        </div>{/* /.ttm-modal-body */}

        <div className="ttm-modal-foot">
          <Button variant="ghost" onClick={onClose}>{lang === "th" ? "ยกเลิก" : "Cancel"}</Button>
          <Button variant={decision === "rejected" ? "danger" : "primary"} icon={decision === "rejected" ? "x" : "check"} onClick={onConfirm} disabled={busy}>
            {decision === "rejected" ? (lang === "th" ? "ลงนาม & ไม่อนุมัติ" : "Sign & reject") : decision === "done" ? (lang === "th" ? "ลงนาม & ยืนยันเสร็จสิ้น" : "Sign & mark done") : (lang === "th" ? "ลงนาม & อนุมัติ" : "Sign & approve")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   External signer cards — show one card per external step in the chain
   ═════════════════════════════════════════════════════════════════════ */
function ExternalSignerCards({ req, currentUser, role, lang }) {
  // Show a link card for any unsigned step in the chain (after step 0) that
  // either is explicitly external OR has no registered user assigned.
  // This covers requests created before the template was switched to
  // "ลิงก์ภายนอก" mode, plus role-only steps where there's no in-app
  // approver to ping.
  const externalSteps = (req.steps || [])
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => s.idx > 0 && !s.signed && (s.source === "external" || !s.user));

  if (externalSteps.length === 0) return null;

  // Only chain participants (anyone who signed a step) or admin can see/manage links
  const canManage = currentUser && (
    role === "admin" ||
    (req.steps || []).some(s => s.user === currentUser.id && s.signed)
  );
  if (!canManage) return null;

  return externalSteps.map(s => (
    <ExternalSignerCard key={s.idx} req={req} step={s} stepIdx={s.idx} lang={lang} />
  ));
}

function ExternalSignerCard({ req, step, stepIdx, lang }) {
  const { refreshRequests } = useAppData();
  const [tokens, setTokens] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [newLink, setNewLink] = React.useState(null);   // freshly created (plaintext shown once)
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${encodeURIComponent(req.id)}/signing-tokens`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Load failed"); return; }
      setTokens((data.tokens || []).filter(t => t.stepIdx === stepIdx));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [req.id, stepIdx]);

  React.useEffect(() => { reload(); }, [reload]);

  const generate = async () => {
    setBusy(true); setError(""); setCopied(false);
    try {
      const res = await fetch(`/api/requests/${encodeURIComponent(req.id)}/signing-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepIdx, expiresInDays: step.expiresInDays || 7 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Create failed"); return; }
      setNewLink(data);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (tokenId) => {
    if (!confirm(lang === "th" ? "ยกเลิกลิงก์นี้?" : "Revoke this link?")) return;
    setBusy(true);
    try {
      await fetch(`/api/requests/${encodeURIComponent(req.id)}/signing-tokens?id=${tokenId}`, { method: "DELETE" });
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const activeToken = tokens.find(t => !t.usedAt && new Date(t.expiresAt).getTime() > Date.now());
  const completedToken = tokens.find(t => t.usedAt);
  const stepName = step.displayName || step.role || `Step ${stepIdx + 1}`;

  // Once signed, just show a tiny status card
  if (step.signed && completedToken) {
    return (
      <Card>
        <SectionTitle title={lang === "th" ? "ลิงก์เซ็นภายนอก" : "External sign link"} />
        <div className="ttm-ext-status ttm-ext-status-done">
          <Icon name="check-circle" size={16} />
          <div>
            <strong>{stepName}</strong>
            <div className="ttm-muted ttm-small">
              {lang === "th" ? "เซ็นแล้วเมื่อ" : "Signed at"} {String(completedToken.usedAt).replace("T", " ").slice(0, 16)}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title={lang === "th" ? "ลิงก์เซ็นภายนอก" : "External sign link"} />
      <div className="ttm-ext-info">
        <div>
          <div className="ttm-small ttm-muted">{lang === "th" ? "ผู้รับมอบ:" : "Receiver:"}</div>
          <strong>{stepName}</strong>
          {step.displayTitle && <div className="ttm-muted ttm-small">{step.displayTitle}</div>}
        </div>
      </div>

      {newLink && (
        <div className="ttm-ext-link-box">
          <div className="ttm-small" style={{ fontWeight: 600, marginBottom: 4 }}>
            {lang === "th" ? "ลิงก์สำหรับผู้รับมอบ:" : "Link for the receiver:"}
          </div>
          <div className="ttm-ext-link-url">{newLink.url}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="primary" size="sm" icon={copied ? "check" : "copy"}
              onClick={() => copyToClipboard(newLink.url)}>
              {copied
                ? (lang === "th" ? "คัดลอกแล้ว ✓" : "Copied ✓")
                : (lang === "th" ? "คัดลอกลิงก์" : "Copy link")}
            </Button>
            <span className="ttm-muted ttm-small" style={{ alignSelf: "center" }}>
              {lang === "th" ? "หมดอายุ: " : "Expires: "}
              {new Date(newLink.expiresAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
            </span>
          </div>
        </div>
      )}

      {!newLink && activeToken && (
        <div className="ttm-ext-link-box">
          <div className="ttm-small ttm-muted">
            {lang === "th"
              ? "มีลิงก์ที่ใช้งานอยู่ — คัดลอกอีกครั้งไม่ได้ (หาก URL หาย ต้องสร้างใหม่)"
              : "An active link exists — cannot copy again (regenerate if URL was lost)"}
          </div>
          <div className="ttm-small" style={{ marginTop: 6 }}>
            {lang === "th" ? "สร้างเมื่อ: " : "Created: "}
            {String(activeToken.createdAt).replace("T", " ").slice(0, 16)}
            {" · "}
            {lang === "th" ? "หมดอายุ: " : "Expires: "}
            {String(activeToken.expiresAt).replace("T", " ").slice(0, 16)}
            {activeToken.openedAt && (
              <span style={{ color: "var(--c-amber, #d97706)" }}>
                {" · "}{lang === "th" ? "เปิดแล้ว" : "Opened"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="secondary" size="sm" icon="trash" onClick={() => revoke(activeToken.id)} disabled={busy}>
              {lang === "th" ? "ยกเลิก & สร้างใหม่" : "Revoke & regenerate"}
            </Button>
          </div>
        </div>
      )}

      {!newLink && !activeToken && (
        <Button variant="primary" icon="external" onClick={generate} disabled={busy || loading}>
          {busy
            ? (lang === "th" ? "กำลังสร้าง..." : "Generating...")
            : (lang === "th" ? "สร้างลิงก์เซ็นเอกสาร" : "Generate sign link")}
        </Button>
      )}

      {error && <div className="ttm-ext-error">{error}</div>}

      <div className="ttm-ext-foot">
        <Icon name="bell" size={12} />
        <span>
          {lang === "th"
            ? "ลิงก์นี้ใช้ได้ครั้งเดียว — คัดลอกแล้วส่งให้ผู้รับมอบทางช่องทางที่สะดวก (LINE, Messenger ฯลฯ)"
            : "Single-use link — copy and send to the receiver via your preferred channel"}
        </span>
      </div>
    </Card>
  );
}

