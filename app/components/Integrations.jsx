"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Badge, Button, Card, Field, IconButton, Input, SectionTitle, Select, Switch, Tabs } from "./Ui";

export function Integrations({ lang, t }) {
  const [tab, setTab] = React.useState("line");

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
          <p>{lang === "th" ? "ตั้งค่าและตรวจสอบสถานะการเชื่อมต่อช่องทางแจ้งเตือน — LINE, Email, In-app, Webhook" : "Configure and verify notification channel connections — LINE, Email, In-app, Webhook"}</p>
        </div>
        <Button variant="ghost" icon="external" size="sm">{lang === "th" ? "เอกสารการตั้งค่า" : "Setup docs"}</Button>
      </div>

      <ConnectionsSummary lang={lang} />

      <Tabs value={tab} onChange={setTab} items={tabs} />

      {tab === "line" && <LineIntegration lang={lang} />}
      {tab === "email" && <EmailIntegration lang={lang} />}
      {tab === "inapp" && <InAppIntegration lang={lang} />}
      {tab === "webhook" && <WebhookIntegration lang={lang} />}
    </div>
  );
}

function ConnectionsSummary({ lang }) {
  const items = [
    { id: "line", label: "LINE", connected: true, icon: "line", color: "green", value: "2 bots · 5 groups" },
    { id: "email", label: "Email (SMTP)", connected: true, icon: "mail", color: "blue", value: "Microsoft 365" },
    { id: "inapp", label: lang === "th" ? "ในแอป" : "In-app", connected: true, icon: "bell", color: "violet", value: "Active" },
    { id: "webhook", label: "Webhook", connected: false, icon: "external", color: "neutral", value: lang === "th" ? "ยังไม่เชื่อม" : "Not configured" },
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

function LineIntegration({ lang }) {
  const bots = [
    { id: "bot1", name: "TTMFlow Main Bot", channelId: "1234567890", status: "active", lastPing: "2026-05-25 10:15" },
    { id: "bot2", name: "TTMFlow Alert Bot", channelId: "9876543210", status: "active", lastPing: "2026-05-25 10:15" },
  ];
  const groups = [
    { id: "g1", name: "IT Operations", lineId: "C1abc...d4f2", members: 14, bot: "TTMFlow Main Bot", purpose: lang === "th" ? "งานทั่วไป + แจ้งเตือนคำขอใหม่" : "General + new request alerts" },
    { id: "g2", name: "IT Support", lineId: "C2bcd...e5g3", members: 6, bot: "TTMFlow Alert Bot", purpose: lang === "th" ? "Ticket แจ้งซ่อม + Urgent" : "Repair tickets + urgent" },
    { id: "g3", name: "Sales Leaders", lineId: "C3cde...f6h4", members: 8, bot: "TTMFlow Main Bot", purpose: lang === "th" ? "แจ้งโครงการใหม่" : "New project notices" },
    { id: "g4", name: "HR & Recruitment", lineId: "C4def...g7i5", members: 5, bot: "TTMFlow Main Bot", purpose: lang === "th" ? "คำขอกำลังพล" : "Headcount requests" },
    { id: "g5", name: "Finance Team", lineId: "C5efg...h8j6", members: 4, bot: "TTMFlow Main Bot", purpose: lang === "th" ? "ขอเบิกค่าใช้จ่าย" : "Expense reimbursement" },
  ];

  return (
    <>
      <Card>
        <SectionTitle
          title={lang === "th" ? "LINE Bots ที่เชื่อมต่อ" : "Connected LINE Bots"}
          sub={lang === "th" ? "Channel Access Token + Webhook URL" : "Channel Access Token + Webhook URL"}
          right={<Button variant="secondary" size="sm" icon="plus">{lang === "th" ? "เพิ่ม Bot ใหม่" : "Add new bot"}</Button>}
        />
        <div className="ttm-conn-list">
          {bots.map(b => (
            <div key={b.id} className="ttm-conn-row">
              <div className="ttm-conn-row-icon"><Icon name="line" size={18} /></div>
              <div className="ttm-conn-row-meta">
                <strong>{b.name}</strong>
                <div className="ttm-muted ttm-small">Channel ID: <span className="ttm-mono">{b.channelId}</span> · {lang === "th" ? "Webhook ล่าสุด" : "Last webhook"} {b.lastPing}</div>
              </div>
              <Badge kind="green" dot>{lang === "th" ? "ใช้งานได้" : "Active"}</Badge>
              <Button variant="ghost" size="sm" icon="external">{lang === "th" ? "ทดสอบ" : "Test"}</Button>
              <IconButton icon="edit" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title={lang === "th" ? "การตั้งค่า Bot ใหม่" : "Add a new bot"}
          sub={lang === "th" ? "นำ Channel Access Token จาก LINE Developers Console มาวาง" : "Paste a Channel Access Token from LINE Developers Console"}
        />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "ชื่อ Bot (สำหรับอ้างอิงภายใน)" : "Bot name (internal)"} span={1}>
            <Input placeholder="TTMFlow Project Bot" />
          </Field>
          <Field label="Channel ID" span={1}>
            <Input className="ttm-mono" placeholder="1234567890" />
          </Field>
          <Field label="Channel Secret" span={1}>
            <Input type="password" className="ttm-mono" placeholder="••••••••••••••••" />
          </Field>
          <Field label="Channel Access Token" span={3} hint={lang === "th" ? "Long-lived token จาก Messaging API" : "Long-lived token from Messaging API"}>
            <Input type="password" className="ttm-mono" placeholder="••••••••••••••••••••••••••••••••" />
          </Field>
          <Field label="Webhook URL" span={3} hint={lang === "th" ? "นำ URL นี้ไปวางใน Webhook settings ของ LINE Channel" : "Paste this URL into LINE Channel's Webhook settings"}>
            <div className="ttm-copy-row">
              <Input className="ttm-mono" value="https://flow.talktome.co.th/api/webhooks/line" readOnly />
              <Button variant="ghost" size="sm" icon="check">{lang === "th" ? "คัดลอก" : "Copy"}</Button>
            </div>
          </Field>
        </div>
        <div className="ttm-form-actions" style={{ position: "static", boxShadow: "none", marginTop: 14 }}>
          <Button variant="ghost" icon="external">{lang === "th" ? "ทดสอบการเชื่อมต่อ" : "Test connection"}</Button>
          <div className="ttm-spacer" />
          <Button variant="primary" icon="check">{lang === "th" ? "บันทึก & เปิดใช้งาน" : "Save & enable"}</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title={lang === "th" ? "กลุ่ม LINE ที่ลงทะเบียน" : "Registered LINE groups"}
          sub={lang === "th" ? "ระบบจะส่งข้อความเข้ากลุ่มเมื่อมีคำขอเกี่ยวข้อง" : "Bot will post messages into these groups when relevant requests fire"}
          right={<Button variant="secondary" size="sm" icon="plus">{lang === "th" ? "เพิ่มกลุ่ม" : "Add group"}</Button>}
        />
        <div className="ttm-conn-list">
          {groups.map(g => (
            <div key={g.id} className="ttm-conn-row">
              <div className="ttm-conn-row-icon is-line"><Icon name="users" size={16} /></div>
              <div className="ttm-conn-row-meta">
                <strong>{g.name}</strong>
                <div className="ttm-muted ttm-small">
                  <span className="ttm-mono">{g.lineId}</span> · {g.members} {lang === "th" ? "สมาชิก" : "members"} · {lang === "th" ? "ใช้ Bot" : "via"} {g.bot}
                </div>
              </div>
              <Badge kind="neutral" className="ttm-conn-purpose">{g.purpose}</Badge>
              <IconButton icon="edit" />
              <IconButton icon="trash" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "Flex Message Template ที่ใช้" : "Flex Message templates"} />
        <div className="ttm-template-list">
          {[
            { id: "approval", titleTh: "การ์ดขออนุมัติ", titleEn: "Approval card", tag: "primary" },
            { id: "ack", titleTh: "การ์ดยืนยันได้รับเรื่อง", titleEn: "Acknowledgement card", tag: "info" },
            { id: "done", titleTh: "การ์ดเสร็จสิ้น", titleEn: "Completion card", tag: "success" },
            { id: "urgent", titleTh: "การ์ดงานด่วน", titleEn: "Urgent ticket card", tag: "danger" },
          ].map(tt => (
            <div key={tt.id} className="ttm-template-row">
              <Icon name="file-text" size={15} />
              <div className="ttm-template-meta">
                <strong>{lang === "th" ? tt.titleTh : tt.titleEn}</strong>
                <div className="ttm-muted ttm-small">{tt.id}.flex.json · {lang === "th" ? "อัพเดตล่าสุด" : "Updated"} 2026-05-12</div>
              </div>
              <Badge kind="neutral">{tt.tag}</Badge>
              <Button variant="ghost" size="sm" icon="edit">{lang === "th" ? "แก้ไข" : "Edit"}</Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function EmailIntegration({ lang }) {
  return (
    <>
      <Card>
        <SectionTitle
          title={lang === "th" ? "SMTP Server" : "SMTP Server"}
          sub={lang === "th" ? "ผู้ให้บริการอีเมลที่ใช้ส่งจดหมายแจ้งเตือน" : "Outbound email provider"}
        />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "ผู้ให้บริการ" : "Provider"} span={1}>
            <Select defaultValue="m365">
              <option value="m365">Microsoft 365 (Office 365 SMTP)</option>
              <option value="gws">Google Workspace SMTP</option>
              <option value="ses">Amazon SES</option>
              <option value="sg">SendGrid</option>
              <option value="custom">Custom SMTP</option>
            </Select>
          </Field>
          <Field label="SMTP Host" span={1}>
            <Input className="ttm-mono" defaultValue="smtp.office365.com" />
          </Field>
          <Field label="Port" span={1}>
            <Input className="ttm-mono" defaultValue="587" />
          </Field>
          <Field label={lang === "th" ? "การเข้ารหัส" : "Encryption"} span={1}>
            <Select defaultValue="starttls">
              <option value="starttls">STARTTLS</option>
              <option value="ssl">SSL/TLS</option>
              <option value="none">{lang === "th" ? "ไม่เข้ารหัส" : "None"}</option>
            </Select>
          </Field>
          <Field label="Username" span={1}>
            <Input defaultValue="noreply@talktome.co.th" />
          </Field>
          <Field label="App Password" span={1}>
            <Input type="password" className="ttm-mono" defaultValue="••••••••••••" />
          </Field>
        </div>
        <div className="ttm-form-actions" style={{ position: "static", boxShadow: "none", marginTop: 14 }}>
          <Button variant="ghost" icon="send">{lang === "th" ? "ส่งอีเมลทดสอบ" : "Send test email"}</Button>
          <div className="ttm-spacer" />
          <Button variant="primary" icon="check">{lang === "th" ? "บันทึก" : "Save"}</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "ข้อมูลผู้ส่ง" : "Sender identity"} />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "อีเมลผู้ส่ง" : "From address"} span={1}>
            <Input defaultValue="noreply@talktome.co.th" />
          </Field>
          <Field label={lang === "th" ? "ชื่อที่แสดง" : "Display name"} span={1}>
            <Input defaultValue="TTMFlow · Talk to Me Co., Ltd." />
          </Field>
          <Field label="Reply-To" span={1}>
            <Input defaultValue="it-support@talktome.co.th" />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "การตรวจสอบสิทธิ์ส่งเมล (DKIM/SPF/DMARC)" : "Email authentication (DKIM / SPF / DMARC)"} />
        <div className="ttm-auth-list">
          {[
            { id: "spf", label: "SPF", value: "v=spf1 include:spf.protection.outlook.com -all", ok: true },
            { id: "dkim", label: "DKIM (selector1)", value: "selector1._domainkey.talktome.co.th", ok: true },
            { id: "dkim2", label: "DKIM (selector2)", value: "selector2._domainkey.talktome.co.th", ok: true },
            { id: "dmarc", label: "DMARC", value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@talktome.co.th", ok: true },
          ].map(a => (
            <div key={a.id} className="ttm-auth-row">
              <Badge kind={a.ok ? "green" : "red"} dot>{a.ok ? "OK" : "Fail"}</Badge>
              <strong>{a.label}</strong>
              <span className="ttm-mono ttm-small ttm-muted">{a.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "Template อีเมล" : "Email templates"} />
        <div className="ttm-template-list">
          {[
            { id: "approval-required", titleTh: "แจ้งให้อนุมัติ", titleEn: "Approval required" },
            { id: "approved", titleTh: "แจ้งผลอนุมัติแล้ว", titleEn: "Approved notification" },
            { id: "rejected", titleTh: "แจ้งผลไม่อนุมัติ", titleEn: "Rejection notification" },
            { id: "ticket-assigned", titleTh: "ได้รับงาน Ticket", titleEn: "Ticket assigned" },
            { id: "ticket-done", titleTh: "ปิดงาน Ticket", titleEn: "Ticket closed" },
          ].map(tt => (
            <div key={tt.id} className="ttm-template-row">
              <Icon name="mail" size={15} />
              <div className="ttm-template-meta">
                <strong>{lang === "th" ? tt.titleTh : tt.titleEn}</strong>
                <div className="ttm-muted ttm-small">{tt.id}.html · TH + EN</div>
              </div>
              <Button variant="ghost" size="sm" icon="edit">{lang === "th" ? "แก้ไข" : "Edit"}</Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function InAppIntegration({ lang }) {
  return (
    <>
      <Card>
        <SectionTitle
          title={lang === "th" ? "การแจ้งเตือนภายในแอป" : "In-app notifications"}
          sub={lang === "th" ? "ระฆังที่มุมขวาบน + แจ้งเตือนแบบเรียลไทม์" : "Bell icon in top-right + real-time push"}
        />
        <div className="ttm-channel-toggles">
          {[
            { id: "bell", label: lang === "th" ? "Push การแจ้งเตือนผ่านระฆัง" : "Push to bell icon", on: true },
            { id: "browser", label: lang === "th" ? "Browser push notifications" : "Browser push notifications", on: true },
            { id: "sound", label: lang === "th" ? "เสียงแจ้งเตือน" : "Notification sound", on: false },
            { id: "desktop", label: lang === "th" ? "Desktop OS notification" : "Desktop OS notification", on: true },
          ].map(c => (
            <div key={c.id} className="ttm-channel-toggle">
              <div className="ttm-channel-toggle-l"><Icon name="bell" size={15} /><span>{c.label}</span></div>
              <Switch checked={c.on} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "การเก็บประวัติการแจ้งเตือน" : "Retention policy"} />
        <div className="ttm-form-grid">
          <Field label={lang === "th" ? "เก็บประวัติ" : "Keep history"}>
            <Select defaultValue="90d">
              <option value="30d">30 {lang === "th" ? "วัน" : "days"}</option>
              <option value="90d">90 {lang === "th" ? "วัน" : "days"}</option>
              <option value="180d">180 {lang === "th" ? "วัน" : "days"}</option>
              <option value="365d">1 {lang === "th" ? "ปี" : "year"}</option>
              <option value="forever">{lang === "th" ? "ตลอดไป (ตาม ISO)" : "Forever (ISO)"}</option>
            </Select>
          </Field>
          <Field label={lang === "th" ? "หลังจากกดอ่านแล้ว" : "After read"}>
            <Select defaultValue="archive">
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

function WebhookIntegration({ lang }) {
  return (
    <>
      <Card>
        <SectionTitle
          title="Outgoing Webhooks"
          sub={lang === "th" ? "ส่ง event ของระบบไปยัง URL ภายนอก (Slack, MS Teams, Zapier, n8n)" : "Forward system events to external URLs (Slack, MS Teams, Zapier, n8n)"}
          right={<Button variant="secondary" size="sm" icon="plus">{lang === "th" ? "เพิ่ม Webhook" : "Add webhook"}</Button>}
        />
        <div className="ttm-empty" style={{ padding: 30 }}>
          {lang === "th" ? "ยังไม่ได้กำหนด Webhook ใดๆ — กดเพิ่มเพื่อเริ่มต้น" : "No webhooks configured yet — click Add to start"}
        </div>
      </Card>

      <Card>
        <SectionTitle title={lang === "th" ? "Microsoft Teams (เร็วๆ นี้)" : "Microsoft Teams (coming soon)"} />
        <div className="ttm-coming">
          <Icon name="external" size={20} />
          <div>
            <strong>{lang === "th" ? "การเชื่อมต่อโดยตรงกับ Teams" : "Direct Teams integration"}</strong>
            <p className="ttm-muted ttm-small">{lang === "th" ? "ระหว่างพัฒนา — ใช้ Webhook ด้านบนชั่วคราว" : "In development — use the webhook above for now"}</p>
          </div>
        </div>
      </Card>
    </>
  );
}
