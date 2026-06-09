"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Button, Card } from "./Ui";

/* ─────────────────────────────────────────────────────────────
   Case Summary — upload a Ticket export CSV and render a
   two-section report (Customer Support + Internal Support)
   styled after the user's PowerPoint reference.
   Internal = rows where Customer === "Inbound"
   Customer = every other row
   ───────────────────────────────────────────────────────────── */
export function CaseSummary({ lang }) {
  const th = lang === "th";
  const [rows, setRows] = React.useState(null);   // parsed objects, or null
  const [fileName, setFileName] = React.useState("");
  const [error, setError] = React.useState("");

  const handleFile = async (file) => {
    setError("");
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setError(th ? "รองรับเฉพาะไฟล์ .csv" : "Only .csv files are supported");
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setError(th ? "ไฟล์ว่างหรืออ่านไม่ได้" : "File is empty or unreadable");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch (e) {
      setError((th ? "อ่านไฟล์ไม่สำเร็จ: " : "Failed to read file: ") + e.message);
    }
  };

  if (!rows) {
    return <UploadStep th={th} onFile={handleFile} error={error} />;
  }

  /* ── Split & summarise ── */
  const customerRows = rows.filter(r => !isInbound(r));
  const internalRows = rows.filter(r => isInbound(r));
  const dateRange = detectDateRange(rows);

  return (
    <div className="ttm-page cs-page">
      <PrintStyles />

      {/* ── Top toolbar (hidden on print) ── */}
      <div className="cs-toolbar no-print">
        <div>
          <h2 style={{ margin: 0 }}>Service Ticket Summary</h2>
          <div className="ttm-muted ttm-small" style={{ marginTop: 4 }}>
            {th ? "อ่านจากไฟล์: " : "Source: "}<b>{fileName}</b>
            {dateRange && <> · {th ? "ช่วงข้อมูล" : "Period"}: <b>{dateRange}</b></>}
            {" · "}{th ? "ทั้งหมด" : "Total"}: <b>{rows.length}</b> {th ? "เคส" : "cases"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" icon="external" onClick={() => setRows(null)}>
            {th ? "อัปโหลดใหม่" : "Upload new"}
          </Button>
          <Button variant="primary" icon="download" onClick={() => window.print()}>
            {th ? "พิมพ์ / บันทึก PDF" : "Print / Save PDF"}
          </Button>
        </div>
      </div>

      {/* ── Customer Support ── */}
      <SectionRequestByCategory title="Customer Support - Request" data={customerRows.filter(r => isRequest(r))} dateRange={dateRange} />
      <SectionIncidentExamples title="Customer Support - Incident" data={customerRows.filter(r => isIncident(r))} dateRange={dateRange} />
      <SectionCustomerOverview title="Customer Support" data={customerRows} dateRange={dateRange} />

      {/* ── Internal Support ── */}
      <SectionInternalOverview title="Internal Support" data={internalRows} dateRange={dateRange} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Upload step — drag & drop or click to choose
   ───────────────────────────────────────────────────────────── */
function UploadStep({ th, onFile, error }) {
  const inputRef = React.useRef(null);
  const [hover, setHover] = React.useState(false);

  return (
    <div className="ttm-page">
      <div className="ttm-list-head">
        <div>
          <h2>Service Ticket Summary</h2>
          <p>{th
            ? "อัปโหลดไฟล์ CSV report จากระบบ Ticket — ระบบจะสร้างรายงาน 2 ส่วน (Internal + Customer Support)"
            : "Upload the Ticket export CSV — we'll build a 2-section report (Internal + Customer Support)."}</p>
        </div>
      </div>

      <Card>
        <div
          className={cls("cs-drop", hover && "is-hover")}
          onDragOver={e => { e.preventDefault(); setHover(true); }}
          onDragLeave={() => setHover(false)}
          onDrop={e => {
            e.preventDefault(); setHover(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
        >
          <Icon name="external" size={36} />
          <h3>{th ? "ลากไฟล์ CSV มาวางที่นี่" : "Drop your CSV file here"}</h3>
          <p>{th ? "หรือคลิกเพื่อเลือกไฟล์" : "or click to choose a file"}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={e => onFile(e.target.files?.[0])}
          />
        </div>
        {error && (
          <div className="cs-error">
            <Icon name="x" size={14} /> {error}
          </div>
        )}
        <div className="cs-helper">
          <b>{th ? "คอลัมน์ที่ใช้:" : "Columns used:"}</b>{" "}
          <code>Customer</code>, <code>Type</code>, <code>Subject</code>, <code>Category</code>,
          {" "}<code>Sub Category</code>, <code>Problem</code>, <code>Solotion</code>,
          {" "}<code>Open Time</code>, <code>Resolved Time</code>
        </div>
      </Card>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   SECTION 1 — Customer Support · Request
   Table: No. | Customer Name | Category (Sub Category) | จำนวน
   Grouped by Customer → Sub Category
   ═════════════════════════════════════════════════════════════ */
function SectionRequestByCategory({ title, data, dateRange }) {
  // Group by customer → sub category
  const byCustomer = new Map();
  data.forEach(r => {
    const cust = canonicalCustomer(r.Customer);
    const sub  = (r["Sub Category"] || r.Category || "—").trim() || "—";
    if (!byCustomer.has(cust)) byCustomer.set(cust, new Map());
    const cats = byCustomer.get(cust);
    cats.set(sub, (cats.get(sub) || 0) + 1);
  });
  const customers = [...byCustomer.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "th"));

  return (
    <section className="cs-section">
      <div className="cs-section-head">
        <h3>{title}</h3>
        {dateRange && <span className="cs-period">ข้อมูลตั้งแต่ {dateRange}</span>}
      </div>
      <table className="cs-table cs-table-request">
        <thead>
          <tr>
            <th style={{ width: 60 }}>No.</th>
            <th style={{ width: "26%" }}>Customer Name</th>
            <th>หมวดหมู่ (Category)</th>
            <th style={{ width: "16%", textAlign: "center" }}>จำนวน</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && (
            <tr><td colSpan={4} className="cs-empty">— ไม่มีข้อมูล —</td></tr>
          )}
          {customers.map(([cust, cats], i) => {
            const list = [...cats.entries()].sort((a, b) => b[1] - a[1]);
            const groupCls = i % 2 === 0 ? "cs-grp-a" : "cs-grp-b";
            return list.map(([cat, count], j) => (
              <tr key={cust + cat} className={cls(groupCls, j === 0 && "cs-grp-start")}>
                {j === 0 && (
                  <>
                    <td rowSpan={list.length} className="cs-num">{i + 1}.</td>
                    <td rowSpan={list.length} className="cs-cust">{cust}</td>
                  </>
                )}
                <td>{cat}</td>
                <td style={{ textAlign: "center" }}>{count}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   SECTION 2 — Customer Support · Incident
   "3 Examples of incident event cases"
   ═════════════════════════════════════════════════════════════ */
function SectionIncidentExamples({ title, data, dateRange }) {
  // Only show incidents that actually have a recorded solution.
  const hasSolve = (r) => String(r.Solotion || "").trim() !== "";
  const examples = data.filter(hasSolve).slice(0, 3);

  return (
    <section className="cs-section">
      <div className="cs-section-head">
        <h3>{title}</h3>
        {dateRange && <span className="cs-period">ข้อมูลตั้งแต่ {dateRange}</span>}
      </div>
      <h4 className="cs-subhead">3 Examples of incident event cases</h4>
      <table className="cs-table cs-table-incident">
        <thead>
          <tr>
            <th style={{ width: 50 }}>No.</th>
            <th style={{ width: "12%" }}>Customer<br />Name</th>
            <th style={{ width: "26%" }}>Issue</th>
            <th>Solve</th>
            <th style={{ width: 100 }}>Open date</th>
            <th style={{ width: 110 }}>Resolved Date</th>
          </tr>
        </thead>
        <tbody>
          {examples.length === 0 && (
            <tr><td colSpan={6} className="cs-empty">— ไม่มีข้อมูล Incident —</td></tr>
          )}
          {examples.map((r, i) => (
            <tr key={r["Ticket No."] || i}>
              <td className="cs-num">{i + 1}.</td>
              <td className="cs-cust">{canonicalCustomer(r.Customer)}</td>
              <td>
                <span className="cs-bullet">×</span>{" "}
                {r.Problem || r.Subject || "—"}
              </td>
              <td>
                <span className="cs-bullet cs-ok">✓</span>{" "}
                {r.Solotion || r.Cause || "—"}
              </td>
              <td>{fmtDate(r["Open Time"])}</td>
              <td>{fmtDate(r["Resolved Time"])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   SECTION 3 — Customer Support · per-customer chart + totals
   ═════════════════════════════════════════════════════════════ */
function SectionCustomerOverview({ title, data, dateRange }) {
  return (
    <section className="cs-section">
      <div className="cs-section-head">
        <h3>{title}</h3>
      </div>
      <OverviewChart data={data} />
      <div className="cs-period-foot">ข้อมูลตั้งแต่ {dateRange || "—"}</div>
    </section>
  );
}

function OverviewChart({ data }) {
  // Build per-customer × type counts
  const customers = new Map();   // cust → { Incident, Request, Inquiry, total }
  data.forEach(r => {
    const cust = canonicalCustomer(r.Customer);
    const type = (r.Type || "").trim();
    if (!customers.has(cust)) customers.set(cust, { Incident: 0, Request: 0, Inquiry: 0, total: 0 });
    const m = customers.get(cust);
    if (type === "Incident" || type === "Request" || type === "Inquiry") { m[type]++; m.total++; }
  });
  // Sort by busiest customer first — the report reads top-down by volume
  const rows = [...customers.entries()].sort((a, b) => b[1].total - a[1].total);

  const totals = { Incident: 0, Request: 0, Inquiry: 0 };
  data.forEach(r => {
    const t = (r.Type || "").trim();
    if (totals[t] !== undefined) totals[t]++;
  });
  const grand = totals.Incident + totals.Request + totals.Inquiry;

  // Scale by the busiest customer's total (stacked horizontal bar)
  const max = Math.max(1, ...rows.map(([, c]) => c.total));

  return (
    <div className="cs-overview-v">
      <div className="cs-hbar-wrap">
        {rows.length === 0 && (
          <div className="cs-empty" style={{ padding: "2rem 0" }}>— ไม่มีข้อมูล —</div>
        )}
        {rows.map(([cust, c]) => (
          <div key={cust} className="cs-hbar-row">
            <div className="cs-hbar-name" title={cust}>{cust}</div>
            <div className="cs-hbar-track">
              {c.Incident > 0 && (
                <div className="cs-hbar cs-bar-incident" style={{ width: `${(c.Incident / max) * 100}%` }}>
                  {c.Incident}
                </div>
              )}
              {c.Request > 0 && (
                <div className="cs-hbar cs-bar-request" style={{ width: `${(c.Request / max) * 100}%` }}>
                  {c.Request}
                </div>
              )}
              {c.Inquiry > 0 && (
                <div className="cs-hbar cs-bar-inquiry" style={{ width: `${(c.Inquiry / max) * 100}%` }}>
                  {c.Inquiry}
                </div>
              )}
            </div>
            <div className="cs-hbar-total">{c.total}</div>
          </div>
        ))}

        <div className="cs-bar-legend" style={{ marginTop: 16 }}>
          <span><i className="cs-dot cs-bar-incident" /> Incident</span>
          <span><i className="cs-dot cs-bar-request" /> Request</span>
          <span><i className="cs-dot cs-bar-inquiry" /> Inquiry</span>
        </div>
      </div>

      <div className="cs-totals">
        <table className="cs-totals-table">
          <thead>
            <tr>
              <th>Case type</th>
              <th>Amount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Incident</td><td>{totals.Incident}</td><td rowSpan={3} className="cs-grand">{grand}</td></tr>
            <tr><td>Request</td><td>{totals.Request}</td></tr>
            <tr><td>Inquiry</td><td>{totals.Inquiry}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   SECTION 4 — Internal Support · pie + totals
   ═════════════════════════════════════════════════════════════ */
function SectionInternalOverview({ title, data, dateRange }) {
  const totals = { Incident: 0, Request: 0 };
  data.forEach(r => {
    const t = (r.Type || "").trim();
    if (totals[t] !== undefined) totals[t]++;
  });
  const total = totals.Incident + totals.Request;

  return (
    <section className="cs-section">
      <div className="cs-section-head">
        <h3>{title}</h3>
      </div>
      <div className="cs-internal">
        <div className="cs-pie-wrap">
          <Pie incident={totals.Incident} request={totals.Request} />
          <div className="cs-bar-legend" style={{ marginTop: 14 }}>
            <span><i className="cs-dot cs-bar-incident" /> Incident</span>
            <span><i className="cs-dot cs-bar-request" /> Request</span>
          </div>
        </div>
        <div>
          <table className="cs-totals-table">
            <thead>
              <tr>
                <th>Case type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Incident</td><td>{totals.Incident}</td></tr>
              <tr><td>Request</td><td>{totals.Request}</td></tr>
              <tr className="cs-grand-row"><td>Total</td><td>{total}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="cs-period-foot">ข้อมูลตั้งแต่ {dateRange || "—"}</div>
    </section>
  );
}

function Pie({ incident, request }) {
  const total = incident + request;
  if (total === 0) {
    return (
      <div className="cs-pie-empty">
        <span>0</span>
        <small>no data</small>
      </div>
    );
  }

  const r = 80;
  const cx = 100, cy = 100;
  const INC_COLOR = "#ee6c4d";
  const REQ_COLOR = "#1d4ed8";

  // Label position helper — places the count at the angular midpoint of a slice
  const labelAt = (midDeg, count, color) => {
    const a = (midDeg - 90) * Math.PI / 180;
    return (
      <text x={cx + r * 0.5 * Math.cos(a)} y={cy + r * 0.5 * Math.sin(a)}
            textAnchor="middle" dominantBaseline="middle"
            fill="#fff" fontSize="16" fontWeight="700">{count}</text>
    );
  };

  // ── Single category → full circle (an SVG <path> arc can't draw 360°,
  //    start==end is degenerate and renders nothing). Use <circle>. ──
  if (incident === 0 || request === 0) {
    const only = incident > 0 ? incident : request;
    const color = incident > 0 ? INC_COLOR : REQ_COLOR;
    return (
      <svg viewBox="0 0 200 200" className="cs-pie">
        <circle cx={cx} cy={cy} r={r} fill={color} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontSize="20" fontWeight="700">{only}</text>
      </svg>
    );
  }

  // ── Two categories → two arcs ──
  const incFrac = incident / total;
  const incAngle = incFrac * 360;
  const arc = (start, end) => {
    const s = (start - 90) * Math.PI / 180;
    const e = (end   - 90) * Math.PI / 180;
    const large = (end - start) > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };
  return (
    <svg viewBox="0 0 200 200" className="cs-pie">
      <path d={arc(0, incAngle)}   fill={INC_COLOR} />
      <path d={arc(incAngle, 360)} fill={REQ_COLOR} />
      {labelAt(incAngle / 2, incident, INC_COLOR)}
      {labelAt((incAngle + 360) / 2, request, REQ_COLOR)}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */
function isRequest(r)  { return (r.Type || "").trim() === "Request"; }
function isIncident(r) { return (r.Type || "").trim() === "Incident"; }

// Internal customer = "Inbound" regardless of decoration around it, e.g.
// "Inbound", "- : Inbound", "Inbound:" all count. We strip every
// non-alphanumeric character and compare, so "Inbound-24x7" (which becomes
// "inbound24x7") stays a Customer Support client.
function isInbound(r) {
  return String(r.Customer || "").replace(/[^a-z0-9]/gi, "").toLowerCase() === "inbound";
}

// Canonical customer name used for grouping/counting so different
// decorations of the same customer collapse into one. All "Inbound"
// variants become a single "Inbound" customer.
function canonicalCustomer(name) {
  const raw = String(name || "").trim();
  if (raw.replace(/[^a-z0-9]/gi, "").toLowerCase() === "inbound") return "Inbound";
  return raw || "—";
}

function fmtDate(s) {
  if (!s) return "—";
  // Input shape from CSV: "28/5/2026 15:07" → "28/05/2026"
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return String(s).slice(0, 10);
  return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
}

function detectDateRange(rows) {
  const dates = rows
    .map(r => r["Open Time"])
    .map(s => {
      if (!s) return null;
      const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!m) return null;
      return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    })
    .filter(Boolean);
  if (dates.length === 0) return "";
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  const f = (d) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()+543).slice(-2)}`;
  return `${f(min)} - ${f(max)}`;
}

/* ─────────────────────────────────────────────────────────────
   Minimal CSV parser — handles "quoted fields with, commas" and
   embedded \n inside quotes. Splits on , and \r\n / \n at row level.
   ───────────────────────────────────────────────────────────── */
function parseCsv(text) {
  // Normalise line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(v => String(v).trim() !== ""))
    .map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = r[idx] !== undefined ? r[idx] : ""; });
      return obj;
    });
}

/* ─────────────────────────────────────────────────────────────
   Styles — scoped to .cs-* class names. Includes a print
   variant so "Print / Save PDF" produces a clean handout.
   ───────────────────────────────────────────────────────────── */
function PrintStyles() {
  return (
    <style>{`
      .cs-page { padding: 1.5rem 2rem; max-width: 1100px; margin: 0 auto; }
      .cs-toolbar {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 16px; margin-bottom: 24px;
      }

      /* Upload */
      .cs-drop {
        border: 2px dashed var(--border-strong);
        border-radius: 14px;
        padding: 48px 24px;
        text-align: center;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .cs-drop.is-hover { border-color: var(--brand); background: var(--brand-soft); }
      .cs-drop h3 { margin: 14px 0 6px; }
      .cs-drop p  { color: var(--muted); }
      .cs-drop svg { color: var(--muted); }
      .cs-error {
        margin-top: 14px; padding: 10px 14px;
        background: #fef2f2; color: #991b1b;
        border: 1px solid #fecaca; border-radius: 8px;
        display: flex; align-items: center; gap: 8px; font-size: 0.85rem;
      }
      .cs-helper {
        margin-top: 16px; padding: 12px 14px;
        font-size: 0.78rem; color: var(--muted);
        background: var(--surface-2); border-radius: 8px;
      }
      .cs-helper code {
        background: var(--surface); border: 1px solid var(--border);
        padding: 1px 6px; border-radius: 4px; font-size: 0.72rem;
      }

      /* Section card */
      .cs-section {
        background: white; border: 1px solid var(--border);
        border-radius: 8px; padding: 24px; margin-bottom: 24px;
        position: relative; break-inside: avoid; page-break-inside: avoid;
      }
      .cs-section-head {
        display: flex; justify-content: space-between; align-items: baseline;
        padding-bottom: 8px; border-bottom: 2px solid #0f172a;
        margin-bottom: 16px;
      }
      .cs-section-head h3 {
        margin: 0; font-size: 1.45rem; font-weight: 500;
        color: #0f172a; letter-spacing: 0.01em;
      }
      .cs-period { font-size: 0.78rem; color: var(--muted); }
      .cs-subhead {
        font-size: 0.95rem; font-weight: 700;
        margin: 8px 0 12px; text-decoration: underline;
      }
      .cs-period-foot {
        margin-top: 12px; font-size: 0.78rem; color: var(--muted);
      }

      /* Tables */
      .cs-table {
        width: 100%; border-collapse: collapse;
        font-size: 0.82rem; color: #0f172a;
      }
      .cs-table th {
        background: #ee6c4d; color: white; font-weight: 600;
        padding: 10px 12px; text-align: left; vertical-align: middle;
      }
      .cs-table td {
        padding: 8px 12px; border-top: 1px solid #fde2d6; vertical-align: top;
        background: #fbe6dc;
      }
      .cs-table tbody tr:nth-child(even) td { background: #fde9dd; }
      .cs-num { text-align: center; color: #64748b; font-size: 0.78rem; }
      .cs-cust { font-weight: 600; font-size: 0.85rem; }

      /* Request table — alternate the whole customer block, not row-by-row,
         and draw a strong divider between customers so each is easy to scan. */
      .cs-table-request tbody tr.cs-grp-a td { background: #fdeee7 !important; }
      .cs-table-request tbody tr.cs-grp-b td { background: #fbded0 !important; }
      .cs-table-request tbody tr.cs-grp-start td { border-top: 2px solid #ee6c4d; }
      .cs-table-request .cs-num,
      .cs-table-request .cs-cust { border-right: 1px solid #f3c9b6; }
      .cs-empty {
        padding: 28px !important; text-align: center; color: var(--muted);
        font-size: 0.85rem; background: #fbe6dc !important;
      }

      /* Incident table (blue header) */
      .cs-table-incident th { background: #2c5282; }
      .cs-table-incident td { background: #e8eef8; }
      .cs-table-incident tbody tr:nth-child(even) td { background: #d6e0ef; }
      .cs-bullet { color: #2c5282; font-weight: 700; margin-right: 4px; }
      .cs-bullet.cs-ok { color: #047857; }

      /* Overview — horizontal bars (left) + totals table (right) */
      .cs-overview-v {
        display: grid; grid-template-columns: 1fr 320px; gap: 28px;
        align-items: start;
      }
      .cs-hbar-wrap { width: 100%; }
      .cs-hbar-row {
        display: grid;
        grid-template-columns: 150px 1fr 34px;
        align-items: center; gap: 12px;
        padding: 5px 0;
      }
      .cs-hbar-row + .cs-hbar-row { border-top: 1px solid #f1f5f9; }
      .cs-hbar-name {
        font-size: 0.78rem; color: #334155; text-align: right;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cs-hbar-track {
        display: flex; align-items: stretch; height: 22px;
        background: #f1f5f9; border-radius: 4px; overflow: hidden;
      }
      .cs-hbar {
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 11px; font-weight: 700;
        min-width: 18px; transition: width 0.2s;
      }
      .cs-hbar-total {
        font-size: 0.82rem; font-weight: 700; color: #0f172a; text-align: center;
      }
      .cs-bar-incident { background: #ee6c4d; }
      .cs-bar-request  { background: #1d4ed8; }
      .cs-bar-inquiry  { background: #16a34a; }
      .cs-bar-legend {
        display: flex; gap: 18px; margin-top: 14px;
        font-size: 0.78rem; color: #475569;
      }
      .cs-dot {
        display: inline-block; width: 12px; height: 12px;
        margin-right: 6px; vertical-align: middle; border-radius: 2px;
      }

      /* Totals table */
      .cs-totals-table {
        width: 100%; border-collapse: collapse;
        font-size: 0.82rem;
      }
      .cs-totals-table th {
        background: #7c3aed; color: white; padding: 8px 12px;
        text-align: center; font-weight: 600;
      }
      .cs-totals-table td {
        background: #f5f3ff; padding: 8px 12px;
        text-align: center; border-top: 1px solid #ddd6fe;
      }
      .cs-grand { font-size: 1.3rem; font-weight: 700; }
      .cs-grand-row td { background: #ede9fe; font-weight: 700; }

      /* Internal Support */
      .cs-internal {
        display: grid; grid-template-columns: 280px 1fr; gap: 36px;
        align-items: center; padding: 24px 0;
      }
      .cs-pie-wrap { display: flex; flex-direction: column; align-items: center; }
      .cs-pie { width: 220px; height: 220px; display: block; }
      .cs-pie-empty {
        width: 220px; height: 220px; border-radius: 50%;
        background: #e2e8f0; color: #64748b;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      }
      .cs-pie-empty span { font-size: 28px; font-weight: 700; }
      .cs-pie-empty small { font-size: 12px; margin-top: 4px; }

      /* Print */
      @media print {
        .no-print { display: none !important; }
        .cs-page { padding: 0; max-width: none; }
        .cs-section {
          margin-bottom: 0;
          page-break-after: always;
          border: none; padding: 16mm;
          box-shadow: none;
        }
        .cs-section:last-of-type { page-break-after: auto; }
        body { background: white !important; }
      }
    `}</style>
  );
}
