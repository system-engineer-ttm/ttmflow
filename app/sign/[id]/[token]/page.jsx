"use client";
import React from "react";

export default function SignPage({ params }) {
  const { id, token } = params;
  const [state, setState] = React.useState({ loading: true });
  const [phase, setPhase] = React.useState("loading"); // loading | error | preview | signing | done

  React.useEffect(() => {
    fetch(`/api/sign/${encodeURIComponent(id)}/${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setState({ error: data.message || "เกิดข้อผิดพลาด" }); setPhase("error"); return; }
        setState(data);
        setPhase("preview");
      })
      .catch(e => { setState({ error: e.message }); setPhase("error"); });
  }, [id, token]);

  return (
    <div style={containerStyle}>
      <PageStyles />
      <div className="sg-card">
        <header className="sg-head">
          <div className="sg-logo">TTMFlow</div>
          <div className="sg-tag">e-Signature Portal</div>
        </header>

        {phase === "loading" && <Loading />}
        {phase === "error" && <ErrorView msg={state.error} />}
        {phase === "preview" && (
          <Preview state={state} onContinue={() => setPhase("signing")} />
        )}
        {phase === "signing" && (
          <Sign
            state={state} id={id} token={token}
            onBack={() => setPhase("preview")}
            onDone={() => setPhase("done")}
          />
        )}
        {phase === "done" && <Done state={state} id={id} />}

        <footer className="sg-foot">
          <div>Talk to Me Co., Ltd. — TTMFlow Document System</div>
        </footer>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="sg-body sg-center">
      <div className="sg-spinner" />
      <p>กำลังตรวจสอบลิงก์...</p>
    </div>
  );
}

function ErrorView({ msg }) {
  return (
    <div className="sg-body sg-center">
      <div className="sg-icon sg-icon-error">✕</div>
      <h2>ไม่สามารถดำเนินการได้</h2>
      <p className="sg-muted">{msg}</p>
      <p className="sg-muted sg-small">
        Could not process this link. กรุณาติดต่อผู้ส่งลิงก์เพื่อขอลิงก์ใหม่
      </p>
    </div>
  );
}

function Preview({ state, onContinue }) {
  const { request: req, token: tok } = state;
  return (
    <div className="sg-body">
      <h2>สวัสดี คุณ {tok.recipientName || "ผู้รับมอบ"}</h2>
      <p className="sg-muted">
        มีเอกสารรอการเซ็นรับของคุณ — กรุณาตรวจสอบรายละเอียดและลงนามด้านล่าง
      </p>

      <div className="sg-doc-card">
        <div className="sg-doc-row"><span>เลขที่เอกสาร</span><b style={{ fontFamily: "monospace" }}>{req.id}</b></div>
        <div className="sg-doc-row"><span>แบบฟอร์ม</span><b>{req.template}</b></div>
        <div className="sg-doc-row"><span>หัวข้อ</span><b>{req.titleTh}</b></div>
        <div className="sg-doc-row"><span>ผู้รับมอบ</span><b>{tok.recipientName}</b></div>
        {tok.recipientTitle && (
          <div className="sg-doc-row"><span>ตำแหน่ง</span><b>{tok.recipientTitle}</b></div>
        )}
        <div className="sg-doc-row">
          <span>ลิงก์หมดอายุ</span>
          <b>{new Date(tok.expiresAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</b>
        </div>
      </div>

      <a className="sg-link" href={`/print/${encodeURIComponent(req.id)}`} target="_blank" rel="noreferrer">
        📄 ดูเอกสาร PDF ต้นฉบับ
      </a>

      <button className="sg-btn sg-btn-primary" onClick={onContinue}>
        ดำเนินการเซ็นรับเอกสาร →
      </button>

      <p className="sg-small sg-muted sg-note">
        การกดเซ็นนี้ถือเป็นการรับทราบและยินยอมตามที่ระบุในเอกสารฉบับนี้
      </p>
    </div>
  );
}

function Sign({ state, id, token, onBack, onDone }) {
  const canvasRef = React.useRef(null);
  const [hasInk, setHasInk] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.strokeStyle = "#1e3a8a";
    let drawing = false, last = null;
    const pos = (e) => {
      const rect = c.getBoundingClientRect();
      const tt = e.touches ? e.touches[0] : e;
      return {
        x: (tt.clientX - rect.left) * (c.width / rect.width),
        y: (tt.clientY - rect.top)  * (c.height / rect.height),
      };
    };
    const start = (e) => { drawing = true; last = pos(e); e.preventDefault(); };
    const move = (e) => {
      if (!drawing) return;
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; setHasInk(true); e.preventDefault();
    };
    const end = () => { drawing = false; };
    c.addEventListener("pointerdown", start);
    c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => {
      c.removeEventListener("pointerdown", start);
      c.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  }, []);

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
    }
    setHasInk(false);
  };

  const submit = async () => {
    if (!hasInk) { setErr("กรุณาวาดลายเซ็นก่อน"); return; }
    setErr(""); setSubmitting(true);
    try {
      const c = canvasRef.current;
      const dataUrl = c.toDataURL("image/png");
      const res = await fetch(`/api/sign/${encodeURIComponent(id)}/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || data.error || "บันทึกไม่สำเร็จ"); return; }
      onDone();
    } catch (e) {
      setErr("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sg-body">
      <button className="sg-back" onClick={onBack}>← ย้อนกลับ</button>
      <h2>ลงลายเซ็น</h2>
      <p className="sg-muted">ใช้นิ้วหรือ stylus วาดลายเซ็นในกรอบด้านล่าง</p>

      <div className="sg-canvas-wrap">
        <canvas ref={canvasRef} width={560} height={220} style={{ touchAction: "none" }} />
        {!hasInk && <div className="sg-canvas-hint">เซ็นในกรอบนี้</div>}
      </div>
      <button className="sg-link" onClick={clearCanvas}>↻ ล้างและเซ็นใหม่</button>

      {err && <div className="sg-error">{err}</div>}

      <button className="sg-btn sg-btn-primary" onClick={submit} disabled={submitting}>
        {submitting ? "กำลังบันทึก..." : "✓ ยืนยันและส่งลายเซ็น"}
      </button>
    </div>
  );
}

function Done({ state, id }) {
  return (
    <div className="sg-body sg-center">
      <div className="sg-icon sg-icon-ok">✓</div>
      <h2>ขอบคุณ ลายเซ็นถูกบันทึกแล้ว</h2>
      <p className="sg-muted">
        เอกสาร {state?.request?.id} ได้รับลายเซ็นของคุณเรียบร้อย
      </p>
      <a className="sg-btn sg-btn-secondary" href={`/print/${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">
        📄 ดูสำเนา PDF
      </a>
      <p className="sg-muted sg-small">
        คุณสามารถปิดหน้าต่างนี้ได้
      </p>
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
  padding: "16px 14px",
  fontFamily: '"Sarabun", -apple-system, BlinkMacSystemFont, sans-serif',
};

function PageStyles() {
  return (
    <style>{`
      .sg-card {
        max-width: 560px;
        margin: 24px auto;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
        overflow: hidden;
      }
      .sg-head {
        background: #1f6feb;
        color: white;
        padding: 18px 22px;
      }
      .sg-logo { font-size: 18px; font-weight: 700; }
      .sg-tag { font-size: 12px; opacity: 0.85; margin-top: 2px; }
      .sg-body {
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .sg-body h2 { font-size: 18px; margin: 0; color: #0f172a; }
      .sg-muted { color: #64748b; font-size: 14px; }
      .sg-small { font-size: 12px; }
      .sg-center { align-items: center; text-align: center; padding: 36px 22px; }
      .sg-icon {
        width: 56px; height: 56px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 26px; color: white; font-weight: 700;
      }
      .sg-icon-error { background: #ef4444; }
      .sg-icon-ok    { background: #10b981; }
      .sg-doc-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px 16px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .sg-doc-row {
        display: flex; justify-content: space-between;
        font-size: 14px;
      }
      .sg-doc-row span { color: #64748b; }
      .sg-doc-row b { color: #0f172a; font-weight: 600; }
      .sg-link {
        display: inline-block;
        color: #1f6feb; text-decoration: underline;
        font-size: 14px; background: none; border: none;
        cursor: pointer; padding: 0; text-align: left;
      }
      .sg-btn {
        border: none; border-radius: 10px;
        padding: 14px 18px; font-size: 15px; font-weight: 600;
        cursor: pointer; font-family: inherit;
        transition: opacity 0.15s, transform 0.15s;
      }
      .sg-btn:hover { opacity: 0.92; }
      .sg-btn:active { transform: scale(0.98); }
      .sg-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .sg-btn-primary {
        background: #1f6feb; color: white;
        box-shadow: 0 4px 12px rgba(31, 111, 235, 0.25);
      }
      .sg-btn-secondary {
        background: #f1f5f9; color: #0f172a;
        text-decoration: none; text-align: center;
      }
      .sg-back {
        background: none; border: none;
        color: #64748b; font-size: 13px; text-align: left;
        cursor: pointer; padding: 0; align-self: flex-start;
      }
      .sg-canvas-wrap {
        position: relative;
        border: 2px dashed #cbd5e1;
        border-radius: 10px;
        background: #ffffff;
        overflow: hidden;
        aspect-ratio: 2.5 / 1;
      }
      .sg-canvas-wrap canvas {
        display: block;
        width: 100%; height: 100%;
        touch-action: none;
        cursor: crosshair;
      }
      .sg-canvas-hint {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        color: #94a3b8; font-size: 14px; pointer-events: none;
      }
      .sg-error {
        background: #fef2f2; color: #991b1b;
        border: 1px solid #fecaca;
        padding: 10px 14px; border-radius: 8px;
        font-size: 13px;
      }
      .sg-note {
        padding: 10px 14px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        color: #9a3412;
        line-height: 1.5;
      }
      .sg-spinner {
        width: 36px; height: 36px;
        border: 3px solid #e2e8f0;
        border-top-color: #1f6feb;
        border-radius: 50%;
        animation: sg-spin 0.8s linear infinite;
      }
      @keyframes sg-spin { to { transform: rotate(360deg); } }
      .sg-foot {
        background: #f8fafc;
        color: #94a3b8;
        font-size: 11px;
        padding: 12px 22px;
        text-align: center;
        border-top: 1px solid #f1f5f9;
      }
    `}</style>
  );
}
