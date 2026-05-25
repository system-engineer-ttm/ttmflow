"use client";
import { Icon } from "./Icon";
import { cls, Button, Card, SectionTitle } from "./Ui";

export function Submitted({ lang, t, docNo, back }) {
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
          <Button variant="ghost" icon="file-text">{t.common.preview}</Button>
          <Button variant="ghost" icon="download">{t.common.download}</Button>
          <Button variant="primary" onClick={back}>{lang === "th" ? "ดูคำขอของฉัน" : "Go to my requests"} <Icon name="arrow-right" size={15} /></Button>
        </div>
      </Card>

      <Card className="ttm-submitted-next">
        <SectionTitle title={lang === "th" ? "ขั้นถัดไป" : "What happens next"} />
        <ol className="ttm-next-list">
          <li>
            <div className="ttm-next-num">1</div>
            <div>
              <strong>{lang === "th" ? "ธนวัฒน์ ศรีสุวรรณ (Operations Manager)" : "Tanawat Srisuwan (Operations Manager)"}</strong>
              <p>{lang === "th" ? "ได้รับ Email + LINE พร้อมลิงก์ Approve — SLA 1 วันทำการ" : "Received email + LINE with an Approve link — SLA 1 business day."}</p>
            </div>
          </li>
          <li>
            <div className="ttm-next-num">2</div>
            <div>
              <strong>{lang === "th" ? "ชนิกานต์ พรหมศรี (IT Manager)" : "Chanikan Phromsri (IT Manager)"}</strong>
              <p>{lang === "th" ? "จะได้รับการแจ้งเตือนทันทีหลังขั้นที่ 1 อนุมัติเรียบร้อย" : "Notified immediately after step 1 is approved."}</p>
            </div>
          </li>
          <li>
            <div className="ttm-next-num">3</div>
            <div>
              <strong>{lang === "th" ? "ทีม IT รับงานเข้าคิว" : "IT team picks up the work"}</strong>
              <p>{lang === "th" ? "ระบบสร้าง Ticket No. ให้อัตโนมัติ — ติดตามสถานะใน คิวงาน IT" : "A Ticket number is auto-issued — track in the IT Work Queue."}</p>
            </div>
          </li>
        </ol>
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
