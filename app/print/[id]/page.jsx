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

  React.useEffect(() => {
    if (!ready || !req) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("print") === "1") {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [ready, req]);

  if (!ready) {
    return <div style={{ padding: 60, textAlign: "center", fontFamily: "sans-serif" }}>กำลังโหลด...</div>;
  }
  if (!req) {
    return <div style={{ padding: 60, textAlign: "center", fontFamily: "sans-serif" }}>ไม่พบเอกสาร {params.id}</div>;
  }

  // Route to template-specific layout
  if (req.template === "FM-IT-01-01") {
    return <FormIT0101 req={req} tmpl={tmpl} usersMap={usersMap} />;
  }

  // Generic fallback for forms not yet customized
  return <GenericPrint req={req} tmpl={tmpl} usersMap={usersMap} />;
}

/* ═══════════════════════════════════════════════════════════════
   FM-IT-01-01 : แบบฟอร์มขอใช้ ระบบ/อุปกรณ์
   ═══════════════════════════════════════════════════════════════ */
function FormIT0101({ req, tmpl, usersMap }) {
  const sch = req.payload?.sch || req.payload || {};
  const requester = usersMap[req.requester] || {};
  const steps = req.steps || [];
  // Resolve approver/IT-staff info, falling back to step display data when no user is assigned
  const stepInfo = (s) => {
    if (!s) return null;
    // External signer step — name comes from form field, signature from the step itself
    if (s.source === "external") {
      return {
        nameTh: s.displayName || s.role || "",
        titleTh: s.displayTitle || "",
        signed: s.signed === true,
        at: s.at,
        signature: s.signature || null,
      };
    }
    const u = usersMap[s.user];
    if (u) return {
      nameTh: u.nameTh, titleTh: u.titleTh,
      signed: s.signed === true, at: s.at,
      signature: s.signature || u.signature || null,
    };
    if (s.role) return {
      nameTh: s.role, titleTh: "",
      signed: s.signed === true, at: s.at,
      signature: s.signature || null,
    };
    return null;
  };
  const requesterInfo = stepInfo(steps[0]) || {
    nameTh: requester.nameTh, titleTh: requester.titleTh,
    signed: true, at: req.createdAt,
    signature: requester.signature || null,
  };
  // Column mapping for the signature table:
  //   Col 1 (ผู้แจ้งเรื่อง) = step 0 (the requester)
  //   Col 3 (ผู้รับมอบ)    = the LAST step in the chain (the receiver — may be external)
  //   Col 2 (เจ้าหน้าที่ไอที) = the step immediately before the receiver (the IT staff
  //                              who fulfilled / handed over)
  const lastIdx = steps.length - 1;
  const receiverIdx = lastIdx >= 1 ? lastIdx : -1;
  const itStaffIdx  = lastIdx >= 2 ? lastIdx - 1 : -1;
  const itStaff = itStaffIdx  >= 0 ? stepInfo(steps[itStaffIdx])  : null;
  const approver = receiverIdx >= 0 ? stepInfo(steps[receiverIdx]) : null;

  const docNo = req.id;
  const fmtDate = (d) => {
    if (!d) return "";
    try {
      const parts = String(d).slice(0, 10).split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return d;
    } catch { return d; }
  };

  // Convenience helpers
  const cb = (v) => (v ? "[✓]" : "[  ]");
  const checked = (id) => {
    const v = sch[id];
    return v && typeof v === "object" ? v.checked === true : v === true;
  };
  const subV = (id, subId) => {
    const v = sch[id];
    if (!v || typeof v !== "object") return null;
    return v.sub?.[subId];
  };

  return (
    <>
      <PrintStyles />
      <div className="paper">
        <div className="no-print toolbar">
          <button onClick={() => window.print()}>🖨️ พิมพ์ / บันทึกเป็น PDF</button>
          <button onClick={() => window.close()}>ปิดหน้านี้</button>
        </div>

        {/* ─── PAGE 1 ─── */}
        <Page pageNum={1} totalPages={2}>
          <DocHeader />

          <h1 className="doc-title">แบบฟอร์มขอใช้ ระบบ/อุปกรณ์</h1>
          <div className="doc-no-line">
            เลขที่เอกสาร <span className="doc-no-value">{docNo}</span>
          </div>

          {/* Section 1: ข้อมูลพนักงาน */}
          <div className="sec-title">ส่วนที่ 1 : ข้อมูลพนักงาน</div>
          <div className="sec-body">
            <div className="line">
              <Field label="ชื่อ-นามสกุล" value={sch.employeeName || requester.nameTh} width="65%" />
              <Field label="รหัสพนักงาน" value={sch.employeeId || requester.id} width="33%" />
            </div>
            <div className="line">
              <Field label="ตำแหน่ง" value={sch.position || requester.titleTh} width="32%" />
              <Field label="ฝ่ายงาน" value={sch.department || requester.dept} width="32%" />
              <Field label="ส่วนงาน" value={sch.section} width="33%" />
            </div>
            <div className="line">
              <Field label="วันที่แจ้ง" value={fmtDate(sch.dateRequest)} width="32%" />
              <Field label="วันที่ต้องการให้มีผล" value={fmtDate(sch.dateEffective)} width="32%" />
              <Field label="เวลา" value={sch.time} width="33%" />
            </div>
          </div>

          {/* Section 2: ประเภทพนักงาน */}
          <div className="sec-title">ส่วนที่ 2 : ประเภทพนักงาน</div>
          <div className="sec-body">
            <div className="cb-line">{cb(sch.employeeType === "permanent")} ประจำ</div>
            <div className="cb-line">{cb(sch.employeeType === "contract")} สัญญาจ้าง</div>
          </div>

          {/* Section 3: ประเภทการร้องขอ */}
          <div className="sec-title">ส่วนที่ 3 : ประเภทการร้องขอ</div>
          <div className="sec-body">
            <div className="cb-line">{cb(sch.requestKind === "use")} ใช้งาน</div>
            <div className="cb-line">{cb(sch.requestKind === "cancel")} ยกเลิก</div>
            <div className="cb-line">{cb(sch.requestKind === "transfer")} โอนสิทธิ์</div>
          </div>

          {/* Section 4: รายการสิทธิ์และอุปกรณ์ */}
          <div className="sec-title">ส่วนที่ 4 : รายการสิทธิ์และอุปกรณ์</div>
          <div className="sec-body">
            {/* Email */}
            <div className="cb-line">{cb(checked("item_email"))} <b>Email บริษัท</b></div>
            <div className="indent">
              <div className="sub-line">
                <span>ระบุชื่อ Email ที่ต้องการ</span>
                <DotInline value={subV("item_email", "emailAddr")} width="50%" />
                <span>@talktome.co.th</span>
                <span className="hint">(โปรดระบุ)</span>
              </div>
              <div className="sub-line"><b>สิทธิ์ที่ต้องการ</b> <span className="hint">(โปรดระบุ)</span></div>
              <div className="indent">
                <div className="cb-line">{cb(subV("item_email", "emailRole") === "user")} User</div>
                <div className="cb-line">{cb(subV("item_email", "emailRole") === "admin")} Administrator</div>
              </div>
              <div className="sub-line"><b>ขนาดพื้นที่</b> <span className="hint">(โปรดระบุถ้ามีที่ต้องการใช้งาน)</span></div>
              <div className="indent">
                <div className="cb-line">{cb(subV("item_email", "emailSize") === "5")} 5 GB</div>
                <div className="cb-line">{cb(subV("item_email", "emailSize") === "10")} 10 GB</div>
                <div className="cb-line">{cb(subV("item_email", "emailSize") === "custom")} ............ GB</div>
              </div>
              <div className="sub-line"><b>ฟีเจอร์ปฏิทิน</b> <span className="hint">(โปรดระบุ)</span></div>
              <div className="indent">
                <div className="cb-line">{cb(subV("item_email", "emailCalendar") === true || subV("item_email", "emailCalendar") === "yes")} ต้องการฟีเจอร์ปฏิทิน</div>
                <div className="cb-line">{cb(subV("item_email", "emailCalendar") === false || subV("item_email", "emailCalendar") === "no")} ไม่ต้องการฟีเจอร์ปฏิทิน</div>
              </div>
            </div>

            {/* Group Email */}
            <div className="cb-line">{cb(checked("item_group"))} <b>Group Email (สำหรับแจกจ่าย)</b> <span className="hint">(โปรดระบุสมาชิก/ขึ้นกลุ่มแจกจ่าย)</span></div>
            <div className="indent">
              {[0, 1, 2].map(i => {
                const members = (subV("item_group", "members") || "").split("\n");
                return (
                  <div key={i} className="sub-line">
                    <span>Member {i + 1}</span>
                    <DotInline value={members[i] || ""} width="60%" />
                    <span>@talktome.co.th</span>
                  </div>
                );
              })}
            </div>
          </div>

          <PageFooter pageNum={1} totalPages={2} />
        </Page>

        {/* ─── PAGE 2 ─── */}
        <Page pageNum={2} totalPages={2}>
          <DocHeader />

          <div className="sec-body" style={{ marginTop: 8 }}>
            {/* PBX */}
            <div className="cb-line">{cb(checked("item_pbx"))} <b>User ระบบโทรศัพท์ PBX (เบอร์ต่อ Extension)</b> <span className="hint">(โปรดระบุสิทธิ์ที่ต้องการ)</span></div>
            <div className="indent">
              <div className="sub-line"><b>สิทธิ์ที่ต้องการ</b></div>
              <div className="indent">
                <div className="cb-line">{cb(subV("item_pbx", "pbxRole") === "user")} User</div>
                <div className="cb-line">{cb(subV("item_pbx", "pbxRole") === "supervisor")} Supervisor</div>
                <div className="cb-line">{cb(subV("item_pbx", "pbxRole") === "admin")} Administrator</div>
              </div>
            </div>

            <div className="cb-line">{cb(checked("item_pc"))} เครื่องคอมพิวเตอร์รูปแบบตั้งโต๊ะส่วนบุคคล (PC - Personal)</div>
            <div className="cb-line">{cb(checked("item_notebook"))} เครื่องคอมพิวเตอร์รูปแบบเเบบพกพาส่วนบุคคล (Notebook - Personal)</div>
            <div className="cb-line">{cb(checked("item_headset"))} ชุดหูฟังส่วนบุคคล (Headset - Personal)</div>

            <div className="cb-line">{cb(checked("item_vpn"))} <b>VPN Account (สำหรับ Work from home)</b></div>
            <div className="indent">
              <div className="sub-line">
                <span>สิทธิ์ในการเข้าถึงระบบ โครงการ</span>
                <DotInline value={subV("item_project", "project") || sch.project} width="60%" />
                <span className="hint">โปรดระบุ</span>
              </div>
            </div>

            <div className="cb-line">{cb(checked("item_msoffice"))} License MS Office</div>
            <div className="cb-line">{cb(checked("item_idcard"))} บัตรพนักงาน + สายคล้อง</div>
            <div className="cb-line">{cb(false)} โต๊ะ + เก้าอี้</div>
            <div className="cb-line">{cb(checked("item_other"))} อื่นๆ (ระบุ) <DotInline value={subV("item_other", "other")} width="55%" /></div>
          </div>

          {/* Section 5: จุดประสงค์ */}
          <div className="sec-title">ส่วนที่ 5 : จุดประสงค์ในการขอ</div>
          <div className="sec-body">
            <PurposeLines text={sch.purpose} />
          </div>

          {/* Signature table */}
          <table className="sig-table">
            <colgroup>
              <col style={{ width: "33.333%" }} />
              <col style={{ width: "33.333%" }} />
              <col style={{ width: "33.334%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ผู้แจ้งเรื่อง</th>
                <th>เจ้าหน้าที่ไอที</th>
                <th>ผู้รับมอบ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <SigCell name={requesterInfo.nameTh} title={requesterInfo.titleTh} signed={requesterInfo.signed} at={requesterInfo.at} signature={requesterInfo.signature} />
                <SigCell name={itStaff?.nameTh}  title={itStaff?.titleTh}  signed={itStaff?.signed}    at={itStaff?.at}  signature={itStaff?.signature} />
                <SigCell name={approver?.nameTh} title={approver?.titleTh} signed={approver?.signed}   at={approver?.at} signature={approver?.signature} />
              </tr>
            </tbody>
          </table>

          <PageFooter pageNum={2} totalPages={2} />
        </Page>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Generic fallback (สำหรับฟอร์มอื่นที่ยังไม่ทำ layout เฉพาะ)
   ═══════════════════════════════════════════════════════════════ */
function GenericPrint({ req, tmpl, usersMap }) {
  const sch = req.payload?.sch || req.payload || {};
  const sections = tmpl?.sections || [];
  const requester = usersMap[req.requester] || {};

  return (
    <>
      <PrintStyles />
      <div className="paper">
        <div className="no-print toolbar">
          <button onClick={() => window.print()}>🖨️ พิมพ์ / บันทึกเป็น PDF</button>
          <button onClick={() => window.close()}>ปิดหน้านี้</button>
        </div>
        <Page pageNum={1} totalPages={1}>
          <DocHeader docCode={tmpl?.code} formTitle={tmpl?.titleTh} />
          <h1 className="doc-title">{tmpl?.titleTh || "แบบฟอร์มคำขอ"}</h1>
          <div className="doc-no-line">เลขที่เอกสาร <span className="doc-no-value">{req.id}</span></div>

          {sections.map(sec => (
            <React.Fragment key={sec.id}>
              <div className="sec-title">{sec.titleTh}</div>
              <div className="sec-body">
                {(sec.fields || []).map(f => (
                  <GenericFieldRow key={f.id} field={f} value={sch[f.id]} />
                ))}
              </div>
            </React.Fragment>
          ))}

          <PageFooter pageNum={1} totalPages={1} />
        </Page>
      </div>
    </>
  );
}

function GenericFieldRow({ field, value }) {
  const label = field.labelTh;
  const hasOpts = Array.isArray(field.options) && field.options.length > 0;
  if (field.type === "radio" && hasOpts) {
    return (
      <div className="line" style={{ marginBottom: 4 }}>
        <span className="hint" style={{ marginRight: 12 }}>{label}:</span>
        {field.options.map(o => (
          <span key={o.id} style={{ marginRight: 16 }}>{value === o.id ? "[✓]" : "[  ]"} {o.labelTh}</span>
        ))}
      </div>
    );
  }
  if (field.type === "checkbox" && !hasOpts) {
    const checked = value && typeof value === "object" ? value.checked === true : value === true;
    return <div className="cb-line">{checked ? "[✓]" : "[  ]"} {label}</div>;
  }
  return (
    <div className="sub-line">
      <span>{label}:</span>
      <DotInline value={String(value || "")} width="70%" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Building blocks
   ═══════════════════════════════════════════════════════════════ */
function Page({ children }) {
  return <div className="page">{children}</div>;
}

function DocHeader() {
  return (
    <table className="header-table">
      <colgroup>
        <col style={{ width: "26%" }} />
        <col style={{ width: "44%" }} />
        <col style={{ width: "30%" }} />
      </colgroup>
      <tbody>
        <tr>
          <td rowSpan={3} className="logo-cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.jpg" alt="Talk to Me Co., Ltd." className="logo-img" />
          </td>
          <td className="h-cell">
            <span className="h-label">ชนิดเอกสาร</span>
            <span className="h-colon">:</span>
            <span className="h-value">แบบฟอร์ม</span>
          </td>
          <td className="h-cell">
            <span className="h-label">รหัสเอกสาร</span>
            <span className="h-colon">:</span>
            <span className="h-value">FM-IT-01-01</span>
          </td>
        </tr>
        <tr>
          <td className="h-cell">
            <span className="h-label">หน่วยงาน</span>
            <span className="h-colon">:</span>
            <span className="h-value">เทคโนโลยีสารสนเทศ</span>
          </td>
          <td className="h-cell">
            <span className="h-label">แก้ไขครั้งที่</span>
            <span className="h-colon">:</span>
            <span className="h-value">00</span>
          </td>
        </tr>
        <tr>
          <td className="h-cell">
            <span className="h-label">หัวข้อเรื่อง</span>
            <span className="h-colon">:</span>
            <span className="h-value">แบบฟอร์มขอใช้ ระบบ/อุปกรณ์</span>
          </td>
          <td className="h-cell">
            <span className="h-label">วันที่บังคับใช้</span>
            <span className="h-colon">:</span>
            <span className="h-value">01/03/2569</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PageFooter({ pageNum, totalPages }) {
  return (
    <div className="page-footer">
      <div className="footer-disclaimer">
        ข้าพเจ้าได้รับทราบ ลำดับขั้นตอนของเอกสารตามที่ระบุไว้แล้วได้ปฏิบัติงานเป็นบรรลุตามที่กำหนดให้ปฏิบัติเรียบร้อย
      </div>
      <div className="footer-page">หน้า {pageNum} จาก {totalPages}</div>
    </div>
  );
}

function SigCell({ name, title, signed, at, signature }) {
  // Parse "YYYY-MM-DD HH:mm" → { dd, mm, yy }
  let dd = "", mm = "", yy = "";
  if (at) {
    const m = String(at).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) { yy = m[1].slice(-2); mm = m[2]; dd = m[3]; }
  }
  // When a real signature image is present, hide the typed name (the image
  // replaces it visually — like a hand-signed paper form).
  const displayName = signature ? "" : (name || "");
  return (
    <td className="sig-cell">
      {signed && signature && (
        <div className="sig-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signature} alt="signature" className="sig-img" />
        </div>
      )}
      <div className="sig-row">
        <span className="sig-label">ลงชื่อ :</span>
        <span className="sig-fill">
          <span className="sig-text" title={name || ""}>{displayName}</span>
        </span>
      </div>
      <div className="sig-row">
        <span className="sig-label">ตำแหน่ง :</span>
        <span className="sig-fill">
          <span className="sig-text" title={title || ""}>{title || ""}</span>
        </span>
      </div>
      <div className="sig-row sig-date-row">
        <span className="sig-label">วันที่ :</span>
        <span className={"sig-date-slot" + (dd ? " is-filled" : "")}>{dd}</span>
        <span className="sig-slash">/</span>
        <span className={"sig-date-slot" + (mm ? " is-filled" : "")}>{mm}</span>
        <span className="sig-slash">/</span>
        <span className={"sig-date-slot" + (yy ? " is-filled" : "")}>{yy}</span>
      </div>
    </td>
  );
}

function Field({ label, value, width }) {
  return (
    <div className="field" style={{ width }}>
      <span className="field-lbl">{label} :</span>
      <span className="field-dots">
        <span className="field-val">{value || ""}</span>
      </span>
    </div>
  );
}

function DotInline({ value, width = "30%" }) {
  return (
    <span className="dot-inline" style={{ minWidth: width }}>
      <span className="dot-val">{value || ""}</span>
    </span>
  );
}

function PurposeLines({ text }) {
  const lines = String(text || "").split("\n");
  // Render 4 dotted lines; fill in from text
  return (
    <>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="purpose-line">
          <span className="purpose-val">{lines[i] || ""}</span>
        </div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Styles — A4 + Sarabun + match PDF
   ═══════════════════════════════════════════════════════════════ */
function PrintStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap');

      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #e5e7eb;
        font-family: 'Sarabun', 'Tahoma', sans-serif;
        color: #000;
        font-size: 14px;
        line-height: 1.5;
      }
      .paper { padding: 0; }
      .page {
        background: #fff;
        width: 210mm;
        min-height: 297mm;
        margin: 16px auto;
        padding: 14mm 16mm 18mm 16mm;
        box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        position: relative;
      }

      @media print {
        @page { size: A4; margin: 0; }
        html, body { background: #fff; }
        .paper { padding: 0; }
        .page {
          margin: 0;
          width: 210mm;
          min-height: 297mm;
          box-shadow: none;
          page-break-after: always;
          padding: 12mm 14mm 14mm 14mm;
        }
        .page:last-child { page-break-after: auto; }
        .no-print { display: none !important; }
      }

      /* Toolbar */
      .toolbar {
        position: sticky;
        top: 0;
        background: #1f6feb;
        padding: 12px 20px;
        display: flex;
        gap: 12px;
        z-index: 100;
      }
      .toolbar button {
        padding: 8px 16px;
        border: 0;
        border-radius: 6px;
        background: #fff;
        color: #1f6feb;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        font-family: inherit;
      }
      .toolbar button:hover { background: #f3f4f6; }

      /* Header table — 3 columns × 3 rows */
      .header-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        margin-bottom: 8px;
      }
      .header-table td {
        border: 1px solid #000;
        padding: 6px 10px;
        font-size: 12.5px;
        vertical-align: middle;
        overflow: hidden;
      }
      .logo-cell {
        text-align: center;
        vertical-align: middle;
        padding: 6px !important;
      }
      .logo-img {
        max-width: 100%;
        max-height: 90px;
        object-fit: contain;
        display: block;
        margin: 0 auto;
      }
      .h-cell {
        display: table-cell;
      }
      .h-cell .h-label {
        display: inline-block;
        min-width: 80px;
        font-weight: 500;
      }
      .h-cell .h-colon {
        margin: 0 6px;
      }
      .h-cell .h-value {
        font-weight: 500;
      }

      /* Title */
      .doc-title {
        text-align: center;
        font-size: 18px;
        font-weight: 700;
        margin: 16px 0 8px;
      }
      .doc-no-line {
        text-align: right;
        font-size: 12px;
        margin-bottom: 14px;
      }
      .doc-no-value {
        display: inline-block;
        min-width: 200px;
        border-bottom: 1px dotted #000;
        text-align: center;
        font-weight: 600;
      }

      /* Section title */
      .sec-title {
        font-weight: 700;
        margin: 18px 0 8px;
        font-size: 13.5px;
      }
      .sec-body {
        margin-bottom: 12px;
      }

      /* Field with dotted underline */
      .line {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
        line-height: 1.6;
      }
      .field {
        display: inline-flex;
        align-items: baseline;
        font-size: 12.5px;
      }
      .field-lbl { white-space: nowrap; margin-right: 4px; }
      .field-dots {
        flex: 1;
        border-bottom: 1px dotted #000;
        min-width: 60px;
        padding: 0 4px;
      }
      .field-val {
        font-weight: 500;
      }

      /* Checkbox lines */
      .cb-line {
        font-size: 12.5px;
        padding: 4px 0;
        line-height: 1.5;
      }
      .indent {
        padding-left: 24px;
      }
      .sub-line {
        font-size: 12.5px;
        padding: 1px 0;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px;
      }
      .hint { color: #1f6feb; font-size: 12px; }

      /* Inline dotted field */
      .dot-inline {
        display: inline-block;
        border-bottom: 1px dotted #000;
        padding: 0 4px;
        min-height: 1em;
        line-height: 1;
      }
      .dot-val { font-weight: 500; }

      /* Purpose lines */
      .purpose-line {
        border-bottom: 1px dotted #000;
        height: 1.6em;
        margin-bottom: 4px;
        padding: 0 4px;
      }
      .purpose-line:first-child .purpose-val {
        font-weight: 500;
      }

      /* Signature table — locked cell widths */
      .sig-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        margin-top: 20px;
      }
      .sig-table th, .sig-table td {
        border: 1px solid #000;
        padding: 10px 12px;
        font-size: 12.5px;
        vertical-align: top;
        text-align: left;
        overflow: hidden;
        word-break: break-word;
        box-sizing: border-box;
      }
      .sig-table th {
        text-align: center;
        background: #f3f4f6;
        font-weight: 700;
        padding: 6px 8px;
      }
      .sig-cell {
        height: 150px;
        max-width: 0;  /* together with table-layout: fixed prevents cell expand */
        position: relative;
        padding-top: 44px !important;  /* reserve space for signature image at top */
      }
      .sig-stamp {
        position: absolute;
        top: 6px; right: 8px;
        font-size: 9px;
        color: #047857;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 4px;
        padding: 1px 6px;
        font-weight: 600;
      }
      .sig-img-wrap {
        position: absolute;
        left: 0; right: 0;
        top: 2px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .sig-img {
        max-height: 40px;
        max-width: 85%;
        object-fit: contain;
        mix-blend-mode: multiply;
        opacity: 0.9;
        transform: rotate(-2deg);
      }
      .sig-date-slot {
        text-align: center;
        font-weight: 500;
        font-size: 11px;
        padding: 0 2px;
      }
      .sig-date-slot.is-filled {
        border-bottom: none;
        background: #fff;
      }
      .sig-row {
        margin: 6px 0;
        display: flex;
        align-items: baseline;
        gap: 4px;
        overflow: hidden;
        min-width: 0;
      }
      .sig-label {
        white-space: nowrap;
        flex-shrink: 0;
      }
      .sig-fill {
        flex: 1;
        min-width: 0;
        border-bottom: 1px dotted #000;
        padding: 0 4px;
        overflow: hidden;
      }
      .sig-text {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
      }
      .sig-date-row { gap: 2px; }
      .sig-date-slot {
        flex: 1;
        min-width: 0;
        border-bottom: 1px dotted #000;
        height: 1em;
      }
      .sig-slash { flex-shrink: 0; }

      /* Footer */
      .page-footer {
        position: absolute;
        bottom: 10mm;
        left: 16mm;
        right: 16mm;
        border-top: 1px solid #000;
        padding-top: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      .footer-disclaimer { flex: 1; padding-right: 16px; }
      .footer-page { white-space: nowrap; font-weight: 500; }
    `}</style>
  );
}
