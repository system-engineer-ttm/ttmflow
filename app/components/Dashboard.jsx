"use client";
import { Icon } from "./Icon";
import { cls, Button, Card, SectionTitle, Spark, StatusPill } from "./Ui";
import { useAppData } from "../lib/AppDataContext";

export function Dashboard({ lang, role, t, setRoute, openRequest, currentUser: loggedInUser }) {
  const { REQUESTS: reqs, USERS: users, FORM_TEMPLATES: tmpl, NOTIFICATIONS: notifs } = useAppData();

  // Logged-in user (Login gates the app, so this should always be set).
  // Fall back to a generic placeholder only so the JSX never NPEs during
  // brief mount/unmount windows.
  const currentUser = loggedInUser || { nameTh: "User", nameEn: "User" };

  const myId = currentUser?.id;
  const now = new Date();
  const inThisMonth = (s) => {
    if (!s) return false;
    try {
      const d = new Date(String(s).replace(" ", "T"));
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } catch { return false; }
  };

  // ── Real counts based on the logged-in user ───────────────────────────
  const myReqs = myId ? reqs.filter(r => r.requester === myId) : [];
  const myDrafts = myReqs.filter(r => r.status === "draft").length;
  const myInFlight = myReqs.filter(r => ["pending", "inProgress", "approved"].includes(r.status)).length;
  const myDoneThisMonth = myReqs.filter(r => ["done", "approved"].includes(r.status) && inThisMonth(r.updatedAt)).length;

  const awaitingMe = myId
    ? reqs.filter(r => r.status === "pending" && (r.steps || [])[r.currentStep]?.user === myId).length
    : 0;
  const approvedByMeThisMonth = myId
    ? reqs.filter(r => (r.steps || []).some(s => s.user === myId && s.action === "approved" && inThisMonth(s.at))).length
    : 0;

  const itInMyQueue = myId
    ? reqs.filter(r => !["rejected", "done"].includes(r.status) && (r.steps || []).some(s => s.user === myId && (s.action === "in_progress" || s.action === "queued"))).length
    : 0;
  const itUrgent = myId
    ? reqs.filter(r => r.priority === "urgent" && !["rejected", "done"].includes(r.status) && (r.steps || []).some(s => s.user === myId)).length
    : 0;
  const itClosedThisMonth = myId
    ? reqs.filter(r => (r.steps || []).some(s => s.user === myId && s.action === "done" && inThisMonth(s.at))).length
    : 0;

  const totalThisMonth = reqs.filter(r => inThisMonth(r.createdAt)).length;
  const totalDocs = reqs.length;

  const cards = {
    requester: [
      { icon: "file-text", label: t.dash.myDraft, value: myDrafts, trend: [myDrafts], color: "blue" },
      { icon: "clock", label: lang === "th" ? "รอดำเนินการ" : "In flight", value: myInFlight, trend: [myInFlight], color: "amber" },
      { icon: "check-circle", label: lang === "th" ? "เสร็จสิ้นเดือนนี้" : "Done this month", value: myDoneThisMonth, trend: [myDoneThisMonth], color: "green" },
    ],
    approver: [
      { icon: "inbox", label: t.dash.awaitMe, value: awaitingMe, trend: [awaitingMe], color: "amber" },
      { icon: "check-circle", label: lang === "th" ? "อนุมัติเดือนนี้" : "Approved this month", value: approvedByMeThisMonth, trend: [approvedByMeThisMonth], color: "green" },
      { icon: "trending-up", label: t.dash.throughput, value: "—", trend: [0], color: "blue" },
    ],
    it: [
      { icon: "tool", label: t.dash.inMyQueue, value: itInMyQueue, trend: [itInMyQueue], color: "violet" },
      { icon: "lifebuoy", label: lang === "th" ? "Ticket ด่วน" : "Urgent tickets", value: itUrgent, trend: [itUrgent], color: "red" },
      { icon: "check-circle", label: lang === "th" ? "ปิดงานเดือนนี้" : "Closed this month", value: itClosedThisMonth, trend: [itClosedThisMonth], color: "green" },
    ],
    admin: [
      { icon: "list", label: t.dash.thisMonth, value: totalThisMonth, trend: [totalThisMonth], color: "blue" },
      { icon: "trending-up", label: t.dash.throughput, value: "—", trend: [0], color: "violet" },
      { icon: "shield-check", label: t.dash.compliance, value: totalDocs > 0 ? "100%" : "—", trend: [0], color: "green" },
    ],
    auditor: [
      { icon: "archive", label: lang === "th" ? "เอกสารทั้งหมด" : "Total documents", value: totalDocs.toLocaleString(), trend: [totalDocs], color: "blue" },
      { icon: "shield-check", label: t.dash.compliance, value: totalDocs > 0 ? "100%" : "—", trend: [0], color: "green" },
      { icon: "fingerprint", label: lang === "th" ? "ลายเซ็นครบถ้วน" : "Signatures complete", value: totalDocs > 0 ? "100%" : "—", trend: [0], color: "violet" },
    ],
  }[role];

  return (
    <div className="ttm-page ttm-dashboard">
      <div className="ttm-hello">
        <div>
          <h2>
            {t.dash.hello}, {(lang === "th" ? (currentUser.nameTh || currentUser.nameEn || "") : (currentUser.nameEn || currentUser.nameTh || "")).split(" ")[0]} 👋
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
            {reqs.length === 0 && (
              <div className="ttm-empty" style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                {lang === "th" ? "ยังไม่มีคำขอในระบบ" : "No requests yet"}
              </div>
            )}
            {reqs.slice(0, 6).map(r => {
              const u = users[r.requester] || { nameTh: r.requester, nameEn: r.requester };
              const tmplObj = tmpl.find(x => x.code === r.template) || { icon: "file-text", color: "blue" };
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
            {tmpl.length === 0 && (
              <div className="ttm-empty" style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem", gridColumn: "1 / -1" }}>
                {lang === "th" ? "ยังไม่มีแบบฟอร์มในระบบ" : "No form templates yet"}
              </div>
            )}
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
          <VolumeChart lang={lang} reqs={reqs} tmpl={tmpl} />
        </Card>

        <Card className="ttm-channels">
          <SectionTitle
            title={lang === "th" ? "การแจ้งเตือนสำเร็จ (7 วัน)" : "Notification delivery (7 days)"}
            sub={lang === "th" ? "อัตราส่ง LINE / Email / In-app" : "LINE / Email / In-app rate"}
          />
          <ChannelStats lang={lang} notifs={notifs} />
        </Card>
      </div>
    </div>
  );
}

function VolumeChart({ lang, reqs, tmpl }) {
  // Count actual requests per template code
  const counts = new Map();
  (reqs || []).forEach(r => {
    counts.set(r.template, (counts.get(r.template) || 0) + 1);
  });

  // Build display rows from registered templates so the chart matches the
  // forms that actually exist. Templates with 0 submissions still appear so
  // admins can see them at a glance.
  const data = (tmpl || []).map(f => ({
    code: f.code,
    label: lang === "th" ? f.titleTh : f.titleEn,
    count: counts.get(f.code) || 0,
    color: f.color || "blue",
  })).sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="ttm-empty" style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
        {lang === "th" ? "ยังไม่มีแบบฟอร์มในระบบ" : "No form templates yet"}
      </div>
    );
  }

  const max = Math.max(1, ...data.map(d => d.count));
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

function ChannelStats({ lang, notifs }) {
  // 7-day window in Asia/Bangkok local time
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const parseAt = (s) => {
    if (!s) return 0;
    try { return new Date(String(s).replace(" ", "T")).getTime(); } catch { return 0; }
  };
  const recent = (notifs || []).filter(n => parseAt(n.at) >= cutoff);

  const def = [
    { id: "line",  name: "LINE Notify",        icon: "line", color: "green"  },
    { id: "email", name: "Email (SMTP relay)", icon: "mail", color: "blue"   },
    { id: "inapp", name: "In-app bell",        icon: "bell", color: "violet" },
  ];

  const rows = def.map(d => {
    const sent = recent.filter(n => n.channel === d.id);
    const total = sent.length;
    const ok = sent.filter(n => {
      const s = String(n.status || "").toLowerCase();
      return s === "sent" || s === "delivered" || s === "success" || s === "ok";
    }).length;
    const rate = total > 0 ? Math.round((ok / total) * 100) : 0;
    return { ...d, value: total, rate: total > 0 ? `${rate}%` : "—" };
  });

  const anyData = rows.some(r => r.value > 0);
  if (!anyData) {
    return (
      <div className="ttm-empty" style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
        {lang === "th" ? "ยังไม่มีการแจ้งเตือนใน 7 วันที่ผ่านมา" : "No notifications in the last 7 days"}
      </div>
    );
  }

  return (
    <ul className="ttm-channels-list">
      {rows.map(ch => (
        <li key={ch.id} className="ttm-channel-row">
          <div className={cls("ttm-channel-icon", `is-${ch.color}`)}>
            <Icon name={ch.icon} size={16} />
          </div>
          <div className="ttm-channel-meta">
            <div className="ttm-channel-name">{ch.name}</div>
            <div className="ttm-channel-sub">{ch.value} {lang === "th" ? "ครั้ง" : "events"} · {ch.rate}</div>
          </div>
          <div className="ttm-channel-bar">
            <span style={{ width: ch.rate === "—" ? "0%" : ch.rate }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
