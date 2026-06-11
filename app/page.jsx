"use client";
import React from "react";
import { i18n } from "./lib/data";
import { AppDataProvider, useAppData } from "./lib/AppDataContext";
import { Icon } from "./components/Icon";
import { cls } from "./components/Ui";
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect } from "./components/TweaksPanel";
import { Sidebar, Topbar } from "./components/Shell";
import { Dashboard } from "./components/Dashboard";
import { FormsList } from "./components/FormsList";
import { FormFill } from "./components/FormFill";
import { RequestDetail } from "./components/Approve";
import { RequestsList } from "./components/RequestsList";
import { NotificationsLog, Settings } from "./components/Notifications";
import { FlowsPage, FlowDetail, FlowPicker } from "./components/Flows";
import { Integrations } from "./components/Integrations";
import { TemplateBuilder } from "./components/TemplateBuilder";
import { FlowBuilder } from "./components/FlowBuilder";
import { Submitted } from "./components/Submitted";
import { Login } from "./components/Login";
import { UserManagement } from "./components/UserManagement";
import { SignatureSetup } from "./components/SignatureSetup";
import { CaseSummary } from "./components/CaseSummary";
import { ProfileModal } from "./components/Profile";

const TWEAK_DEFAULTS = {
  lang: "th",
  role: "requester",
  theme: "light",
  density: "comfortable",
  accent: "blue",
};

const ACCENT_PALETTES = {
  blue:   { brand: "#1f6feb", brandDark: "#1d4ed8", brandSoft: "#e7f0ff", ring: "rgba(31,111,235,0.18)" },
  indigo: { brand: "#5b59f0", brandDark: "#4338ca", brandSoft: "#ecebff", ring: "rgba(91,89,240,0.18)" },
  teal:   { brand: "#0d9488", brandDark: "#0f766e", brandSoft: "#dbf5f0", ring: "rgba(13,148,136,0.18)" },
  rose:   { brand: "#e11d48", brandDark: "#be123c", brandSoft: "#ffe4ec", ring: "rgba(225,29,72,0.18)" },
};

export default function App() {
  return (
    <AppDataProvider enabled={true}>
      <AppShell />
    </AppDataProvider>
  );
}

function AppShell() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const lang = t.lang;
  const tt = i18n[lang];
  const data = useAppData();

  // Landing route for a role — uses live permissions from context
  const homeForRole = React.useCallback((r) => {
    const order = ["dashboard", "caseSummary", "my", "approvals", "it", "archive", "notif", "settings", "integrations", "users", "flows"];
    return order.find(route => data.PERMISSIONS[route]?.[r] === true) || "dashboard";
  }, [data.PERMISSIONS]);

  // ── Auth state ───────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = React.useState(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [editingSignature, setEditingSignature] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  // Restore session from httpOnly cookie on mount
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(({ user }) => {
        if (user) {
          setCurrentUser(user);
          setTweak("role", user.role);
          setRoute(homeForRole(user.role));
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a user logs in, reload data (including permissions) then navigate
  const handleLogin = async (user) => {
    setCurrentUser(user);
    setTweak("role", user.role);
    await data.reload();
    setRoute(homeForRole(user.role));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    setRoute("dashboard");
    setFormCode(null);
    setReqId(null);
    setFlowId(null);
    setSubmittedDoc(null);
  };

  // Effective role — admin can preview other roles via TweaksPanel; others are locked
  const role = currentUser
    ? (currentUser.role === "admin" ? t.role : currentUser.role)
    : t.role;

  // ── Routing ─────────────────────────────────────────────────────────────
  const [route, setRoute] = React.useState("dashboard");
  const [formCode, setFormCode] = React.useState(null);
  const [reqId, setReqId] = React.useState(null);
  const [flowId, setFlowId] = React.useState(null);
  const [submittedDoc, setSubmittedDoc] = React.useState(null);

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = t.theme;
    root.dataset.density = t.density;
    const a = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES.blue;
    root.style.setProperty("--brand", a.brand);
    root.style.setProperty("--brand-dark", a.brandDark);
    root.style.setProperty("--brand-soft", a.brandSoft);
    root.style.setProperty("--ring", a.ring);
  }, [t.theme, t.density, t.accent]);

  // Route guard — uses live permissions from context
  const canAccess = (r) => {
    const perm = data.PERMISSIONS[r];
    if (!perm) return true;
    return perm[role] === true;
  };

  const openForm = (code) => { setFormCode(code); setRoute("fill"); };
  const openRequest = (id) => { setReqId(id); setRoute("request"); };
  const openFlow = (id) => { setFlowId(id); setRoute("flowDetail"); };

  const setRouteWithReset = (r) => {
    const target = canAccess(r) ? r : homeForRole(role);
    setRoute(target);
    if (target !== "fill") setFormCode(null);
    if (target !== "request") setReqId(null);
    if (target !== "flowDetail") setFlowId(null);
    if (target !== "submitted") setSubmittedDoc(null);
  };

  // ── Show loading spinner while checking session ──────────────────────────
  if (!authChecked) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", flexDirection:"column", gap:"1rem" }}>
        <div style={{ width:40, height:40, border:"3px solid var(--border)", borderTopColor:"var(--brand)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <div style={{ color:"var(--muted)", fontSize:"0.875rem" }}>TTMFlow กำลังโหลด…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Show Login if not authenticated ─────────────────────────────────────
  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} />
        {/* Keep TweaksPanel accessible on login page for theme/accent */}
        <TweaksPanel title="Tweaks">
          <TweakSection title={lang === "th" ? "ธีม" : "Theme"}>
            <TweakRadio value={t.theme} onChange={v => setTweak("theme", v)}
              options={[{ value: "light", label: lang === "th" ? "สว่าง" : "Light" }, { value: "dark", label: "Dark" }]} />
          </TweakSection>
          <TweakSection title={lang === "th" ? "สีหลัก" : "Accent color"}>
            <div className="ttm-accent-row">
              {Object.entries(ACCENT_PALETTES).map(([k, v]) => (
                <button key={k} className={cls("ttm-accent-chip", t.accent === k && "is-active")}
                  onClick={() => setTweak("accent", k)} style={{ background: v.brand }} title={k}>
                  {t.accent === k && <Icon name="check" size={14} stroke={2.5} />}
                </button>
              ))}
            </div>
          </TweakSection>
        </TweaksPanel>
      </>
    );
  }

  // Helpers that hit the API + refresh local cache
  const startNewFlow = async (tplId, title) => {
    const tpl = data.FLOW_TEMPLATES.find(tp => tp.id === tplId);
    const stepStates = (tpl?.steps ?? []).map((s, i) => ({
      stepId: s.id, reqIds: [], status: i === 0 ? "inProgress" : "pending",
    }));
    const r = await fetch("/api/flows/instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: tplId, titleTh: title, titleEn: title, stepStates, status: "active", currentStepIdx: 0 }),
    });
    const inst = await r.json().catch(() => null);
    await data.refreshFlowInstances();
    if (inst?.id) {
      setFlowId(inst.id);
      setRouteWithReset("flowDetail");
    } else {
      setRouteWithReset("flows");
    }
  };

  const saveFlowTemplate = async (flow) => {
    await fetch("/api/flows/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flow),
    });
    await data.refreshFlowTemplates();
    setRouteWithReset("flows");
  };

  const saveFormTemplate = async (tpl) => {
    const payload = {
      code: tpl.code, icon: tpl.icon, color: tpl.color, category: tpl.category,
      titleTh: tpl.titleTh, titleEn: tpl.titleEn || tpl.titleTh,
      descTh: tpl.descTh || "", descEn: tpl.descEn || tpl.descTh || "",
      approvers: (tpl.approvers || []).map(a => a.roleTh || a),
      sections: tpl.sections || [],
      avgDays: tpl.avgDays || 1.5,
    };
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await data.refreshForms();
    setRouteWithReset("settings");
  };

  // ── Screens ──────────────────────────────────────────────────────────────
  let screen;
  if (route === "dashboard")
    screen = <Dashboard lang={lang} role={role} t={tt} setRoute={setRouteWithReset} openRequest={openRequest} currentUser={currentUser} />;
  else if (route === "flows")
    screen = <FlowsPage lang={lang} t={tt} openFlow={openFlow} startFlow={() => setRouteWithReset("flowStart")}
      openFlowBuilder={role === "admin" ? () => setRouteWithReset("flowBuilder") : null} />;
  else if (route === "flowDetail")
    screen = <FlowDetail lang={lang} t={tt} flowId={flowId} back={() => setRouteWithReset("flows")} openRequest={openRequest} openForm={openForm} />;
  else if (route === "flowStart")
    screen = <FlowPicker lang={lang} t={tt} back={() => setRouteWithReset("flows")} onStart={startNewFlow} />;
  else if (route === "flowBuilder")
    screen = <FlowBuilder lang={lang} back={() => setRouteWithReset("flows")} onSave={saveFlowTemplate} />;
  else if (route === "new")
    screen = <FormsList lang={lang} t={tt} openForm={openForm} />;
  else if (route === "fill")
    screen = <FormFill lang={lang} t={tt} code={formCode || "FM-IT-01-01"} back={() => setRouteWithReset("new")}
      currentUser={currentUser}
      onSubmitted={(doc) => { setSubmittedDoc(doc); setRoute("submitted"); data.refreshRequests(); }} />;
  else if (route === "submitted")
    screen = <Submitted lang={lang} t={tt} docNo={submittedDoc} back={() => setRouteWithReset("my")} />;
  else if (route === "my")
    screen = <RequestsList lang={lang} t={tt} role={role} scope="my" openRequest={openRequest} currentUser={currentUser} />;
  else if (route === "approvals")
    screen = <RequestsList lang={lang} t={tt} role={role} scope="approvals" openRequest={openRequest} currentUser={currentUser} />;
  else if (route === "it")
    screen = <RequestsList lang={lang} t={tt} role={role} scope="it" openRequest={openRequest} currentUser={currentUser} />;
  else if (route === "archive")
    screen = <RequestsList lang={lang} t={tt} role={role} scope="archive" openRequest={openRequest} currentUser={currentUser} />;
  else if (route === "request")
    screen = <RequestDetail lang={lang} t={tt} reqId={reqId} role={role} back={() => setRouteWithReset("approvals")}
      openRequest={openRequest} openFlow={openFlow} currentUser={currentUser} />;
  else if (route === "notif")
    screen = <NotificationsLog lang={lang} t={tt} />;
  else if (route === "integrations")
    screen = <Integrations lang={lang} t={tt} />;
  else if (route === "settings")
    screen = <Settings lang={lang} t={tt} setRoute={setRouteWithReset} />;
  else if (route === "templateBuilder")
    screen = <TemplateBuilder lang={lang} t={tt} back={() => setRouteWithReset("settings")} onSave={saveFormTemplate} />;
  else if (route === "users")
    screen = <UserManagement lang={lang} currentUser={currentUser} />;
  else if (route === "caseSummary")
    screen = <CaseSummary lang={lang} />;
  else
    screen = <Dashboard lang={lang} role={role} t={tt} setRoute={setRouteWithReset} openRequest={openRequest} currentUser={currentUser} />;

  // Block app behind SignatureSetup if user has no signature on file.
  // Check signature directly (not the boolean flag) so the gate releases as
  // soon as the field is populated. Report-only roles (ticketreport, auditor)
  // never sign documents, so they're exempt from the signature gate.
  const SIGN_EXEMPT_ROLES = ["ticketreport", "auditor"];
  const needsSignature = !!currentUser
    && !currentUser.signature
    && !SIGN_EXEMPT_ROLES.includes(currentUser.role);
  const handleSignatureSaved = (sig) => {
    setCurrentUser(prev => prev ? { ...prev, signature: sig, hasSignature: true } : prev);
    setEditingSignature(false);
  };

  return (
    <div className={cls("ttm-app", `theme-${t.theme}`, `density-${t.density}`)}>
      {(needsSignature || editingSignature) && (
        <SignatureSetup
          lang={lang}
          currentUser={currentUser}
          dismissible={!needsSignature}
          onSkip={() => setEditingSignature(false)}
          onSaved={handleSignatureSaved}
        />
      )}
      {profileOpen && currentUser && (
        <ProfileModal
          lang={lang}
          currentUser={currentUser}
          onClose={() => setProfileOpen(false)}
          onUpdated={(updated) => setCurrentUser(prev => prev ? { ...prev, ...updated } : prev)}
        />
      )}
      <Sidebar
        lang={lang} route={route} setRoute={setRouteWithReset} role={role} t={tt}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <div className="ttm-main">
        <Topbar
          lang={lang} setLang={(v) => setTweak("lang", v)}
          role={role} setRole={(v) => setTweak("role", v)}
          route={route} setRoute={setRouteWithReset} t={tt}
          currentUser={currentUser}
          onOpenProfile={() => setProfileOpen(true)}
        />
        <main className="ttm-content" data-screen-label={route}>
          {screen}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection title={lang === "th" ? "ภาษา" : "Language"}>
          <TweakRadio value={t.lang} onChange={v => setTweak("lang", v)}
            options={[{ value: "th", label: "ไทย" }, { value: "en", label: "EN" }]} />
        </TweakSection>

        {/* Role switcher — Admin only (for previewing other role views) */}
        {currentUser?.role === "admin" && (
          <TweakSection title={lang === "th" ? "ดูในมุมมอง (Admin)" : "Preview as (Admin)"}>
            <TweakSelect value={t.role} onChange={v => { setTweak("role", v); setRoute(homeForRole(v)); }}
              options={[
                { value: "requester",    label: lang === "th" ? "พนักงาน (Requester)" : "Employee" },
                { value: "approver",     label: lang === "th" ? "ผู้อนุมัติ" : "Approver" },
                { value: "it",           label: lang === "th" ? "ทีม IT" : "IT Staff" },
                { value: "admin",        label: "Admin / QMR" },
                { value: "auditor",      label: "Auditor" },
                { value: "ticketreport", label: lang === "th" ? "รายงาน Ticket" : "Ticket Report" },
              ]} />
          </TweakSection>
        )}

        <TweakSection title={lang === "th" ? "ธีม" : "Theme"}>
          <TweakRadio value={t.theme} onChange={v => setTweak("theme", v)}
            options={[{ value: "light", label: lang === "th" ? "สว่าง" : "Light" }, { value: "dark", label: "Dark" }]} />
        </TweakSection>

        <TweakSection title={lang === "th" ? "ความหนาแน่น" : "Density"}>
          <TweakRadio value={t.density} onChange={v => setTweak("density", v)}
            options={[{ value: "comfortable", label: lang === "th" ? "สบายตา" : "Comfortable" }, { value: "compact", label: lang === "th" ? "แน่น" : "Compact" }]} />
        </TweakSection>

        <TweakSection title={lang === "th" ? "สีหลัก" : "Accent color"}>
          <div className="ttm-accent-row">
            {Object.entries(ACCENT_PALETTES).map(([k, v]) => (
              <button key={k} className={cls("ttm-accent-chip", t.accent === k && "is-active")}
                onClick={() => setTweak("accent", k)} style={{ background: v.brand }} title={k}>
                {t.accent === k && <Icon name="check" size={14} stroke={2.5} />}
              </button>
            ))}
          </div>
        </TweakSection>

        {/* Logged-in user info */}
        {currentUser && (
          <TweakSection title={lang === "th" ? "เข้าสู่ระบบโดย" : "Signed in as"}>
            <div style={{ fontSize:"0.8rem", lineHeight:1.6 }}>
              <div style={{ fontWeight:600 }}>{lang === "th" ? currentUser.nameTh : currentUser.nameEn}</div>
              <div style={{ color:"var(--muted)" }}>{currentUser.username} · {currentUser.role}</div>
            </div>
          </TweakSection>
        )}

        {/* Signature management */}
        {currentUser && (
          <TweakSection title={lang === "th" ? "ลายเซ็นของฉัน" : "My signature"}>
            <SignaturePreview lang={lang} currentUser={currentUser} onEdit={() => setEditingSignature(true)} />
          </TweakSection>
        )}
      </TweaksPanel>
    </div>
  );
}

function SignaturePreview({ lang, currentUser, onEdit }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.78rem" }}>
      {currentUser.signature ? (
        <>
          <div style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 60,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUser.signature} alt="signature"
              style={{ maxHeight: 50, maxWidth: "100%", objectFit: "contain" }} />
          </div>
          <button
            className="ttm-link"
            style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={onEdit}
          >
            <Icon name="edit" size={11} /> {lang === "th" ? "เปลี่ยนลายเซ็น" : "Update signature"}
          </button>
        </>
      ) : (
        <button
          className="ttm-link"
          onClick={onEdit}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <Icon name="signature" size={12} /> {lang === "th" ? "ตั้งลายเซ็น" : "Set up signature"}
        </button>
      )}
    </div>
  );
}
