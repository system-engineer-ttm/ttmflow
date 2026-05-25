"use client";
import { Icon } from "./Icon";
import { cls, Button, Card, SectionTitle, Spark, StatusPill } from "./Ui";
import { REQUESTS, USERS, FORM_TEMPLATES } from "../lib/data";

export function Dashboard({ lang, role, t, setRoute, openRequest }) {
  const reqs = REQUESTS;
  const users = USERS;
  const tmpl = FORM_TEMPLATES;

  const currentUser = {
    requester: users.REQ003, approver: users.APP001, it: users.IT001,
    admin: users.ADM001, auditor: users.AUD001,
  }[role];

  const cards = {
    requester: [
      { icon: "file-text", label: t.dash.myDraft, value: 2, trend: [2, 3, 1, 4, 2, 5, 2], color: "blue" },
      { icon: "clock", label: lang === "th" ? "รอดำเนินการ" : "In flight", value: 3, trend: [3, 2, 4, 3, 5, 4, 3], color: "amber" },
      { icon: "check-circle", label: lang === "th" ? "เสร็จสิ้นเดือนนี้" : "Done this month", value: 9, trend: [1, 3, 2, 4, 5, 7, 9], color: "green" },
    ],
    approver: [
      { icon: "inbox", label: t.dash.awaitMe, value: 4, trend: [2, 5, 4, 6, 3, 4, 4], color: "amber" },
      { icon: "check-circle", label: lang === "th" ? "อนุมัติเดือนนี้" : "Approved this month", value: 27, trend: [3, 6, 8, 12, 17, 22, 27], color: "green" },
      { icon: "trending-up", label: t.dash.throughput, value: "1.4 " + (lang === "th" ? "วัน" : "d"), trend: [3, 2, 2.5, 1.8, 1.7, 1.5, 1.4], color: "blue" },
    ],
    it: [
      { icon: "tool", label: t.dash.inMyQueue, value: 6, trend: [4, 5, 6, 5, 7, 6, 6], color: "violet" },
      { icon: "lifebuoy", label: lang === "th" ? "Ticket ด่วน" : "Urgent tickets", value: 1, trend: [0, 1, 0, 2, 1, 0, 1], color: "red" },
      { icon: "check-circle", label: lang === "th" ? "ปิดงานเดือนนี้" : "Closed this month", value: 41, trend: [5, 12, 18, 24, 30, 36, 41], color: "green" },
    ],
    admin: [
      { icon: "list", label: t.dash.thisMonth, value: 84, trend: [10, 22, 31, 44, 58, 71, 84], color: "blue" },
      { icon: "trending-up", label: t.dash.throughput, value: "1.6 " + (lang === "th" ? "วัน" : "d"), trend: [2.4, 2.1, 1.9, 1.8, 1.7, 1.6, 1.6], color: "violet" },
      { icon: "shield-check", label: t.dash.compliance, value: "98%", trend: [88, 91, 93, 94, 96, 97, 98], color: "green" },
    ],
    auditor: [
      { icon: "archive", label: lang === "th" ? "เอกสารทั้งหมด" : "Total documents", value: "1,284", trend: [820, 940, 1020, 1100, 1180, 1240, 1284], color: "blue" },
      { icon: "shield-check", label: t.dash.compliance, value: "98%", trend: [88, 91, 93, 94, 96, 97, 98], color: "green" },
      { icon: "fingerprint", label: lang === "th" ? "ลายเซ็นครบถ้วน" : "Signatures complete", value: "100%", trend: [98, 99, 100, 100, 100, 100, 100], color: "violet" },
    ],
  }[role];

  return (
    <div className="ttm-page ttm-dashboard">
      <div className="ttm-hello">
        <div>
          <h2>
            {t.dash.hello}, {lang === "th" ? currentUser.nameTh.split(" ")[0] : currentUser.nameEn.split(" ")[0]} 👋
          </h2>
          <p>{t.dash.welcome}</p>
        </div>
        {(role === "requester" || role === "approver" || role === "it") && (
          <Button variant="primary" icon="plus" onClick={() => setRoute("new")}>
            {t.nav.newRequest}
          </Button>
        )}
      </div>

      <div className="ttm-kpis">
        {cards.map((c, i) => (
          <Card key={i} className={`ttm-kpi ttm-kpi-${c.color}`}>
            <div className="ttm-kpi-head">
              <div className="ttm-kpi-icon"><Icon name={c.icon} size={18} /></div>
              <div className="ttm-kpi-label">{c.label}</div>
            </div>
            <div className="ttm-kpi-value">{c.value}</div>
            <Spark values={c.trend} w={160} h={36} color={`var(--c-${c.color})`} />
          </Card>
        ))}
      </div>

      <div className="ttm-dash-grid">
        <Card className="ttm-recent">
          <SectionTitle
            title={t.dash.recent}
            sub={lang === "th" ? "เคลื่อนไหวล่าสุดในระบบ" : "Latest activity in the system"}
            right={<button className="ttm-link" onClick={() => setRoute("archive")}>{t.dash.seeAll}</button>}
          />
          <div className="ttm-recent-list">
            {reqs.slice(0, 6).map(r => {
              const u = users[r.requester];
              const tmplObj = tmpl.find(x => x.code === r.template);
              return (
                <button key={r.id} className="ttm-recent-row" onClick={() => openRequest(r.id)}>
                  <div className={cls("ttm-recent-icon", `is-${tmplObj.color}`)}>
                    <Icon name={tmplObj.icon} size={16} />
                  </div>
                  <div className="ttm-recent-meta">
                    <div className="ttm-recent-title">{lang === "th" ? r.titleTh : r.titleEn}</div>
                    <div className="ttm-recent-sub">
                      <span className="ttm-mono">{r.id}</span>
                      <span> · </span>
                      <span>{lang === "th" ? u.nameTh : u.nameEn}</span>
                      <span> · </span>
                      <span>{r.updatedAt}</span>
                    </div>
                  </div>
                  <div className="ttm-recent-status">
                    <StatusPill status={r.status} lang={lang} />
                    <Icon name="chevron-right" size={14} className="ttm-muted" />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="ttm-quick">
          <SectionTitle title={t.dash.quickStart} sub={lang === "th" ? "แบบฟอร์มที่ใช้บ่อย" : "Frequently used forms"} />
          <div className="ttm-quick-grid">
            {tmpl.slice(0, 4).map(f => (
              <button key={f.code} className={cls("ttm-quick-card", `is-${f.color}`)} onClick={() => setRoute("new")}>
                <div className="ttm-quick-icon"><Icon name={f.icon} size={18} /></div>
                <div className="ttm-quick-meta">
                  <div className="ttm-quick-title">{lang === "th" ? f.titleTh : f.titleEn}</div>
                  <div className="ttm-quick-code">{f.code}</div>
                </div>
                <Icon name="arrow-right" size={14} className="ttm-quick-arrow" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="ttm-volume">
          <SectionTitle title={t.dash.byType} />
          <VolumeChart lang={lang} />
        </Card>

        <Card className="ttm-channels">
          <SectionTitle
            title={lang === "th" ? "การแจ้งเตือนสำเร็จ (7 วัน)" : "Notification delivery (7 days)"}
            sub={lang === "th" ? "อัตราส่ง Line / Email / In-app" : "Line / Email / In-app rate"}
          />
          <ul className="ttm-channels-list">
            {[
              { name: "LINE Notify", icon: "line", value: 312, rate: "99.7%", color: "green" },
              { name: "Email (SMTP relay)", icon: "mail", value: 268, rate: "100%", color: "blue" },
              { name: "In-app bell", icon: "bell", value: 124, rate: "100%", color: "violet" },
            ].map(ch => (
              <li key={ch.name} className="ttm-channel-row">
                <div className={cls("ttm-channel-icon", `is-${ch.color}`)}>
                  <Icon name={ch.icon} size={16} />
                </div>
                <div className="ttm-channel-meta">
                  <div className="ttm-channel-name">{ch.name}</div>
                  <div className="ttm-channel-sub">{ch.value} {lang === "th" ? "ครั้ง" : "events"} · {ch.rate}</div>
                </div>
                <div className="ttm-channel-bar">
                  <span style={{ width: ch.rate }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function VolumeChart({ lang }) {
  const data = [
    { code: "FM-IT-01-01", label: lang === "th" ? "ขอใช้ระบบ/อุปกรณ์" : "System/Equipment", count: 38, color: "blue" },
    { code: "FM-IT-01-11", label: lang === "th" ? "แจ้งซ่อม IT" : "IT Support", count: 27, color: "rose" },
    { code: "FM-IT-01-10", label: lang === "th" ? "ติดตั้งอุปกรณ์" : "Install Equipment", count: 11, color: "amber" },
    { code: "FM-HR-02-01", label: lang === "th" ? "ขอกำลังพล" : "Headcount Request", count: 8, color: "teal" },
    { code: "FM-IT-01-09", label: lang === "th" ? "จัดการคิว PBX" : "PBX Queues", count: 6, color: "violet" },
    { code: "FM-HR-02-03", label: lang === "th" ? "เปิดข้อมูลพนักงานใหม่" : "Onboarding (HR)", count: 4, color: "teal" },
    { code: "FM-SL-04-01", label: lang === "th" ? "เปิดโครงการใหม่ (Sales)" : "Project kickoff (Sales)", count: 3, color: "blue" },
    { code: "FM-FI-03-02", label: lang === "th" ? "ขอเบิกค่าใช้จ่าย" : "Expense (FI)", count: 3, color: "emerald" },
  ];
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="ttm-volume-rows">
      {data.map(d => (
        <div key={d.code} className="ttm-volume-row">
          <div className="ttm-volume-label">
            <span className="ttm-mono">{d.code}</span>
            <span className="ttm-volume-name">{d.label}</span>
          </div>
          <div className="ttm-volume-bar-track">
            <div className={cls("ttm-volume-bar", `is-${d.color}`)} style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <div className="ttm-volume-count">{d.count}</div>
        </div>
      ))}
    </div>
  );
}
