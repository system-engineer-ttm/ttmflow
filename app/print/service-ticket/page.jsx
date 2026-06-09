"use client";
import React from "react";
import { ServiceTicketReport, ServiceTicketReportStyles } from "../../components/CaseSummary";

/* Standalone PDF document for the Service Ticket Summary — same pattern as
   /print/[id] (FM-IT-01-01): a toolbar with Print / Close, and the report
   laid out as A4 pages. Data is handed over via sessionStorage by the
   "Export as PDF" button on the Service Ticket Summary page. */
export default function ServiceTicketPrintPage() {
  const [state, setState] = React.useState({ loading: true });

  React.useEffect(() => {
    try {
      // The Export button writes to localStorage (sessionStorage doesn't
      // survive window.open in many browsers). Read, then clear the key so
      // it doesn't linger after the tab closes.
      const raw = localStorage.getItem("ttm.serviceTicket")
               || sessionStorage.getItem("ttm.serviceTicket"); // legacy fallback
      if (!raw) { setState({ loading: false, rows: null }); return; }
      const data = JSON.parse(raw);
      setState({ loading: false, rows: data.rows || [], fileName: data.fileName || "", dateRange: data.dateRange || "" });
      try { localStorage.removeItem("ttm.serviceTicket"); } catch (_) {}
    } catch (e) {
      setState({ loading: false, rows: null, error: e.message });
    }
  }, []);

  if (state.loading) {
    return <div style={{ padding: 40, fontFamily: "Sarabun, sans-serif" }}>กำลังโหลด…</div>;
  }

  if (!state.rows || state.rows.length === 0) {
    return (
      <div style={{ padding: 40, fontFamily: "Sarabun, sans-serif", textAlign: "center" }}>
        <h2>ไม่พบข้อมูลรายงาน</h2>
        <p style={{ color: "#64748b" }}>
          กรุณาเปิดหน้านี้ผ่านปุ่ม “Export เป็น PDF” ในเมนู Service Ticket Summary อีกครั้ง
        </p>
        <button onClick={() => window.close()} style={btnStyle}>ปิดหน้านี้</button>
      </div>
    );
  }

  return (
    <div className="stp-doc">
      <ServiceTicketReportStyles />
      <PrintPageStyles />

      {/* Toolbar — hidden on print */}
      <div className="no-print stp-toolbar">
        <button className="stp-btn stp-btn-primary" onClick={() => window.print()}>
          🖨️ พิมพ์ / บันทึกเป็น PDF
        </button>
        <button className="stp-btn" onClick={() => window.close()}>ปิดหน้านี้</button>
        <span className="stp-meta">
          {state.fileName ? <>ไฟล์: <b>{state.fileName}</b> · </> : null}
          {state.dateRange ? <>ข้อมูลตั้งแต่ <b>{state.dateRange}</b></> : null}
        </span>
      </div>

      {/* Tip — visible only on screen, reminds the user to enable background
          graphics so the orange/blue/purple table styling actually prints. */}
      <div className="no-print stp-tip">
        💡 <b>เคล็ดลับ:</b> ในหน้าต่างพิมพ์ของ Chrome ให้กด <b>“การตั้งค่าเพิ่มเติม”</b> แล้วเปิด
        <b> “กราฟิกพื้นหลัง”</b> เพื่อให้สีหัวตารางพิมพ์ออกมาด้วย — และปิด
        <b> “ส่วนหัวและส่วนท้ายกระดาษ”</b> เพื่อไม่ให้มี URL/วันที่ติดอยู่บนแต่ละหน้า
      </div>

      {/* The report — each .cs-section becomes an A4 page */}
      <div className="stp-paper">
        <ServiceTicketReport rows={state.rows} />
      </div>
    </div>
  );
}

const btnStyle = {
  marginTop: 16, padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1",
  background: "#fff", cursor: "pointer", fontFamily: "inherit",
};

function PrintPageStyles() {
  return (
    <style>{`
      .stp-doc {
        background: #e9edf3;
        min-height: 100vh;
        font-family: "Sarabun", -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .stp-toolbar {
        position: sticky; top: 0; z-index: 10;
        display: flex; align-items: center; gap: 10px;
        background: #1f6feb; color: white;
        padding: 12px 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .stp-btn {
        border: none; border-radius: 8px; cursor: pointer;
        padding: 8px 16px; font-size: 14px; font-weight: 600;
        font-family: inherit; background: rgba(255,255,255,0.18); color: white;
      }
      .stp-btn:hover { background: rgba(255,255,255,0.28); }
      .stp-btn-primary { background: white; color: #1f6feb; }
      .stp-btn-primary:hover { background: #f1f5f9; }
      .stp-meta { margin-left: auto; font-size: 12.5px; opacity: 0.95; }

      .stp-tip {
        background: #fff7ed;
        color: #9a3412;
        border-bottom: 1px solid #fed7aa;
        padding: 10px 20px;
        font-size: 12.5px;
        line-height: 1.55;
      }

      /* Each report section rendered as an A4 landscape sheet */
      .stp-paper {
        padding: 24px 0;
        display: flex; flex-direction: column; align-items: center; gap: 24px;
      }
      .stp-paper .cs-section {
        width: 277mm;                 /* A4 landscape printable width (297 - 2x10mm) */
        min-height: 190mm;            /* A4 landscape printable height */
        box-sizing: border-box;
        margin: 0;
        background: white;
        border: none;
        border-radius: 0;
        box-shadow: 0 4px 16px rgba(15,23,42,0.12);
        padding: 14mm;
      }

      @media print {
        @page { size: A4 landscape; margin: 10mm; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        .no-print { display: none !important; }
        .stp-doc { background: white; }
        .stp-paper { padding: 0; gap: 0; }
        .stp-paper .cs-section {
          width: auto; min-height: auto;
          box-shadow: none; padding: 0;
          page-break-after: always; break-after: page;
          page-break-inside: auto; break-inside: auto;
        }
        .stp-paper .cs-section:last-child { page-break-after: auto; break-after: auto; }

        /* If a section's table overflows, let it flow to the next sheet but
           (a) repeat the orange thead on each continuation page, and
           (b) never split a single <tr>, so a customer's block stays whole. */
        .cs-table thead { display: table-header-group; }
        .cs-table tfoot { display: table-footer-group; }
        .cs-table tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        /* Keep section title + first table row together on whatever page they
           land on, so we never get a stranded title at the bottom of a page. */
        .cs-section-head {
          page-break-after: avoid;
          break-after: avoid-page;
        }

        /* Compress everything for print so more rows fit on a single A4
           landscape sheet — the section title shrinks, the table cells lose
           padding, and bars/totals shrink to match. */
        .cs-section { padding: 8mm 10mm !important; }
        .cs-section-head h3 { font-size: 1.05rem !important; }
        .cs-section-head { padding-bottom: 5px !important; margin-bottom: 10px !important; }
        .cs-period, .cs-period-foot { font-size: 10px !important; }
        .cs-subhead { font-size: 11px !important; margin: 4px 0 8px !important; }

        .cs-table { font-size: 10.5px !important; }
        .cs-table th { padding: 5px 8px !important; }
        .cs-table td { padding: 4px 8px !important; line-height: 1.35 !important; }
        .cs-num   { font-size: 9.5px !important; }
        .cs-cust  { font-size: 10.5px !important; }

        /* Overview sheet — compact bars + totals */
        .cs-hbar-row { padding: 3px 0 !important; grid-template-columns: 140px 1fr 30px !important; }
        .cs-hbar-name { font-size: 10px !important; }
        .cs-hbar-track { height: 18px !important; }
        .cs-hbar { font-size: 10px !important; }
        .cs-hbar-total { font-size: 10px !important; }
        .cs-bar-legend { font-size: 10px !important; margin-top: 8px !important; }
        .cs-totals-table { font-size: 10px !important; }
        .cs-totals-table th, .cs-totals-table td { padding: 5px 8px !important; }
        .cs-grand { font-size: 1.05rem !important; }

        /* Internal pie — shrink a bit so the layout doesn't push to next page */
        .cs-internal { padding: 8px 0 !important; gap: 24px !important; }
        .cs-pie { width: 180px !important; height: 180px !important; }
      }
    `}</style>
  );
}
