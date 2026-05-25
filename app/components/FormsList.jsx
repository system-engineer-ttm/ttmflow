"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Badge, Card, Tabs } from "./Ui";
import { useAppData } from "../lib/AppDataContext";

export function FormsList({ lang, t, openForm }) {
  const [cat, setCat] = React.useState("all");
  const [q, setQ] = React.useState("");
  const { FORM_TEMPLATES: tmpl } = useAppData();

  const categories = [
    { id: "all", label: t.common.all, icon: "list" },
    { id: "SL", label: lang === "th" ? "ฝ่ายขาย (Sales)" : "Sales", icon: "trending-up" },
    { id: "OP", label: lang === "th" ? "ปฏิบัติการ (Operations)" : "Operations", icon: "users" },
    { id: "HR", label: t.forms.categoryHR, icon: "user-plus" },
    { id: "IT", label: t.forms.categoryIT, icon: "monitor" },
    { id: "FI", label: t.forms.categoryFI, icon: "wallet" },
  ];

  const filtered = tmpl.filter(f =>
    (cat === "all" || f.category === cat) &&
    (q === "" || (lang === "th" ? f.titleTh : f.titleEn).toLowerCase().includes(q.toLowerCase()) || f.code.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="ttm-page ttm-forms-page">
      <div className="ttm-forms-head">
        <div>
          <h2>{t.forms.title}</h2>
          <p>{t.forms.sub}</p>
        </div>
        <div className="ttm-forms-search">
          <Icon name="search" size={15} />
          <input placeholder={lang === "th" ? "ค้นหารหัสฟอร์มหรือชื่อ..." : "Search form code or name..."} value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <Tabs value={cat} onChange={setCat} items={categories.map(c => ({ ...c, count: c.id === "all" ? tmpl.length : tmpl.filter(t => t.category === c.id).length }))} />

      <div className="ttm-forms-grid">
        {filtered.map(f => (
          <button key={f.code} className={cls("ttm-form-card", `is-${f.color}`)} onClick={() => openForm(f.code)}>
            <div className="ttm-form-card-top">
              <div className="ttm-form-card-icon"><Icon name={f.icon} size={22} /></div>
              <Badge kind="neutral" className="ttm-form-code">{f.code}</Badge>
            </div>
            <div className="ttm-form-card-title">{lang === "th" ? f.titleTh : f.titleEn}</div>
            <div className="ttm-form-card-desc">{lang === "th" ? f.descTh : f.descEn}</div>
            <div className="ttm-form-card-meta">
              <span className="ttm-meta-pill"><Icon name="users" size={12} /> {f.approvers.length} {lang === "th" ? "ขั้นอนุมัติ" : "approvers"}</span>
              <span className="ttm-meta-pill"><Icon name="clock" size={12} /> ~{f.avgDays} {lang === "th" ? "วัน" : "d"}</span>
            </div>
            <div className="ttm-form-card-cta">
              <span>{lang === "th" ? "กรอกฟอร์ม" : "Fill form"}</span>
              <Icon name="arrow-right" size={14} />
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="ttm-empty">{t.common.noResults}</div>
        )}
      </div>

      <Card className="ttm-iso-banner">
        <div className="ttm-iso-banner-icon"><Icon name="shield-check" size={22} /></div>
        <div className="ttm-iso-banner-meta">
          <strong>{lang === "th" ? "ทุกแบบฟอร์มขึ้นทะเบียนภายใต้ ISO 9001:2015" : "All forms are registered under ISO 9001:2015"}</strong>
          <p>{lang === "th"
            ? "เลขเอกสารสร้างอัตโนมัติด้วยรูปแบบ [รหัสฝ่าย+หมวด+ลำดับ]-[YYMMDD]-[Running] เช่น IT0101-260525-0143 · ทุก revision ถูกบันทึกเป็น immutable log สำหรับการตรวจรับรอง"
            : "Document numbers auto-generated as [Dept+Group+Seq]-[YYMMDD]-[Running] e.g. IT0101-260525-0143 · every revision is logged as an immutable audit trail."}</p>
        </div>
      </Card>
    </div>
  );
}
