"use client";
import React from "react";

export default function PrintRequest({ params }) {
  const [req, setReq] = React.useState(null);
  const [tmpl, setTmpl] = React.useState(null);
  const [usersMap, setUsersMap] = React.useState({});
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [rRes, fRes, uRes] = await Promise.all([
          fetch(`/api/requests/${params.id}`),
          fetch(`/api/forms`),
          fetch(`/api/users`),
        ]);
        const rData = await rRes.json().catch(() => null);
        const fData = await fRes.json().catch(() => []);
        const uData = await uRes.json().catch(() => []);
        if (cancelled) return;
        const fTmpl = Array.isArray(fData) ? fData.find(f => f.code === rData?.template) : null;
        const uMap = {};
        if (Array.isArray(uData)) for (const u of uData) uMap[u.id] = u;
        setReq(rData);
        setTmpl(fTmpl);
        setUsersMap(uMap);
        setReady(true);
      } catch (e) {
        if (!cancelled) setReady(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  // Auto-print if ?print=1
  React.useEffect(() => {
    if (!ready || !req) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("print") === "1") {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [ready, req]);

  if (!ready) {
    return <div style={{ padding: 60, textAlign: "center", fontFamily: "sans-serif" }}>กำลังโหลด...</div>;
  }
  if (!req) {
    return <div style={{ padding: 60, textAlign: "center", fontFamily: "sans-serif" }}>ไม่พบเอกสาร {params.id}</div>;
  }

  const requester = usersMap[req.requester] || { nameTh: req.requester, dept: "", titleTh: "" };
  const payload = req.payload || {};
  const sch = payload.sch || payload;
  const sections = tmpl?.sections || [];

  return (
    <>
      <PrintStyles />
      <div className="page">
        <div className="no-print toolbar">
          <button onClick={() => window.print()}>🖨️ พิมพ์ / บันทึกเป็น PDF</button>
          <button onClick={() => window.close()}>ปิดหน้านี้</button>
        </div>

        <header className="doc-header">
          <div className="header-meta">
            <div className="row"><span>เลขที่เอกสาร:</span><b>{req.id}</b></div>
            <div className="row"><span>รหัสฟอร์ม:</span><b>{tmpl?.code || req.template}</b></div>
            <div className="row"><span>Revision:</span><b>00</b></div>
            <div className="row"><span>บังคับใช้:</span><b>01/03/2569</b></div>
          </div>
          <div className="header-logo">
            <div className="logo-circle">TTM</div>
            <div className="logo-name">Talk to Me Co., Ltd.</div>
          </div>
        </header>

        <h1 className="doc-title">{tmpl?.titleTh || "แบบฟอร์มคำขอ"}</h1>
        <div className="doc-subtitle">{tmpl?.titleEn || ""}</div>

        {sections.map(sec => (
          <section key={sec.id} className="doc-section">
            <h2>{sec.titleTh}</h2>
            <div className="field-grid">
              {(sec.fields || []).map(f => (
                <FieldRow key={f.id} field={f} value={sch[f.id]} />
              ))}
            </div>
          </section>
        ))}

        <section className="doc-section">
          <h2>การลงนามอนุมัติ</h2>
          <div className="signatures">
            {(req.steps || []).map((s, i) => {
              const u = usersMap[s.user] || { nameTh: s.user || "—", titleTh: "" };
              return (
                <div key={i} className="signature-box">
                  <div className="sig-num">{i === 0 ? "ผู้แจ้ง" : `ผู้อนุมัติคนที่ ${i}`}</div>
                  <div className="sig-line">
                    {s.signed && <span className="sig-mark">✓ ลงนามแล้ว</span>}
                  </div>
                  <div className="sig-name">{u.nameTh}</div>
                  <div className="sig-role">{s.role}</div>
                  <div className="sig-date">{s.at || "_________________"}</div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="doc-footer">
          <div>ออกโดยระบบ TTMFlow · {tmpl?.code} · Rev 00 · ISO 9001:2015</div>
          <div className="doc-stamp">เอกสารฉบับนี้ผลิตและตรวจรับรองตามมาตรฐาน ISO 9001</div>
        </footer>
      </div>
    </>
  );
}

function FieldRow({ field, value }) {
  const label = field.labelTh || field.labelEn || field.id;
  const hasOptions = Array.isArray(field.options) && field.options.length > 0;

  let display = "—";

  if (field.type === "radio" && hasOptions) {
    const opt = field.options.find(o => o.id === value);
    display = opt ? opt.labelTh : "—";
  } else if (field.type === "toggle") {
    display = value === true || value === "yes" || value === "true" ? "✓ ใช้" : "ไม่ใช้";
  } else if (field.type === "checkbox" && hasOptions) {
    const arr = Array.isArray(value) ? value : [];
    display = arr.map(id => field.options.find(o => o.id === id)?.labelTh).filter(Boolean).join(", ") || "—";
  } else if (field.type === "checkbox") {
    const checked = value && typeof value === "object" ? value.checked === true : value === true;
    if (!checked) {
      display = "☐ ไม่เลือก";
    } else if (Array.isArray(field.subFields) && field.subFields.length > 0) {
      const sub = (value && typeof value === "object" ? value.sub : null) || {};
      const parts = field.subFields.map(sf => {
        const sv = sub[sf.id];
        if (sv === undefined || sv === null || sv === "") return null;
        if (sf.type === "radio" && Array.isArray(sf.options)) {
          const o = sf.options.find(x => x.id === sv);
          return o ? `${sf.labelTh}: ${o.labelTh}` : null;
        }
        return `${sf.labelTh}: ${sv}`;
      }).filter(Boolean);
      display = parts.length ? `☑ ${parts.join(" · ")}` : "☑ เลือก";
    } else {
      display = "☑ เลือก";
    }
  } else if (field.type === "select" && hasOptions) {
    const opt = field.options.find(o => o.id === value);
    display = opt ? opt.labelTh : "—";
  } else {
    display = value || "—";
  }

  const span = field.span || 1;
  const isLong = field.type === "textarea" || span >= 3;

  return (
    <div className={`field-row ${isLong ? "full" : ""}`} style={{ gridColumn: `span ${Math.min(span, 3)}` }}>
      <div className="field-label">{label}</div>
      <div className="field-value">{display}</div>
    </div>
  );
}

function PrintStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap');
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #f3f4f6; font-family: 'Sarabun', 'Tahoma', sans-serif; color: #111; }
      .page { max-width: 800px; margin: 24px auto; background: #fff; padding: 48px 56px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      @media print {
        html, body { background: #fff; }
        .page { box-shadow: none; max-width: 100%; margin: 0; padding: 24px 32px; }
        .no-print { display: none !important; }
      }
      .toolbar { position: sticky; top: 0; background: #1f6feb; padding: 12px 20px; margin: -24px -56px 32px; display: flex; gap: 12px; z-index: 5; }
      .toolbar button { padding: 8px 16px; border: 0; border-radius: 6px; background: #fff; color: #1f6feb; font-weight: 600; cursor: pointer; font-size: 14px; }
      .toolbar button:hover { background: #f3f4f6; }
      .doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 24px; }
      .header-meta { font-size: 11px; }
      .header-meta .row { display: flex; gap: 8px; }
      .header-meta .row span { width: 100px; color: #555; }
      .header-meta .row b { color: #111; }
      .header-logo { text-align: right; }
      .logo-circle { width: 48px; height: 48px; background: #1f6feb; color: #fff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
      .logo-name { font-size: 11px; color: #555; margin-top: 4px; }
      .doc-title { font-size: 22px; margin: 0 0 4px; text-align: center; }
      .doc-subtitle { font-size: 13px; text-align: center; color: #555; margin-bottom: 28px; }
      .doc-section { margin-bottom: 24px; page-break-inside: avoid; }
      .doc-section h2 { font-size: 14px; background: #f1f5f9; padding: 8px 12px; border-left: 4px solid #1f6feb; margin: 0 0 10px; }
      .field-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
      .field-row { font-size: 12px; padding: 6px 0; border-bottom: 1px dotted #ddd; }
      .field-row.full { grid-column: 1 / -1; }
      .field-label { color: #555; font-size: 11px; margin-bottom: 2px; }
      .field-value { color: #111; font-weight: 500; min-height: 18px; word-break: break-word; }
      .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px 24px; margin-top: 16px; }
      .signature-box { border: 1px solid #ddd; padding: 16px; text-align: center; min-height: 130px; display: flex; flex-direction: column; }
      .sig-num { font-size: 11px; color: #555; }
      .sig-line { flex: 1; border-bottom: 1px solid #111; margin: 24px 16px 12px; position: relative; }
      .sig-mark { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); color: #0d9488; font-weight: 600; font-size: 11px; }
      .sig-name { font-weight: 600; font-size: 13px; }
      .sig-role { font-size: 11px; color: #555; margin-top: 2px; }
      .sig-date { font-size: 11px; color: #555; margin-top: 4px; }
      .doc-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #777; display: flex; justify-content: space-between; }
    `}</style>
  );
}
