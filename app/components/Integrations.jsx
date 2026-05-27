"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Badge, Button, Card, Field, IconButton, Input, SectionTitle, Select, Switch, Tabs, Textarea } from "./Ui";

const DEFAULTS = {
  line: { botName: "TTMFlow Bot", accessToken: "", groups: [] },
  email: { provider: "m365", host: "smtp.office365.com", port: "587", encryption: "starttls", username: "", password: "", fromAddress: "no-reply@example.com", displayName: "TTMFlow", replyTo: "" },
  inapp: { bellEnabled: true, browserPush: true, sound: false, desktopOS: true, retention: "90d", afterRead: "archive" },
  webhook: { endpoints: [] },
};

export function Integrations({ lang, t }) {
  const [tab, setTab] = React.useState("line");
  const [config, setConfig] = React.useState(DEFAULTS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState("");

  React.useEffect(() => {
    fetch("/api/integrations")
      .then(r => r.json())
      .then(data => {
        // Merge with defaults so missing keys don't crash inputs
        setConfig({
          line:    { ...DEFAULTS.line,    ...(data.line    || {}) },
          email:   { ...DEFAULTS.email,   ...(data.email   || {}) },
          inapp:   { ...DEFAULTS.inapp,   ...(data.inapp   || {}) },
          webhook: { ...DEFAULTS.webhook, ...(data.webhook || {}) },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateChannel = (ch, patch) => setConfig(p => ({ ...p, [ch]: { ...p[ch], ...patch } }));

  const save = async () => {
    setSaving(true); setSavedMsg("");
    try {
      const res = await fetch("/api/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSavedMsg("❌ " + (err.error || "บันทึกไม่สำเร็จ"));
      } else {
        setSavedMsg(lang === "th" ? "✓ บันทึกแล้ว" : "✓ Saved");
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch (e) {
      setSavedMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = (which) => {
    alert(lang === "th"
      ? `กำลังทดสอบการเชื่อมต่อ ${which}... (โหมดสาธิต — ยังไม่ได้เชื่อม API จริง)`
      : `Testing ${which} connection... (demo mode — no real API yet)`);
  };

  const tabs = [
    { id: "line", label: "LINE", icon: "line" },
    { id: "email", label: "Email (SMTP)", icon: "mail" },
    { id: "inapp", label: lang === "th" ? "ในแอป" : "In-app", icon: "bell" },
    { id: "webhook", label: "Webhook / Slack", icon: "external" },
  ];

  return (
    <div className="ttm-page ttm-integrations-page">
      <div className="ttm-list-head">
        <div>
          <h2>{t.nav.integrations}</h2>
          <p>{lang === "th" ? "ตั้งค่าและตรวจสอบสถานะการเชื่อมต่อช่องทางแจ้งเตือน — LINE, Email, In-app, Webhook" : "Configure notification channel connections — LINE, Email, In-app, Webhook"}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {savedMsg && <span style={{ color: savedMsg.startsWith("✓") ? "var(--c-green)" : "var(--c-red)", fontSize: "0.85rem" }}>{savedMsg}</span>}
          <Button variant="primary" icon="check" onClick={save} disabled={saving || loading}>
            {saving ? (lang === "th" ? "กำลังบันทึก..." : "Saving...") : (lang === "th" ? "บันทึกการตั้งค่า" : "Save settings")}
          </Button>
        </div>
      </div>

      <ConnectionsSummary lang={lang} config={config} />

      <Tabs value={tab} onChange={setTab} items={tabs} />

      {loading ? (
        <Card><div className="ttm-empty" style={{ padding: 40 }}>{lang === "th" ? "กำลังโหลด..." : "Loading..."}</div></Card>
      ) : (
        <>
          {tab === "line" && <LineIntegration lang={lang} cfg={config.line} update={p => updateChannel("line", p)} onTest={() => testConnection("LINE")} />}
          {tab === "email" && <EmailIntegration lang={lang} cfg={config.email} update={p => updateChannel("email", p)} onTest={() => testConnection("Email")} />}
          {tab === "inapp" && <InAppIntegration lang={lang} cfg={config.inapp} update={p => updateChannel("inapp", p)} />}
          {tab === "webhook" && <WebhookIntegration lang={lang} cfg={config.webhook} update={p => updateChannel("webhook", p)} />}
        </>
      )}
    </div>
  );
}

function ConnectionsSummary({ lang, config }) {
  const items = [
    { id: "line", label: "LINE", connected: !!(config.line?.accessToken), icon: "line", color: "green", value: (config.line?.groups?.length || 0) + " " + (lang === "th" ? "กลุ่ม" : "groups") },
    { id: "email", label: "Email (SMTP)", connected: !!(config.email?.host), icon: "mail", color: "blue", value: config.email?.host || (lang === "th" ? "ยังไม่ตั้งค่า" : "Not set") },
    { id: "inapp", label: lang === "th" ? "ในแอป" : "In-app", connected: config.inapp?.bellEnabled !== false, icon: "bell", color: "violet", value: lang === "th" ? "เปิดใช้งาน" : "Active" },
    { id: "webhook", label: "Webhook", connected: (config.webhook?.endpoints?.length || 0) > 0, icon: "external", color: "neutral", value: (config.webhook?.endpoints?.length || 0) + " endpoints" },
  ];
  return (
    <div className="ttm-conn-summary">
      {items.map(c => (
        <Card key={c.id} className={cls("ttm-conn-card", c.connected && "is-on", `is-${c.color}`)}>
          <div className="ttm-conn-card-head">
            <div className={cls("ttm-conn-card-icon", `is-${c.color}`)}><Icon name={c.icon} size={16} /></div>
            <strong>{c.label}</strong>
            <Badge kind={c.connected ? "green" : "neutral"} dot>{c.connected ? (lang === "th" ? "เชื่อมต่อแล้ว" : "Connected") : (lang === "th" ? "ยังไม่เชื่อม" : "Not connected")}</Badge>
          </div>
          <div className="ttm-conn-card-value">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}

/* ── LINE ────────────────────────────────────────────────── */
function LineIntegration({ lang, cfg, update, onTest }) {
  const groups = cfg.groups || [];
  const setGroups = (g) => update({ groups: g });
  const addGroup = () => setGroups([...groups, { id: `g${Date.now()}`, name: "", lineId: "", purpose: "" }]);
  const updateGroup = (i, patch) => setGroups(groups.map((g, idx) => idx === i ? { ...g, ...patch } : g));
  const removeGroup = (i) => setGroups(groups.filter((_, idx) => idx !== i));

  return (
    <>
      <Card>
        <SectionTitle
          title={lang === "th" ? "LINE Bot — ข้อมูลการเชื่อมต่อ" : "LINE Bot — connection"}
          sub={lang === "th" ? "นำ Channel Access Token จาก LINE Developers Console มาวาง" : "Paste credentials from LINE Developers Console"}
        />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "ชื่อ Bot (อ้างอิงภายใน)" : "Bot name (internal)"} span={1}>
            <Input value={cfg.botName || ""} onChange={e => update({ botName: e.target.value })} placeholder="TTMFlow Bot" />
          </Field>
          <Field label="Channel ID" span={1}>
            <Input className="ttm-mono" value={cfg.channelId || ""} onChange={e => update({ channelId: e.target.value })} placeholder="1234567890" />
          </Field>
          <Field label="Channel Secret" span={1}>
            <Input type="password" className="ttm-mono" value={cfg.channelSecret || ""} onChange={e => update({ channelSecret: e.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="Channel Access Token" span={3} hint={lang === "th" ? "Long-lived token จาก Messaging API" : "Long-lived token from Messaging API"}>
            <Input type="password" className="ttm-mono" value={cfg.accessToken || ""} onChange={e => update({ accessToken: e.target.value })} placeholder="••••••••••••••••" />
          </Field>
          <Field label="Webhook URL" span={3} hint={lang === "th" ? "นำ URL นี้ไปวางใน Webhook settings ของ LINE Channel" : "Paste this URL into LINE Channel's Webhook settings"}>
            <div className="ttm-copy-row">
              <Input className="ttm-mono" value={typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/line` : "/api/webhooks/line"} readOnly />
              <Button variant="ghost" size="sm" icon="check" onClick={async () => {
                const u = typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/line` : "/api/webhooks/line";
                try { await navigator.clipboard.writeText(u); alert(lang === "th" ? "คัดลอกแล้ว" : "Copied!"); } catch {}
              }}>{lang === "th" ? "คัดลอก" : "Copy"}</Button>
            </div>
          </Field>
        </div>
        <div className="ttm-form-actions" style={{ position: "static", boxShadow: "none", marginTop: 14, border: 0, background: "transparent" }}>
          <Button variant="ghost" icon="external" onClick={onTest}>{lang === "th" ? "ทดสอบการเชื่อมต่อ" : "Test connection"}</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title={lang === "th" ? "กลุ่ม LINE ที่ลงทะเบียน" : "Registered LINE groups"}
          sub={lang === "th" ? "ระบบจะส่งข้อความเข้ากลุ่มเมื่อมีคำขอที่เกี่ยวข้อง" : "Bot will post messages into these groups when relevant requests fire"}
          right={<Button variant="secondary" size="sm" icon="plus" onClick={addGroup}>{lang === "th" ? "เพิ่มกลุ่ม" : "Add group"}</Button>}
        />
        {groups.length === 0 ? (
          <div className="ttm-empty" style={{ padding: 24 }}>{lang === "th" ? "ยังไม่มีกลุ่มลงทะเบียน" : "No groups registered"}</div>
        ) : (
          <div className="ttm-conn-list">
            {groups.map((g, i) => (
              <div key={g.id || i} className="ttm-conn-row" style={{ alignItems: "flex-start" }}>
                <div className="ttm-conn-row-icon is-line"><Icon name="users" size={16} /></div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8 }}>
                  <Input placeholder={lang === "th" ? "ชื่อกลุ่ม" : "Group name"} value={g.name || ""} onChange={e => updateGroup(i, { name: e.target.value })} />
                  <Input className="ttm-mono" placeholder="C1abc...d4f2" value={g.lineId || ""} onChange={e => updateGroup(i, { lineId: e.target.value })} />
                  <Input placeholder={lang === "th" ? "วัตถุประสงค์ / ทริกเกอร์" : "Purpose / trigger"} value={g.purpose || ""} onChange={e => updateGroup(i, { purpose: e.target.value })} />
                </div>
                <IconButton icon="trash" onClick={() => removeGroup(i)} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ── EMAIL ────────────────────────────────────────────────── */
function EmailIntegration({ lang, cfg, update, onTest }) {
  return (
    <>
      <Card>
        <SectionTitle title="SMTP Server" sub={lang === "th" ? "ผู้ให้บริการอีเมลที่ใช้ส่งจดหมายแจ้งเตือน" : "Outbound email provider"} />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "ผู้ให้บริการ" : "Provider"} span={1}>
            <Select value={cfg.provider || "m365"} onChange={e => update({ provider: e.target.value })}>
              <option value="m365">Microsoft 365</option>
              <option value="gws">Google Workspace</option>
              <option value="ses">Amazon SES</option>
              <option value="sg">SendGrid</option>
              <option value="custom">Custom SMTP</option>
            </Select>
          </Field>
          <Field label="SMTP Host" span={1}>
            <Input className="ttm-mono" value={cfg.host || ""} onChange={e => update({ host: e.target.value })} />
          </Field>
          <Field label="Port" span={1}>
            <Input className="ttm-mono" value={cfg.port || ""} onChange={e => update({ port: e.target.value })} />
          </Field>
          <Field label={lang === "th" ? "การเข้ารหัส" : "Encryption"} span={1}>
            <Select value={cfg.encryption || "starttls"} onChange={e => update({ encryption: e.target.value })}>
              <option value="starttls">STARTTLS</option>
              <option value="ssl">SSL/TLS</option>
              <option value="none">{lang === "th" ? "ไม่เข้ารหัส" : "None"}</option>
            </Select>
          </Field>
          <Field label="Username" span={1}>
            <Input value={cfg.username || ""} onChange={e => update({ username: e.target.value })} placeholder="user@domain" />
          </Field>
          <Field label="App Password" span={1}>
            <Input type="password" className="ttm-mono" value={cfg.password || ""} onChange={e => update({ password: e.target.value })} placeholder="••••••••" />
          </Field>
        </div>
        <div className="ttm-form-actions" style={{ position: "static", boxShadow: "none", marginTop: 14, border: 0, background: "transparent" }}>
          <Button variant="ghost" icon="send" onClick={onTest}>{lang === "th" ? "ส่งอีเมลทดสอบ" : "Send test email"}</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "ข้อมูลผู้ส่ง" : "Sender identity"} />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "อีเมลผู้ส่ง" : "From address"} span={1}>
            <Input value={cfg.fromAddress || ""} onChange={e => update({ fromAddress: e.target.value })} />
          </Field>
          <Field label={lang === "th" ? "ชื่อที่แสดง" : "Display name"} span={1}>
            <Input value={cfg.displayName || ""} onChange={e => update({ displayName: e.target.value })} />
          </Field>
          <Field label="Reply-To" span={1}>
            <Input value={cfg.replyTo || ""} onChange={e => update({ replyTo: e.target.value })} />
          </Field>
        </div>
      </Card>
    </>
  );
}

/* ── IN-APP ────────────────────────────────────────────────── */
function InAppIntegration({ lang, cfg, update }) {
  const toggles = [
    { key: "bellEnabled", label: lang === "th" ? "Push การแจ้งเตือนผ่านระฆัง" : "Push to bell icon" },
    { key: "browserPush", label: lang === "th" ? "Browser push notifications" : "Browser push notifications" },
    { key: "sound", label: lang === "th" ? "เสียงแจ้งเตือน" : "Notification sound" },
    { key: "desktopOS", label: lang === "th" ? "Desktop OS notification" : "Desktop OS notification" },
  ];
  return (
    <>
      <Card>
        <SectionTitle
          title={lang === "th" ? "การแจ้งเตือนภายในแอป" : "In-app notifications"}
          sub={lang === "th" ? "ระฆังที่มุมขวาบน + แจ้งเตือนแบบเรียลไทม์" : "Bell icon in top-right + real-time push"}
        />
        <div className="ttm-channel-toggles">
          {toggles.map(t => (
            <div key={t.key} className="ttm-channel-toggle">
              <div className="ttm-channel-toggle-l"><Icon name="bell" size={15} /><span>{t.label}</span></div>
              <Switch checked={cfg[t.key] === true} onChange={(e) => update({ [t.key]: e.target.checked })} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "การเก็บประวัติการแจ้งเตือน" : "Retention policy"} />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "เก็บประวัติ" : "Keep history"}>
            <Select value={cfg.retention || "90d"} onChange={e => update({ retention: e.target.value })}>
              <option value="30d">30 {lang === "th" ? "วัน" : "days"}</option>
              <option value="90d">90 {lang === "th" ? "วัน" : "days"}</option>
              <option value="180d">180 {lang === "th" ? "วัน" : "days"}</option>
              <option value="365d">1 {lang === "th" ? "ปี" : "year"}</option>
              <option value="forever">{lang === "th" ? "ตลอดไป (ตาม ISO)" : "Forever (ISO)"}</option>
            </Select>
          </Field>
          <Field label={lang === "th" ? "หลังจากกดอ่านแล้ว" : "After read"}>
            <Select value={cfg.afterRead || "archive"} onChange={e => update({ afterRead: e.target.value })}>
              <option value="archive">{lang === "th" ? "เก็บใน Archive" : "Move to archive"}</option>
              <option value="keep">{lang === "th" ? "คงไว้ในกล่อง" : "Keep in inbox"}</option>
              <option value="delete">{lang === "th" ? "ลบทันที" : "Delete"}</option>
            </Select>
          </Field>
        </div>
      </Card>
    </>
  );
}

/* ── WEBHOOK ────────────────────────────────────────────────── */
function WebhookIntegration({ lang, cfg, update }) {
  const endpoints = cfg.endpoints || [];
  const setEndpoints = (eps) => update({ endpoints: eps });
  const add = () => setEndpoints([...endpoints, { id: `wh${Date.now()}`, name: "", url: "", events: "all" }]);
  const upd = (i, patch) => setEndpoints(endpoints.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const rm = (i) => setEndpoints(endpoints.filter((_, idx) => idx !== i));

  return (
    <>
      <Card>
        <SectionTitle
          title="Outgoing Webhooks"
          sub={lang === "th" ? "ส่ง event ของระบบไปยัง URL ภายนอก (Slack, MS Teams, Zapier, n8n)" : "Forward system events to external URLs"}
          right={<Button variant="secondary" size="sm" icon="plus" onClick={add}>{lang === "th" ? "เพิ่ม Webhook" : "Add webhook"}</Button>}
        />
        {endpoints.length === 0 ? (
          <div className="ttm-empty" style={{ padding: 30 }}>
            {lang === "th" ? "ยังไม่ได้กำหนด Webhook ใดๆ — กดเพิ่มเพื่อเริ่มต้น" : "No webhooks configured yet — click Add to start"}
          </div>
        ) : (
          <div className="ttm-conn-list">
            {endpoints.map((e, i) => (
              <div key={e.id || i} className="ttm-conn-row" style={{ alignItems: "flex-start" }}>
                <div className="ttm-conn-row-icon"><Icon name="external" size={16} /></div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8 }}>
                  <Input placeholder={lang === "th" ? "ชื่อ" : "Name"} value={e.name || ""} onChange={ev => upd(i, { name: ev.target.value })} />
                  <Input className="ttm-mono" placeholder="https://hooks.slack.com/services/..." value={e.url || ""} onChange={ev => upd(i, { url: ev.target.value })} />
                  <Select value={e.events || "all"} onChange={ev => upd(i, { events: ev.target.value })}>
                    <option value="all">{lang === "th" ? "ทุก event" : "All events"}</option>
                    <option value="approval">Approval only</option>
                    <option value="rejection">Rejection only</option>
                    <option value="done">Done only</option>
                  </Select>
                </div>
                <IconButton icon="trash" onClick={() => rm(i)} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
