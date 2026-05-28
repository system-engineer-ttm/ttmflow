"use client";
import React from "react";
import { Icon } from "./Icon";
import { cls, Button, IconButton } from "./Ui";

/**
 * SignatureSetup
 * One-time signature capture for the user account.
 * Renders as a blocking modal — user cannot dismiss until they save a signature.
 *
 * Props:
 *   lang       — "th" | "en"
 *   currentUser — { id, nameTh, nameEn, ... }
 *   onSaved    — callback(dataUrl) after successful save
 *   onSkip     — optional callback (only shown if dismissible)
 *   dismissible — if true, allow user to skip (default false → blocking)
 */
export function SignatureSetup({ lang, currentUser, onSaved, onSkip, dismissible = false }) {
  const [mode, setMode] = React.useState("draw"); // "draw" | "upload"
  const canvasRef = React.useRef(null);
  const [hasInk, setHasInk] = React.useState(false);
  const [uploadedImg, setUploadedImg] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  /* ── Canvas drawing ── */
  React.useEffect(() => {
    if (mode !== "draw") return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    // White background so PNG isn't transparent (works on PDF)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.strokeStyle = "#1e3a8a";
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
  }, [mode]);

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
    }
    setHasInk(false);
  };

  /* ── Upload handler ── */
  const handleUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(lang === "th" ? "ไฟล์ต้องเป็นรูปภาพเท่านั้น" : "File must be an image");
      return;
    }
    if (file.size > 1_500_000) {
      setError(lang === "th" ? "ไฟล์ขนาดเกิน 1.5 MB" : "File exceeds 1.5 MB");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImg(e.target.result);
    reader.readAsDataURL(file);
  };

  /* ── Save ── */
  const handleSave = async () => {
    setError("");
    let dataUrl = null;
    if (mode === "draw") {
      if (!hasInk) {
        setError(lang === "th" ? "กรุณาวาดลายเซ็นในกรอบก่อน" : "Please draw your signature first");
        return;
      }
      const c = canvasRef.current;
      dataUrl = c.toDataURL("image/png");
    } else if (mode === "upload") {
      if (!uploadedImg) {
        setError(lang === "th" ? "กรุณาอัปโหลดรูปลายเซ็น" : "Please upload a signature image");
        return;
      }
      dataUrl = uploadedImg;
    }
    if (!dataUrl) return;

    setSaving(true);
    try {
      const res = await fetch("/api/users/me/signature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (lang === "th" ? "บันทึกไม่สำเร็จ" : "Save failed"));
        return;
      }
      onSaved?.(data.signature);
    } catch (e) {
      setError(lang === "th" ? "เกิดข้อผิดพลาด: " + e.message : "Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ttm-modal-scrim" style={{ zIndex: 500 }}>
      <div className="ttm-modal ttm-sig-modal" style={{ maxWidth: 640 }}>
        <div className="ttm-modal-head">
          <div>
            <h3>
              <Icon name="signature" size={18} /> {lang === "th" ? "ตั้งค่าลายเซ็นของคุณ" : "Set up your signature"}
            </h3>
            <p>
              {lang === "th"
                ? "ระบบต้องการลายเซ็นอิเล็กทรอนิกส์ของคุณก่อนใช้งาน — ลายเซ็นนี้จะถูกแนบในเอกสารทุกฉบับที่คุณส่งหรืออนุมัติ"
                : "We need your e-signature before you continue — it will appear on every form you submit or approve"}
            </p>
          </div>
          {dismissible && <IconButton icon="x" onClick={onSkip} />}
        </div>

        <div className="ttm-modal-body">
          <div className="ttm-sig-setup-info">
            <Icon name="shield-check" size={16} />
            <div>
              <strong>{lang === "th" ? "ผู้ใช้:" : "Account:"} </strong>
              {lang === "th" ? currentUser?.nameTh : currentUser?.nameEn} ({currentUser?.username})
            </div>
          </div>

          <div className="ttm-sig-modes">
            <button type="button" className={cls("ttm-sig-mode", mode === "draw" && "is-active")} onClick={() => setMode("draw")}>
              <Icon name="signature" size={15} />
              {lang === "th" ? "วาดลายเซ็น" : "Draw"}
            </button>
            <button type="button" className={cls("ttm-sig-mode", mode === "upload" && "is-active")} onClick={() => setMode("upload")}>
              <Icon name="external" size={15} />
              {lang === "th" ? "อัปโหลดรูป" : "Upload image"}
            </button>
          </div>

          {mode === "draw" && (
            <div>
              <div className="ttm-sig-canvas-wrap">
                <canvas ref={canvasRef} width={560} height={180} className="ttm-sig-canvas" style={{ touchAction: "none" }} />
                {!hasInk && (
                  <div className="ttm-sig-canvas-hint">
                    {lang === "th" ? "ใช้นิ้วหรือ stylus วาดลายเซ็นในกรอบนี้" : "Draw your signature inside this box"}
                  </div>
                )}
              </div>
              <div className="ttm-sig-canvas-toolbar">
                <button type="button" className="ttm-link" onClick={clearCanvas}>
                  <Icon name="trash" size={12} /> {lang === "th" ? "ล้างและวาดใหม่" : "Clear and redraw"}
                </button>
              </div>
            </div>
          )}

          {mode === "upload" && (
            <div className="ttm-sig-upload-zone">
              {uploadedImg ? (
                <div className="ttm-sig-upload-preview">
                  <img src={uploadedImg} alt="signature" />
                  <button type="button" className="ttm-link" onClick={() => setUploadedImg(null)}>
                    <Icon name="trash" size={12} /> {lang === "th" ? "ลบและอัปโหลดใหม่" : "Remove"}
                  </button>
                </div>
              ) : (
                <label className="ttm-sig-upload">
                  <Icon name="external" size={28} />
                  <div>
                    <strong>{lang === "th" ? "เลือกไฟล์รูปลายเซ็น" : "Choose signature image"}</strong>
                    <p>{lang === "th" ? "PNG / JPG พื้นโปร่งใสหรือพื้นขาว ขนาดไม่เกิน 1.5 MB" : "PNG / JPG with transparent or white background, up to 1.5 MB"}</p>
                  </div>
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
              )}
            </div>
          )}

          {error && (
            <div className="ttm-sig-setup-error">
              <Icon name="x" size={14} /> {error}
            </div>
          )}

          <div className="ttm-sig-setup-note">
            <Icon name="bell" size={13} />
            <span>
              {lang === "th"
                ? "ลายเซ็นนี้จะถูกเก็บไว้ในบัญชีของคุณ และนำไปใช้อัตโนมัติเมื่อคุณส่งคำขอหรืออนุมัติเอกสาร คุณสามารถเปลี่ยนได้ภายหลังจากเมนู Tweaks"
                : "Your signature will be saved to your account and used automatically when submitting or approving requests. You can change it later from Tweaks."}
            </span>
          </div>
        </div>

        <div className="ttm-modal-foot">
          {dismissible && (
            <Button variant="ghost" onClick={onSkip}>
              {lang === "th" ? "ข้ามไปก่อน" : "Skip for now"}
            </Button>
          )}
          <Button variant="primary" icon="check" onClick={handleSave} disabled={saving}>
            {saving
              ? (lang === "th" ? "กำลังบันทึก..." : "Saving...")
              : (lang === "th" ? "บันทึกลายเซ็น & ดำเนินการต่อ" : "Save & continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
