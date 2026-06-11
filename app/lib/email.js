import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "TTMFlow <noreply@ttmflow.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ttmflow.vercel.app";

/** Returns true if email service is configured */
export const hasEmail = !!resend;

/**
 * Send password reset email.
 * Falls back silently if RESEND_API_KEY is not set.
 */
export async function sendPasswordReset({ to, username, token }) {
  if (!resend) return { ok: false, reason: "email not configured" };

  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "TTMFlow — รีเซ็ตรหัสผ่าน / Reset your password",
    html: `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#1f6feb;padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">TTMFlow</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">ระบบจัดการคำขอภายในองค์กร</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:15px;">สวัสดีคุณ <strong>${username}</strong>,</p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">
            เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ<br>
            กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์หมดอายุใน 1 ชั่วโมง)
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#1f6feb;border-radius:8px;">
              <a href="${resetUrl}" style="display:block;padding:12px 28px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">
                รีเซ็ตรหัสผ่าน / Reset Password
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">หรือเปิดลิงก์นี้ในเบราว์เซอร์:</p>
          <p style="margin:0;font-size:11px;word-break:break-all;">
            <a href="${resetUrl}" style="color:#1f6feb;">${resetUrl}</a>
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
            หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน ไม่ต้องดำเนินการใดๆ รหัสผ่านของคุณจะยังคงเดิม<br>
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
            © TTMFlow · บริษัท ทอล์คทูมี จำกัด
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, id: data?.id };
}
