# TTMFlow — Context / Session Handoff

ระบบจัดการคำขอภายในตาม ISO 9001 (Next.js 14 + Supabase + Vercel)
อัปเดตล่าสุด: 2026-06-16 · commit ล่าสุด `44b8aae`

---

## 1. ภาพรวมสถาปัตยกรรม (Architecture)

| ส่วน | รายละเอียด |
|------|-----------|
| Framework | Next.js 14 App Router (`app/`), API route ทุกตัวใส่ `export const dynamic = "force-dynamic"` |
| Database | Supabase (Postgres), project ref `srwbgufdkpxziwkhjiwe` |
| **RLS** | **ปิดทุก table** — ใช้ service-role key ฝั่ง server เท่านั้น |
| Auth | JWT (`jose`, HS256, อายุ 8 ชม.) เก็บใน httpOnly cookie `ttm_session`; secret = `JWT_SECRET` |
| Password | bcryptjs |
| Email | Resend (transactional) |
| Deploy | Vercel — auto-deploy เมื่อ push เข้า `main`; prod = https://ttmflow.vercel.app |
| Excel | ไลบรารี `xlsx` (dynamic import) สำหรับ template/import/export |
| UI | React client components, สองภาษา TH/EN, CSS prefix `ttm-`, ปุ่ม/การ์ด/badge รวมใน `app/components/Ui.jsx`, ไอคอนใน `app/components/Icon.jsx` |

### กฎสำคัญของโปรเจกต์ (Constraints)
- RLS ปิดทุก table → ใช้ service role key ฝั่ง server เท่านั้น
- ทุก API route ที่ **write** ต้องผ่าน `verifyToken()` ก่อนเสมอ
- CSS class prefix ใช้ `ttm-` เสมอ
- Component ที่ใช้ร่วม (Button, Card, Badge ฯลฯ) อยู่ใน `app/components/Ui.jsx`
- เช็ก `hasSupabase` flag ใน API route ก่อนเสมอ (มี mock fallback)
- เวลา `npm run build` ต้อง **หยุด preview dev server ก่อน** ไม่งั้น `.next` cache พัง (`Cannot find module './xxxx.js'`)

---

## 2. ไฟล์หลัก (Key Files)

### Libs (`app/lib/`)
- `session.js` — sign/verify JWT, `SESSION_COOKIE = "ttm_session"`, อายุ 8 ชม.
- `supabase.js` — `createServiceClient()`, `hasSupabase`; มี global `fetch` override `cache: "no-store"` แก้ปัญหา Next.js data-cache ค้างค่าเก่าจาก Supabase GET
- `email.js` — `hasEmail`, `sendPasswordReset({to,username,token})` → `{ok, reason}`; ใช้ `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`; ลิงก์รีเซ็ต `${APP_URL}/reset-password?token=${token}`
- `userId.js` — `nextUserId(db)` หา USRxxx ถัดไปจาก suffix สูงสุด (แก้ปัญหา id ชนกันหลังลบ user)
- `data.js` — `POSITIONS` (seed 23 ตำแหน่ง POS001–POS023: nameTh/nameEn/sortOrder), `USERS` mock

### API Routes (`app/api/`)
- `auth/login` — บันทึก `last_login_at`/`last_login_ip`; `dbRowToUser` คืน email/phone/lineId/employeeId/lang/lastLoginAt
- `auth/me` — เช็ก force-logout: ถ้า `force_logout_at > token.iat` → คืน user:null
- `auth/forgot-password` — สร้าง token (อายุ 1 ชม.), ส่งอีเมลถ้า config พร้อม, dev fallback คืน `devToken`, เช็ก `sent.ok`
- `auth/reset-password` — ตรวจ token+วันหมดอายุ, ใช้ครั้งเดียว (เคลียร์ token), set `password_changed_at`
- `users/me` (GET/PUT) — โปรไฟล์ตัวเอง; PUT แก้ nameTh/En, titleTh/En, dept, email, phone, lineId, employeeId, lang, color, avatar
- `users/me/password` (PUT) — ตรวจรหัสเดิม, ขั้นต่ำ 6 ตัว
- `users/[id]/force-logout` (POST) — admin set `force_logout_at`
- `users` & `users/[id]` — จัดการ email/phone/line_id/employee_id, ใช้ `nextUserId`, admin-only guards
- `users/import` — `buildPositionIndex` + `resolveTitle()` (match คอลัมน์ `position` → title_th/title_en; ไม่รู้จักก็เก็บไว้ตามเดิม; legacy titleTh/En fallback); insert email/phone/line_id/employee_id
- `positions` (GET public / POST admin) + `positions/[id]` (PUT/DELETE admin) — `toPosition` map name_th/name_en/sort_order → nameTh/nameEn/sortOrder

### Components (`app/components/`)
- `Profile.jsx` — ProfileModal: แท็บ Info + Password; ดึง `/api/positions`; ใช้ `<PositionSelect>`; มีช่อง Employee ID; ตัววัดความแข็งแรงรหัสผ่าน
- `PositionSelect.jsx` — dropdown bind กับ titleTh/titleEn; ค่าเดิมที่ไม่อยู่ใน list แสดงเป็น "(เดิม)/(current)" จะได้ไม่หาย
- `Login.jsx` — `LoginForm` / `ForgotPassword` / `ResetPassword`
- `Shell.jsx` — Topbar `onOpenProfile`; คลิก user chip เปิดโปรไฟล์
- `UserManagement.jsx` — 3 แท็บ (Members / Positions / Permissions); UserModal ใช้ PositionSelect + ช่อง Employee ID; `exportUsers()` + ปุ่ม "ส่งออก/Export"; คอลัมน์ Employee ID ใน import preview
- `Icon.jsx` — เพิ่ม `case "briefcase"`

### IMPORT_COLUMNS (ลำดับสำคัญ — parser map ตาม index)
```
nameTh, nameEn, position, dept, employeeId, email, phone, lineId, username, password, role
```
exportUsers เว้น password ว่าง; คอลัมน์ position = `u.titleEn || u.titleTh`

---

## 3. ฟีเจอร์ที่ทำเสร็จแล้ว (Done & Verified)
- ✅ Setup เครื่องใหม่ (clone, deps, `.env.local`, dev server)
- ✅ Migration `output jsonb` บน `requests`; users +11 คอลัมน์; ตาราง `positions` (23 แถว)
- ✅ ระบบ Auth ครบ: Profile (ดู/แก้), เปลี่ยนรหัสผ่าน, ลืม/รีเซ็ตรหัสผ่าน, session, force logout
- ✅ Resend email integration (ทดสอบส่งจริงแล้ว)
- ✅ GitHub SSH + push สำเร็จ
- ✅ ตรวจสอบ Auth/Authz ครบ 30+ เคส แก้ 3 บั๊ก
- ✅ ฟีเจอร์ Positions (table + CRUD + dropdown ใน UserManagement & Profile)
- ✅ Import/Export template ตรงกับ schema ปัจจุบัน
- ✅ กรอก Employee ID เองได้ + ปุ่ม Export users
- ✅ เลขเอกสารออกตอน "กดบันทึก" เท่านั้น (ไม่จองตอนเปิดฟอร์ม → ไม่กระโดด); logic อยู่ใน `app/lib/docNumber.js` (`allocateDocNo` ใช้ตอน insert ใน POST /api/requests, `peekDocNo` ใช้ preview ไม่กินเลข), มี retry กัน PK ชน
- ✅ เมนู **Security Awareness Training** (Cybersecurity Awareness 2026): ผู้เรียน (ลงทะเบียน prefill จากโปรไฟล์ → pretest → 8 สไลด์ + read-gate → posttest จับเวลา/สลับข้อ ผ่าน 90% → ใบรับรอง PDF) + แดชบอร์ดแอดมิน (role admin/auditor). ไฟล์: `app/components/SecurityAwareness.jsx`, `app/lib/securityCourse.js`, `app/api/training/records`, สไตล์ `ttm-sat-*` ใน globals.css, ตาราง `training_records` (RLS ปิด). ใช้ html2canvas+jspdf (dynamic import) ทำ PDF
- ✅ login ครั้งแรกบังคับเปลี่ยนรหัส: คอลัมน์ `users.must_change_password` (ตั้ง true ตอน admin create/import/reset, เคลียร์เมื่อเปลี่ยน/รีเซ็ตรหัสเอง); หน้าจอ `ForceChangePassword` ใน Login.jsx, gate ใน page.jsx

---

## 4. งานค้าง / Backlog (ยังไม่ได้สั่งทำ)
1. **Resend domain** — ปัจจุบัน `RESEND_FROM_EMAIL = onboarding@resend.dev` ส่งได้เฉพาะอีเมลเจ้าของบัญชี `sys.en.ttm@gmail.com` เท่านั้น ต้อง verify โดเมนบริษัทแล้วเปลี่ยน `RESEND_FROM_EMAIL` เพื่อให้รีเซ็ตรหัสส่งถึงพนักงานทุกคน
2. **เติม email ให้ user เดิม** — เพื่อให้ notification/reset ใช้ได้กับทุกคน
3. ไฟล์ที่ยังไม่ commit ตั้งแต่เริ่ม session: `.claude/settings.local.json`, `.gitignore` (ไม่เกี่ยวกับ feature — ตัดสินใจว่าจะ commit หรือปล่อยไว้)

---

## 4.5 การ Setup เครื่องใหม่ (New Machine Setup)

`CLAUDE.md` + `Context.md` อยู่ใน git → clone แล้วตามมาเอง ไม่ต้องก๊อปแยก
สิ่งที่ **ต้องทำเองทุกเครื่อง** (ไม่อยู่ใน git):

1. **Clone + install**
   ```bash
   git clone git@github.com:system-engineer-ttm/ttmflow.git
   cd ttmflow
   npm install        # ต้องการ Node 22.x, npm 10.x
   ```
2. **สร้าง `.env.local`** — ดูคีย์ที่ต้องมีจาก `.env.local.example` (อยู่ใน repo):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_APP_URL`
   > ค่าจริงดึงได้จาก Vercel project env vars หรือเครื่องเดิม (อย่า commit ไฟล์นี้ — อยู่ใน .gitignore)
3. **SSH key** — สร้าง + add เข้า GitHub เพื่อ push (remote เป็น SSH)
4. รัน `npm run dev` → http://localhost:3000

ทางเลือกไม่ต้องลงเครื่อง: ใช้ web app **claude.ai/code** เชื่อม GitHub repo ตรงๆ

**Workflow ข้ามเครื่อง:** เครื่อง A `commit + push` (+ อัปเดต Context.md) → เครื่อง B `git pull` แล้วทำงานต่อ

---

## 5. ข้อมูลสภาพแวดล้อม (Environment)
- Git remote: `git@github.com:system-engineer-ttm/ttmflow.git` (SSH)
- Git user: Samathi / sys.en.ttm@gmail.com
- Supabase project ref: `srwbgufdkpxziwkhjiwe` (RLS ปิดทุก table)
- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`
- ⚠️ รหัสผ่าน `adm001` ถูกรีเซ็ตผ่านอีเมลแล้ว — **ไม่ใช่ "1234" อีกต่อไป** ใช้รหัสใหม่ที่ตั้งไว้
- Preview/launch: `.claude/launch.json` → name `TTMFlow`, port 3000, `autoPort: false`

---

## 6. บทเรียน/กับดักที่เจอมาแล้ว (Gotchas)
- ID generation อย่าใช้ `count+1` — ชนกันหลังลบ user → ใช้ `nextUserId` (max suffix)
- Next.js data cache จับ supabase-js fetch แม้ใน force-dynamic → แก้ด้วย `cache:"no-store"` ใน `createServiceClient`
- อย่า `npm run build` ขณะ preview dev server รันอยู่ (ใช้ `.next` ร่วมกัน → cache พัง)
- ตารางใหม่ทุกตัว: ถ้า CREATE TABLE แต่ไม่ DISABLE RLS จะถูกบล็อก (select คืน 0 แถว, insert error RLS/42501) → ต้อง `ALTER TABLE <t> DISABLE ROW LEVEL SECURITY;` เสมอ (เจอกับทั้ง positions และ training_records)
- git push: ต้อง `cd /Users/tharisma/TTMFlow` ก่อน (อย่ารันจาก `~`)
- เลขเอกสาร: ฟอร์มที่มี counter ใน `form_templates.numbering` (Path A) ลบ request ที่บันทึกแล้ว counter จะ**ไม่ถอยกลับ** (กันเลขซ้ำ — ปกติของ doc numbering) ดังนั้นเวลาเทสต์ create+delete จะกินเลข ต้องรีเซ็ต `numbering.current` กลับเองถ้าไม่อยากให้เลข prod กระโดด
