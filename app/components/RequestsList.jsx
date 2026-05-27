"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Avatar, Badge, Button, Card, Select, StatusPill, Tabs } from "./Ui";
import { useAppData } from "../lib/AppDataContext";

export function RequestsList({ lang, t, role, scope, openRequest, currentUser }) {
  const { REQUESTS: reqs, USERS, FORM_TEMPLATES: tmpl } = useAppData();
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [tmplFilter, setTmplFilter] = React.useState("all");

  const myId = currentUser?.id;
  let scoped = reqs;
  if (scope === "my") {
    scoped = myId ? reqs.filter(r => r.requester === myId) : [];
  } else if (scope === "approvals") {
    scoped = myId
      ? reqs.filter(r => {
          if (r.status !== "pending") return false;
          const cur = (r.steps || [])[r.currentStep];
          return cur?.user === myId;
        })
      : reqs.filter(r => r.status === "pending");
  } else if (scope === "it") {
    scoped = myId
      ? reqs.filter(r => {
          if (["rejected", "done"].includes(r.status)) return false;
          return (r.steps || []).some(s => s.user === myId && (s.action === "in_progress" || s.action === "queued"));
        })
      : reqs.filter(r => r.status === "inProgress" || r.status === "approved");
  }
  // scope === "archive" → show all

  let filtered = scoped;
  if (filter !== "all") filtered = filtered.filter(r => r.status === filter);
  if (tmplFilter !== "all") filtered = filtered.filter(r => r.template === tmplFilter);
  if (q) filtered = filtered.filter(r =>
    r.id.toLowerCase().includes(q.toLowerCase()) ||
    (lang === "th" ? r.titleTh : r.titleEn).toLowerCase().includes(q.toLowerCase())
  );

  const statusCounts = {
    all: scoped.length,
    draft: scoped.filter(r => r.status === "draft").length,
    pending: scoped.filter(r => r.status === "pending").length,
    inProgress: scoped.filter(r => r.status === "inProgress").length,
    approved: scoped.filter(r => r.status === "approved").length,
    done: scoped.filter(r => r.status === "done").length,
    rejected: scoped.filter(r => r.status === "rejected").length,
  };

  const titleMap = {
    my: t.nav.myRequests,
    approvals: t.nav.approvals,
    it: t.nav.itQueue,
    archive: t.nav.archive,
  };
  const subMap = {
    my: lang === "th" ? "คำขอที่คุณเป็นผู้สร้างหรือเกี่ยวข้อง" : "Requests you created or are involved in",
    approvals: lang === "th" ? "คำขอที่รอลายเซ็นและการอนุมัติของคุณ" : "Requests awaiting your signature & approval",
    it: lang === "th" ? "งานที่ถูกมอบหมายให้คุณ/แผนกของคุณ — รับเข้าคิวเพื่อดำเนินการ" : "Requests assigned to you or your team — accept into your queue",
    archive: lang === "th" ? "คลังเอกสารทุกแผนก สำหรับ Auditor และ QMR — บันทึก immutable พร้อมลายเซ็น" : "Cross-dept document archive for Auditor & QMR — immutable with signatures",
  };

  return (
    <div className="ttm-page ttm-list-page">
      <div className="ttm-list-head">
        <div>
          <h2>{titleMap[scope]}</h2>
          <p>{subMap[scope]}</p>
        </div>
        <div className="ttm-list-controls">
          <div className="ttm-search ttm-search-compact">
            <Icon name="search" size={15} />
            <input placeholder={t.common.search} value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Select value={tmplFilter} onChange={e => setTmplFilter(e.target.value)}>
            <option value="all">{lang === "th" ? "ทุกแบบฟอร์ม" : "All form types"}</option>
            {tmpl.map(tt => <option key={tt.code} value={tt.code}>{tt.code} · {lang === "th" ? tt.titleTh : tt.titleEn}</option>)}
          </Select>
          <Button variant="ghost" icon="filter" size="sm">{t.common.filter}</Button>
        </div>
      </div>

      <Tabs value={filter} onChange={setFilter} items={[
        { id: "all", label: t.common.all, count: statusCounts.all, icon: "list" },
        { id: "pending", label: t.status.pending, count: statusCounts.pending, icon: "clock" },
        { id: "inProgress", label: t.status.inProgress, count: statusCounts.inProgress, icon: "play" },
        { id: "approved", label: t.status.approved, count: statusCounts.approved, icon: "check-circle" },
        { id: "done", label: t.status.done, count: statusCounts.done, icon: "shield-check" },
        { id: "rejected", label: t.status.rejected, count: statusCounts.rejected, icon: "x" },
      ]} />

      <Card className="ttm-table-card">
        <table className="ttm-table">
          <thead>
            <tr>
              <th>{t.common.docNo}</th>
              <th>{lang === "th" ? "หัวข้อ / ฟอร์ม" : "Title / Form"}</th>
              <th>{t.common.requester}</th>
              <th>{lang === "th" ? "ความคืบหน้า" : "Progress"}</th>
              <th>{lang === "th" ? "สถานะ" : "Status"}</th>
              <th>{t.common.updated}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const tobj = tmpl.find(x => x.code === r.template) || { icon: "file-text", color: "blue", code: r.template, titleTh: r.template, titleEn: r.template };
              const u = USERS[r.requester] || { nameTh: r.requester, nameEn: r.requester, dept: "" };
              return (
                <tr key={r.id} onClick={() => openRequest(r.id)} className="ttm-tr-clickable">
                  <td>
                    <div className="ttm-doc-cell">
                      <span className="ttm-mono">{r.id}</span>
                      {r.priority === "urgent" && <Badge kind="red" className="ttm-pri">{lang === "th" ? "ด่วนมาก" : "Urgent"}</Badge>}
                      {r.priority === "high" && <Badge kind="amber" className="ttm-pri">{lang === "th" ? "ด่วน" : "High"}</Badge>}
                    </div>
                  </td>
                  <td>
                    <div className="ttm-title-cell">
                      <div className={cls("ttm-title-icon", `is-${tobj.color}`)}><Icon name={tobj.icon} size={14} /></div>
                      <div>
                        <div className="ttm-title-main">{lang === "th" ? r.titleTh : r.titleEn}</div>
                        <div className="ttm-title-sub ttm-muted">{tobj.code} · {lang === "th" ? tobj.titleTh : tobj.titleEn}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="ttm-user-cell">
                      <Avatar user={u} size={26} />
                      <div>
                        <div>{lang === "th" ? u.nameTh : u.nameEn}</div>
                        <div className="ttm-muted ttm-small">{u.dept}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <ProgressDots steps={r.steps} current={r.currentStep} status={r.status} />
                  </td>
                  <td><StatusPill status={r.status} lang={lang} /></td>
                  <td className="ttm-muted">{r.updatedAt}</td>
                  <td className="ttm-row-action"><Icon name="chevron-right" size={14} className="ttm-muted" /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="ttm-empty-cell">{t.common.noResults}</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {scope === "archive" && (
        <Card className="ttm-archive-banner">
          <Icon name="shield-check" size={20} />
          <div>
            <strong>{lang === "th" ? "พร้อมตรวจรับรอง ISO 9001" : "ISO 9001 audit ready"}</strong>
            <p>{lang === "th"
              ? "เอกสารทั้งหมดถูกเก็บแบบ append-only เป็นเวลา 7 ปี — ดาวน์โหลด audit pack รวมไฟล์ PDF + บันทึกกิจกรรม + ลายเซ็นเป็นรายเดือนได้"
              : "All documents are stored append-only for 7 years — download a monthly audit pack with PDFs, activity logs, and signatures."}</p>
          </div>
          <Button variant="primary" icon="download">{lang === "th" ? "Audit pack" : "Audit pack"}</Button>
        </Card>
      )}
    </div>
  );
}

function ProgressDots({ steps, current, status }) {
  return (
    <div className="ttm-progress-dots">
      {steps.map((s, i) => {
        const done = ["submitted", "approved", "done"].includes(s.action);
        const prog = s.action === "in_progress";
        const rej = s.action === "rejected";
        return (
          <span
            key={i}
            className={cls("ttm-progress-dot",
              done && "is-done",
              prog && "is-progress",
              rej && "is-reject",
              i === current && status === "pending" && "is-current"
            )}
            title={s.role}
          />
        );
      })}
      <span className="ttm-progress-text">{steps.filter(s => ["submitted", "approved", "done"].includes(s.action)).length}/{steps.length}</span>
    </div>
  );
}
