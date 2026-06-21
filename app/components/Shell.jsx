"use client";
import React from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { cls, Avatar } from "./Ui";
import { useAppData } from "../lib/AppDataContext";

export function Sidebar({ lang, route, setRoute, role, t, onLogout, currentUser }) {
  const { REQUESTS, FLOW_INSTANCES, PERMISSIONS } = useAppData();
  const reqs = REQUESTS;
  const myId = currentUser?.id;

  // ── My requests: where I am the requester ──
  const myCount = myId ? reqs.filter(r => r.requester === myId).length : 0;

  // ── Pending approvals: where I'm the assignee of the current step ──
  const pendingForMe = myId
    ? reqs.filter(r => {
        if (r.status !== "pending") return false;
        const cur = (r.steps || [])[r.currentStep];
        return cur?.user === myId;
      }).length
    : 0;

  // ── IT queue: tasks assigned to me, in progress or queued ──
  const itQ = myId
    ? reqs.filter(r => {
        if (["rejected", "done"].includes(r.status)) return false;
        return (r.steps || []).some(s => s.user === myId && (s.action === "in_progress" || s.action === "queued"));
      }).length
    : 0;

  // ── Active flows: where I am the requester ──
  const myFlows = myId
    ? FLOW_INSTANCES.filter(f => f.status === "active" && f.requester === myId).length
    : 0;

  const items = [
    { id: "dashboard",    icon: "home",        label: t.nav.dashboard },
    { id: "flows",        icon: "trending-up", label: t.nav.flows, count: myFlows },
    { id: "new",          icon: "plus",        label: t.nav.newRequest, accent: true },
    { id: "my",           icon: "list",        label: t.nav.myRequests, count: myCount },
    { id: "approvals",    icon: "check-circle",label: t.nav.approvals, count: pendingForMe },
    { id: "it",           icon: "tool",        label: t.nav.itQueue, count: itQ },
    { id: "archive",      icon: "archive",     label: t.nav.archive },
    { id: "notif",        icon: "log",         label: t.nav.notifications },
    { id: "caseSummary",  icon: "trending-up", label: t.nav.caseSummary },
    { id: "_divider",     divider: true },
    { id: "settings",     icon: "settings",    label: t.nav.settings },
    { id: "integrations", icon: "external",    label: t.nav.integrations },
    { id: "users",        icon: "users",       label: t.nav.users },
    { id: "secAware",     icon: "graduation-cap", label: t.nav.securityTraining },
  ];

  // Filter nav items using live PERMISSIONS from context — fall back to "allowed" for items not in the matrix
  const allowed = items.filter(it => {
    if (it.divider) return true;
    const perm = PERMISSIONS[it.id];
    if (!perm) return true;
    return perm[role] === true;
  });
  // Drop dividers that aren't sandwiched between two real items (avoids a
  // dangling separator for locked-down roles like ticketreport).
  const visible = allowed.filter((it, i) => {
    if (!it.divider) return true;
    const prevReal = allowed.slice(0, i).some(x => !x.divider);
    const nextReal = allowed.slice(i + 1).some(x => !x.divider);
    return prevReal && nextReal;
  });

  return (
    <aside className="ttm-sidebar">
      <div className="ttm-sidebar-head">
        <div className="ttm-logo">
          <Image src="/assets/logo.jpg" alt="Talk to Me" width={40} height={40} />
        </div>
        <div className="ttm-brand">
          <div className="ttm-brand-name">{t.appName}</div>
          <div className="ttm-brand-sub">{t.appSub}</div>
        </div>
      </div>

      <nav className="ttm-nav">
        {visible.map(it => (
          it.divider ? (
            <div key={it.id} className="ttm-nav-divider" />
          ) : (
            <button
              key={it.id}
              className={cls("ttm-nav-item", route === it.id && "is-active", it.accent && "is-accent")}
              onClick={() => setRoute(it.id)}
            >
              <Icon name={it.icon} size={18} />
              <span className="ttm-nav-label">{it.label}</span>
              {it.count != null && it.count > 0 && (
                <span className={cls("ttm-nav-count", it.id === "approvals" && "is-warn")}>{it.count}</span>
              )}
            </button>
          )
        ))}
      </nav>

      <div className="ttm-sidebar-foot">
        <div className="ttm-iso-card">
          <div className="ttm-iso-mark">
            <Icon name="shield-check" size={18} />
          </div>
          <div>
            <div className="ttm-iso-title">ISO 9001:2015</div>
            <div className="ttm-iso-sub">{lang === "th" ? "พร้อมตรวจรับรอง" : "Audit ready"}</div>
          </div>
        </div>
        {onLogout && (
          <button className="ttm-sidebar-logout" onClick={onLogout}>
            <Icon name="log-out" size={15} />
            {lang === "th" ? "ออกจากระบบ" : "Sign out"}
          </button>
        )}
      </div>
    </aside>
  );
}

export function Topbar({ lang, setLang, role, setRole, route, setRoute, t, currentUser: loggedInUser, onOpenProfile }) {
  const [notifOpen, setNotifOpen] = React.useState(false);
  // Use the real logged-in user if provided, otherwise fall back to role-based demo user
  const currentUser = loggedInUser ?? {
    requester: USERS.REQ003,
    approver: USERS.APP001,
    it: USERS.IT001,
    admin: USERS.ADM001,
    auditor: USERS.AUD001,
  }[role];

  const titleMap = {
    dashboard: t.nav.dashboard,
    flows: t.nav.flows,
    flowDetail: lang === "th" ? "รายละเอียด Flow" : "Flow detail",
    flowStart: lang === "th" ? "เริ่ม Flow ใหม่" : "Start new Flow",
    flowBuilder: lang === "th" ? "สร้าง Flow Template" : "Create Flow Template",
    new: t.nav.newRequest, my: t.nav.myRequests,
    approvals: t.nav.approvals, it: t.nav.itQueue, archive: t.nav.archive,
    notif: t.nav.notifications, settings: t.nav.settings, integrations: t.nav.integrations,
    users: t.nav.users,
    secAware: t.nav.securityTraining,
    fill: t.nav.newRequest,
    templateBuilder: lang === "th" ? "สร้างฟอร์มใหม่" : "Create new form",
    submitted: lang === "th" ? "ส่งสำเร็จ" : "Submitted",
    request: lang === "th" ? "รายละเอียดคำขอ" : "Request detail",
  };

  return (
    <header className="ttm-topbar">
      <div className="ttm-topbar-row ttm-topbar-row-main">
        <h1 className="ttm-page-title">{titleMap[route] || ""}</h1>
        <div className="ttm-search">
          <Icon name="search" size={16} />
          <input placeholder={t.common.search + " " + (lang === "th" ? "(เลขที่เอกสาร, ชื่อ, Ticket)" : "(doc no., name, ticket)")} />
          <span className="ttm-kbd">⌘K</span>
        </div>

        <div className="ttm-topbar-actions">
          <button className="ttm-lang" onClick={() => setLang(lang === "th" ? "en" : "th")} title="Switch language">
            <Icon name="language" size={15} />
            <span>{lang === "th" ? "TH" : "EN"}</span>
          </button>

          <button className="ttm-icon-btn ttm-notif" onClick={() => setNotifOpen(v => !v)} title="Notifications">
            <Icon name="bell-dot" size={18} />
          </button>
          {notifOpen && <NotifPopover lang={lang} onClose={() => setNotifOpen(false)} onJump={() => { setRoute("notif"); setNotifOpen(false); }} />}

          <button
            className="ttm-user-chip"
            onClick={() => onOpenProfile?.()}
            title={lang === "th" ? "โปรไฟล์ของฉัน" : "My profile"}
          >
            <Avatar user={currentUser} size={30} />
            <div className="ttm-user-meta">
              <div className="ttm-user-name">{lang === "th" ? currentUser.nameTh : currentUser.nameEn}</div>
              <div className="ttm-user-title">{lang === "th" ? currentUser.titleTh : currentUser.titleEn}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Role-preview switcher — Admin only */}
      {loggedInUser?.role === "admin" && (
        <div className="ttm-topbar-row ttm-topbar-row-roles">
          <span className="ttm-role-label">{lang === "th" ? "ดูในมุมมอง" : "View as"}</span>
          <div className="ttm-role-pills">
            {[
              { id: "requester", icon: "user",        label: lang === "th" ? "พนักงาน" : "Employee" },
              { id: "approver",  icon: "check-circle", label: lang === "th" ? "ผู้อนุมัติ" : "Approver" },
              { id: "it",        icon: "tool",         label: lang === "th" ? "ผู้รับงาน" : "Assignee" },
              { id: "admin",     icon: "shield-check", label: "Admin / QMR" },
              { id: "auditor",   icon: "fingerprint",  label: "Auditor" },
            ].map(r => (
              <button
                key={r.id}
                className={cls("ttm-role-pill", role === r.id && "is-active")}
                onClick={() => { setRole(r.id); setRoute("dashboard"); }}
              >
                <Icon name={r.icon} size={13} />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function NotifPopover({ lang, onClose, onJump }) {
  const { NOTIFICATIONS } = useAppData();
  const items = NOTIFICATIONS.slice(0, 5);
  return (
    <>
      <div className="ttm-popover-scrim" onClick={onClose} />
      <div className="ttm-popover ttm-notif-popover">
        <div className="ttm-popover-head">
          <strong>{lang === "th" ? "การแจ้งเตือนล่าสุด" : "Latest notifications"}</strong>
          <button className="ttm-link" onClick={onJump}>{lang === "th" ? "ดูทั้งหมด" : "View all"}</button>
        </div>
        <ul className="ttm-notif-list">
          {items.map(n => (
            <li key={n.id} className="ttm-notif-item">
              <div className={cls("ttm-notif-chip", `is-${n.channel}`)}>
                <Icon name={n.channel === "line" ? "line" : n.channel === "email" ? "mail" : "bell"} size={14} />
              </div>
              <div className="ttm-notif-meta">
                <div className="ttm-notif-subject">{n.subject}</div>
                <div className="ttm-notif-sub">{n.to} · {n.at}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
