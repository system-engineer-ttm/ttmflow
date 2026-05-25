"use client";
import React from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { cls, Badge, Button, Card, Field, IconButton, Input, SectionTitle, Select, Switch } from "./Ui";
import { shortFormCode } from "../lib/data";
import { useAppData } from "../lib/AppDataContext";

export function NotificationsLog({ lang, t }) {
  const [channel, setChannel] = React.useState("all");
  const { NOTIFICATIONS: list } = useAppData();
  const filtered = channel === "all" ? list : list.filter(n => n.channel === channel);

  return (
    <div className="ttm-page ttm-notif-page">
      <div className="ttm-list-head">
        <div>
          <h2>{t.nav.notifications}</h2>
          <p>{lang === "th" ? "บันทึกการส่งข้อความออกจากระบบ — LINE, Email, In-app" : "Outbound notification log — LINE, Email, In-app"}</p>
        </div>
        <Button variant="ghost" icon="download" size="sm">{lang === "th" ? "ดาวน์โหลด CSV" : "Export CSV"}</Button>
      </div>

      <div className="ttm-channel-stats">
        {[
          { id: "all", label: t.common.all, value: list.length, icon: "log" },
          { id: "line", label: "LINE", value: list.filter(n => n.channel === "line").length, icon: "line", color: "green" },
          { id: "email", label: "Email", value: list.filter(n => n.channel === "email").length, icon: "mail", color: "blue" },
          { id: "inapp", label: "In-app", value: list.filter(n => n.channel === "inapp").length, icon: "bell", color: "violet" },
        ].map(s => (
          <button key={s.id} className={cls("ttm-channel-stat", channel === s.id && "is-active", s.color && `is-${s.color}`)} onClick={() => setChannel(s.id)}>
            <Icon name={s.icon} size={16} />
            <div>
              <div className="ttm-channel-stat-label">{s.label}</div>
              <div className="ttm-channel-stat-value">{s.value}</div>
            </div>
          </button>
        ))}
      </div>

      <Card className="ttm-table-card">
        <table className="ttm-table">
          <thead>
            <tr>
              <th>{lang === "th" ? "เวลา" : "Time"}</th>
              <th>{lang === "th" ? "ช่องทาง" : "Channel"}</th>
              <th>{lang === "th" ? "ปลายทาง" : "Recipient"}</th>
              <th>{lang === "th" ? "ข้อความ" : "Subject"}</th>
              <th>{t.common.docNo}</th>
              <th>{lang === "th" ? "สถานะ" : "Status"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map(n => (
              <tr key={n.id}>
                <td className="ttm-muted">{n.at}</td>
                <td>
                  <span className={cls("ttm-channel-tag", `is-${n.channel}`)}>
                    <Icon name={n.channel === "line" ? "line" : n.channel === "email" ? "mail" : "bell"} size={13} />
                    {n.channel === "line" ? "LINE" : n.channel === "email" ? "Email" : "In-app"}
                  </span>
                </td>
                <td>{n.to}</td>
                <td className="ttm-notif-subject-cell">{n.subject}</td>
                <td className="ttm-mono ttm-small">{n.reqId}</td>
                <td><Badge kind="green" dot>{n.status}</Badge></td>
                <td><IconButton icon="external" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="ttm-notif-previews">
        <Card>
          <SectionTitle title={lang === "th" ? "ตัวอย่าง LINE Notification" : "LINE message preview"} />
          <LinePreview lang={lang} />
        </Card>
        <Card>
          <SectionTitle title={lang === "th" ? "ตัวอย่าง Email อนุมัติ" : "Approval email preview"} />
          <EmailPreview lang={lang} />
        </Card>
      </div>
    </div>
  );
}

function LinePreview({ lang }) {
  return (
    <div className="ttm-line-preview">
      <div className="ttm-line-header">
        <div className="ttm-line-avatar">
          <Image src="/assets/logo.jpg" alt="TTM" width={32} height={32} />
        </div>
        <div>
          <div className="ttm-line-name">TTMFlow Bot</div>
          <div className="ttm-line-time">{lang === "th" ? "วันนี้ 08:42" : "Today 08:42"}</div>
        </div>
      </div>
      <div className="ttm-line-card">
        <div className="ttm-line-card-hero">
          <div className="ttm-line-card-tag">📋 {lang === "th" ? "คำขอใหม่รออนุมัติ" : "New approval request"}</div>
          <h4>{lang === "th" ? "สร้างคิวใหม่ Project SCB-Premier" : "New PBX queue: Project SCB-Premier"}</h4>
        </div>
        <div className="ttm-line-card-body">
          <div className="ttm-line-kv"><span>{lang === "th" ? "เลขที่" : "Doc"}</span><b className="ttm-mono">IT0109-260525-0143</b></div>
          <div className="ttm-line-kv"><span>{lang === "th" ? "ผู้แจ้ง" : "From"}</span><b>ณัฐกานต์ ว.</b></div>
          <div className="ttm-line-kv"><span>{lang === "th" ? "ขั้นที่" : "Step"}</span><b>1 / 3</b></div>
          <div className="ttm-line-kv"><span>SLA</span><b>1 {lang === "th" ? "วันทำการ" : "business day"}</b></div>
        </div>
        <div className="ttm-line-card-actions">
          <button className="ttm-line-btn is-primary">{lang === "th" ? "เปิดเพื่ออนุมัติ" : "Open to approve"}</button>
          <button className="ttm-line-btn">{lang === "th" ? "ดู PDF" : "View PDF"}</button>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ lang }) {
  return (
    <div className="ttm-email-preview">
      <div className="ttm-email-head">
        <div><span>From</span><b>noreply@talktome.co.th</b></div>
        <div><span>To</span><b>tanawat.s@talktome.co.th</b></div>
        <div><span>Subject</span><b>[Approve Required] IT0101-260524-0142</b></div>
      </div>
      <div className="ttm-email-body">
        <div className="ttm-email-brand">
          <Image src="/assets/logo.jpg" alt="TTM" width={32} height={32} />
          <strong>TTMFlow</strong>
        </div>
        <h3>{lang === "th" ? "คุณมีคำขอใหม่รออนุมัติ" : "You have a request awaiting approval"}</h3>
        <p>{lang === "th" ? "สวัสดี ธนวัฒน์," : "Hi Tanawat,"}</p>
        <p>{lang === "th"
          ? "ณัฐกานต์ ส่งคำขอ \"ขอเปิด Email และสิทธิ์ PBX สำหรับพนักงานใหม่\" (IT0101-260524-0142) มาให้คุณพิจารณาเป็นขั้นที่ 1 จาก 3"
          : "Natthakan submitted \"Email + PBX access for new hire\" (IT0101-260524-0142) for your approval as step 1 of 3."}</p>
        <div className="ttm-email-buttons">
          <button className="ttm-email-btn is-primary">{lang === "th" ? "✓ อนุมัติออนไลน์" : "✓ Approve online"}</button>
          <button className="ttm-email-btn">{lang === "th" ? "ดูรายละเอียด" : "View detail"}</button>
        </div>
        <div className="ttm-email-attach">
          <Icon name="file-text" size={14} />
          <span>IT0101-260524-0142.pdf · 184 KB</span>
        </div>
        <p className="ttm-muted ttm-small">{lang === "th" ? "อีเมลส่งโดยระบบอัตโนมัติ TTMFlow — กรุณาอย่าตอบกลับ" : "Sent automatically by TTMFlow — please do not reply."}</p>
      </div>
    </div>
  );
}

export function Settings({ lang, t, setRoute }) {
  const [selected, setSelected] = React.useState("FM-IT-01-01");
  const { FORM_TEMPLATES: tmpl } = useAppData();
  const cur = tmpl.find(x => x.code === selected) || tmpl[tmpl.length - 1];

  return (
    <div className="ttm-page ttm-settings-page">
      <div className="ttm-list-head">
        <div>
          <h2>{t.nav.settings}</h2>
          <p>{lang === "th" ? "ขึ้นทะเบียนแบบฟอร์ม, กำหนดลำดับผู้อนุมัติ, รูปแบบเลขเอกสาร และช่องทางการแจ้งเตือน" : "Register form templates, approval chains, document numbering, and notification channels"}</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setRoute && setRoute("templateBuilder")}>{lang === "th" ? "ขึ้นทะเบียนฟอร์มใหม่" : "Register new form"}</Button>
      </div>

      <div className="ttm-settings-grid">
        <Card className="ttm-settings-list">
          <div className="ttm-settings-list-head">
            <strong>{lang === "th" ? "แบบฟอร์มทั้งหมด" : "All templates"}</strong>
            <span className="ttm-muted ttm-small">{tmpl.length}</span>
          </div>
          <ul>
            {tmpl.map(f => (
              <li key={f.code}>
                <button className={cls("ttm-settings-item", selected === f.code && "is-active")} onClick={() => setSelected(f.code)}>
                  <div className={cls("ttm-settings-item-icon", `is-${f.color}`)}><Icon name={f.icon} size={14} /></div>
                  <div className="ttm-settings-item-meta">
                    <div className="ttm-mono ttm-small">{f.code}</div>
                    <div>{lang === "th" ? f.titleTh : f.titleEn}</div>
                  </div>
                  {f.custom && <Badge kind="violet" className="ttm-settings-cat">{lang === "th" ? "ใหม่" : "New"}</Badge>}
                  <Badge kind="neutral" className="ttm-settings-cat">{f.category}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="ttm-settings-detail">
          <Card>
            <div className="ttm-settings-detail-head">
              <div className={cls("ttm-form-head-icon", `is-${cur.color}`)}>
                <Icon name={cur.icon} size={24} />
              </div>
              <div>
                <div className="ttm-muted ttm-small">{cur.code} · Rev 00 · {lang === "th" ? "บังคับใช้ 01/03/2569" : "Effective 01/03/2026"}</div>
                <h3>{lang === "th" ? cur.titleTh : cur.titleEn}</h3>
              </div>
              <div className="ttm-spacer" />
              <Button variant="ghost" icon="edit">{lang === "th" ? "แก้ไข" : "Edit"}</Button>
            </div>
          </Card>

          <Card>
            <SectionTitle title={lang === "th" ? "รูปแบบเลขเอกสาร" : "Document numbering"} />
            <div className="ttm-numbering">
              <div className="ttm-numbering-reg">
                <span className="ttm-muted ttm-small">{lang === "th" ? "รหัสฟอร์มขึ้นทะเบียน" : "Registered form code"}</span>
                <span className="ttm-mono">{cur.code}</span>
                <Icon name="arrow-right" size={13} className="ttm-muted" />
                <span className="ttm-muted ttm-small">{lang === "th" ? "ตัดเป็นรหัสรัน" : "Short prefix"}</span>
                <span className="ttm-mono ttm-numbering-short">{shortFormCode(cur.code)}</span>
              </div>
              <div className="ttm-numbering-formula">
                <Token label={lang === "th" ? "รหัสรัน" : "Prefix"} value={shortFormCode(cur.code)} color="blue" />
                <span>–</span>
                <Token label={lang === "th" ? "ปีเดือนวัน (YYMMDD)" : "YYMMDD"} value="260525" color="violet" />
                <span>–</span>
                <Token label={lang === "th" ? "Running" : "Running"} value="0143" color="emerald" />
              </div>
              <div className="ttm-numbering-preview">
                <span className="ttm-muted ttm-small">{lang === "th" ? "ตัวอย่าง" : "Preview"}</span>
                <span className="ttm-mono">{shortFormCode(cur.code)}-260525-0143</span>
              </div>
              <div className="ttm-numbering-options">
                <Field label={lang === "th" ? "เริ่มนับใหม่" : "Reset counter"}>
                  <Select defaultValue="year">
                    <option value="never">{lang === "th" ? "ไม่รีเซ็ต" : "Never"}</option>
                    <option value="year">{lang === "th" ? "ทุกปี" : "Yearly"}</option>
                    <option value="month">{lang === "th" ? "ทุกเดือน" : "Monthly"}</option>
                  </Select>
                </Field>
                <Field label={lang === "th" ? "จำนวนหลัก Running" : "Running digits"}>
                  <Select defaultValue="4">
                    <option value="3">3 (001-999)</option>
                    <option value="4">4 (0001-9999)</option>
                    <option value="5">5 (00001-99999)</option>
                  </Select>
                </Field>
                <Field label={lang === "th" ? "ค่า Running ปัจจุบัน" : "Current running"}>
                  <Input defaultValue="0143" />
                </Field>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              title={lang === "th" ? "ลำดับการอนุมัติ" : "Approval chain"}
              right={<Button variant="ghost" size="sm" icon="plus">{lang === "th" ? "เพิ่มขั้น" : "Add step"}</Button>}
            />
            <ApprovalChainEditor approvers={cur.approvers} lang={lang} />
          </Card>

          <Card>
            <SectionTitle title={lang === "th" ? "ช่องทางการแจ้งเตือน" : "Notification channels"} />
            <div className="ttm-channel-toggles">
              {[
                { id: "line-group", label: lang === "th" ? "LINE กลุ่ม IT Operations" : "LINE group: IT Operations", icon: "line", on: true },
                { id: "line-personal", label: lang === "th" ? "LINE ผู้อนุมัติเฉพาะคน" : "LINE: assigned approver", icon: "line", on: true },
                { id: "email-approver", label: lang === "th" ? "Email ผู้อนุมัติพร้อมลิงก์" : "Email approver with link", icon: "mail", on: true },
                { id: "email-it", label: lang === "th" ? "Email ทีม IT เมื่ออนุมัติครบ" : "Email IT team on full approval", icon: "mail", on: true },
                { id: "inapp", label: lang === "th" ? "แจ้งเตือนภายในแอป" : "In-app notification", icon: "bell", on: true },
                { id: "requester-line", label: lang === "th" ? "แจ้งผลกลับผู้แจ้งทาง LINE" : "Notify requester via LINE", icon: "line", on: true },
              ].map(ch => (
                <div key={ch.id} className="ttm-channel-toggle">
                  <div className="ttm-channel-toggle-l">
                    <Icon name={ch.icon} size={15} />
                    <span>{ch.label}</span>
                  </div>
                  <Switch checked={ch.on} onChange={() => {}} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Token({ label, value, color }) {
  return (
    <span className={cls("ttm-token", `is-${color}`)}>
      <span className="ttm-token-label">{label}</span>
      <span className="ttm-token-value ttm-mono">{value}</span>
    </span>
  );
}

function ApprovalChainEditor({ approvers, lang }) {
  return (
    <ol className="ttm-chain-editor">
      {approvers.map((r, i) => (
        <li key={i} className="ttm-chain-step">
          <div className="ttm-chain-num">{i + 1}</div>
          <div className="ttm-chain-content">
            <Field label={lang === "th" ? "บทบาท / ตำแหน่ง" : "Role"}>
              <Input defaultValue={typeof r === "string" ? r : (lang === "th" ? r.roleTh : r.roleEn)} />
            </Field>
            <Field label={lang === "th" ? "ผู้ใช้ที่กำหนด" : "Assigned user(s)"}>
              <Select defaultValue="auto">
                <option value="auto">{lang === "th" ? "ตามโครงสร้างองค์กรอัตโนมัติ" : "Auto-resolve from org chart"}</option>
                <option value="user">{lang === "th" ? "เลือกบุคคลเจาะจง" : "Specific user"}</option>
                <option value="group">{lang === "th" ? "เลือกตามกลุ่ม" : "Group"}</option>
              </Select>
            </Field>
            <Field label="SLA">
              <Select defaultValue="1d">
                <option value="4h">4 {lang === "th" ? "ชั่วโมง" : "hours"}</option>
                <option value="1d">1 {lang === "th" ? "วันทำการ" : "business day"}</option>
                <option value="2d">2 {lang === "th" ? "วันทำการ" : "business days"}</option>
                <option value="3d">3 {lang === "th" ? "วันทำการ" : "business days"}</option>
              </Select>
            </Field>
          </div>
          <div className="ttm-chain-actions">
            <IconButton icon="trash" />
          </div>
        </li>
      ))}
    </ol>
  );
}
