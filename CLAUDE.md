# TTMFlow

ระบบจัดการคำขอภายในตาม ISO 9001 — Next.js 14 (App Router) + Supabase + Vercel
สองภาษา TH/EN · prod: https://ttmflow.vercel.app

## กฎสำคัญ (ห้ามพลาด)
- **RLS ปิดทุก table** → ใช้ service-role key ฝั่ง server เท่านั้น
- ทุก API route ที่ **write** ต้องผ่าน `verifyToken()` ก่อนเสมอ
- API route ทุกตัวใส่ `export const dynamic = "force-dynamic"`
- เช็ก `hasSupabase` flag ใน API route ก่อนเสมอ (มี mock fallback)
- CSS class prefix ใช้ `ttm-` เสมอ; component ที่ใช้ร่วมอยู่ใน `app/components/Ui.jsx`, ไอคอนใน `app/components/Icon.jsx`
- ID ผู้ใช้ใช้ `nextUserId()` (max suffix) — อย่าใช้ count+1 (ชนกันหลังลบ)
- **`npm run build` ต้องหยุด preview dev server ก่อน** ไม่งั้น `.next` cache พัง

## คำสั่งที่ใช้บ่อย
- dev: `npm run dev` (port 3000)
- build: `npm run build` (หยุด dev server ก่อน)
- deploy: push เข้า `main` → Vercel auto-deploy

## รายละเอียดเต็ม
ดู **Context.md** — architecture, ไฟล์หลักทั้งหมด, ฟีเจอร์ที่ทำเสร็จ, งานค้าง, การ setup เครื่องใหม่, และกับดักที่เคยเจอ
