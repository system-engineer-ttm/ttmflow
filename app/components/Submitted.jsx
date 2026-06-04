"use client";
import { Icon } from "./Icon";
import { cls, Button, Card, SectionTitle } from "./Ui";
import { useAppData } from "../lib/AppDataContext";

export function Submitted({ lang, t, docNo, back }) {
  const { REQUESTS, USERS } = useAppData();
  const req = REQUESTS.find(r => r.id === docNo);
  // steps[0] is the requester (auto-signed). The "what happens next" list
  // covers steps[1+].
  const pendingSteps = (req?.steps || []).slice(1);
  const openPreview = () => {
    if (!docNo) return;
    window.open(`/print/${encodeURIComponent(docNo)}`, "_blank", "noopener,noreferrer");
  };
  const openDownload = () => {
    if (!docNo) return;
    window.open(`/print/${encodeURIComponent(docNo)}?print=1`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="ttm-page ttm-submitted">
      <Card className="ttm-submitted-card">
        <div className="ttm-submitted-hero">
          <div className="ttm-submitted-ring">
            <Icon name="check" size={36} stroke={2.5} />
          </div>
          <h2>{lang === "th" ? "ส่งคำขอเรียบร้อย" : "Request submitted"}</h2>
          <p>{lang === "th" ? "ระบบสร้างเลขเอกสารและกระจายงานให้ผู้อนุมัติเรียบร้อยแล้ว" : "Document number issued and approvers have been notified."}</p>
          <div className="ttm-submitted-docno ttm-mono">{docNo}</div>
        </div>

        <div className="ttm-submitted-steps">
          <SubStep icon="fingerprint" title={lang === "th" ? "ออกเลขเอกสารอัตโนมัติ" : "Document number issued"} done />
          <SubStep icon="file-text" title={lang === "th" ? "สร้างไฟล์ PDF ตาม template" : "PDF generated from template"} done />
          <SubStep icon="line" title={lang === "th" ? "แจ้งเตือน LINE → กลุ่ม IT Operations" : "LINE → IT Operations group"} done />
          <SubStep icon="mail" title={lang === "th" ? "ส่ง Email พร้อมลิงก์อนุมัติให้ผู้อนุมัติคนที่ 1" : "Email with approval link → first approver"} done />
          <SubStep icon="archive" title={lang === "th" ? "บันทึกเข้าคลังเอกสารถาวร" : "Stored in immutable archive"} done />
        </div>

        <div className="ttm-submitted-actions">
          <Button variant="ghost" icon="file-text" onClick={openPreview}>{t.common.preview}</Button>
          <Button variant="ghost" icon="download" onClick={openDownload}>{t.common.download}</Button>
          <Button variant="primary" onClick={back}>{lang === "th" ? "ดูคำขอของฉัน" : "Go to my requests"} <Icon name="arrow-right" size={15} /></Button>
        </div>
      </Card>

      <Card className="ttm-submitted-next">
        <SectionTitle title={lang === "th" ? "ขั้นถัดไป" : "What happens next"} />
        {pendingSteps.length === 0 ? (
          <p className="ttm-muted ttm-small ttm-pad">
            {lang === "th" ? "ไม่มีขั้นอนุมัติเพิ่มเติม" : "No further approval steps."}
          </p>
        ) : (
          <ol className="ttm-next-list">
            {pendingSteps.map((s, idx) => {
              // Resolve display name for this step
              let displayName = "";
              let roleLabel = s.role || "";
              if (s.source === "external") {
                displayName = s.displayName || (lang === "th" ? "ผู้รับมอบ" : "Receiver");
                if (s.displayTitle) roleLabel = `${roleLabel} · ${s.displayTitle}`;
              } else if (s.user && USERS[s.user]) {
                const u = USERS[s.user];
                displayName = lang === "th" ? (u.nameTh || u.username) : (u.nameEn || u.nameTh || u.username);
                if (u.titleTh || u.titleEn) {
                  roleLabel = `${roleLabel} · ${lang === "th" ? (u.titleTh || u.titleEn) : (u.titleEn || u.titleTh)}`;
                }
              } else {
                displayName = roleLabel || (lang === "th" ? "ผู้อนุมัติ" : "Approver");
                roleLabel = "";
              }

              // Message: first pending = active, the rest = queued
              let msg;
              if (s.source === "external") {
                msg = lang === "th"
                  ? "รอผู้อนุมัติคนสุดท้ายสร้างลิงก์เซ็นเอกสารและส่งให้ผู้รับมอบเองผ่านช่องทางที่สะดวก"
                  : "Waits for the last in-app approver to generate a sign link and forward it to the receiver.";
              } else if (idx === 0) {
                const sla = s.slaDays ?? 1;
                msg = lang === "th"
                  ? `ได้รับ Email + LINE พร้อมลิงก์ Approve — SLA ${sla} วันทำการ`
                  : `Receives email + LINE with an Approve link — SLA ${sla} business day(s).`;
              } else {
                msg = lang === "th"
                  ? `จะได้รับการแจ้งเตือนหลังขั้นที่ ${idx} อนุมัติเรียบร้อย`
                  : `Notified after step ${idx} is approved.`;
              }

              return (
                <li key={idx}>
                  <div className="ttm-next-num">{idx + 1}</div>
                  <div>
                    <strong>{displayName}{roleLabel ? ` (${roleLabel})` : ""}</strong>
                    <p>{msg}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}

function SubStep({ icon, title, done }) {
  return (
    <div className={cls("ttm-substep", done && "is-done")}>
      <div className="ttm-substep-mark">
        <Icon name={done ? "check" : icon} size={13} stroke={2.5} />
      </div>
      <div className="ttm-substep-icon"><Icon name={icon} size={15} /></div>
      <span>{title}</span>
    </div>
  );
}
