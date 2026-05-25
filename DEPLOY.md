# TTMFlow — Deploy Guide (Supabase + Vercel, ฟรีทั้งคู่)

## ขั้นตอนที่ 1 — สร้าง Supabase Project

1. ไปที่ https://supabase.com → **Start your project** (ฟรี ไม่ต้องบัตรเครดิต)
2. สมัครด้วย GitHub หรือ Email
3. กด **New project** → ตั้งชื่อ `ttmflow` → เลือก Region `Southeast Asia (Singapore)` → ตั้ง Database Password → **Create new project** (รอ ~2 นาที)

## ขั้นตอนที่ 2 — รัน Schema SQL

1. ใน Supabase Dashboard → เมนูซ้าย **SQL Editor** → **New query**
2. Copy เนื้อหาจากไฟล์ `supabase/schema.sql` ทั้งหมด → Paste → กด **Run** (▶)
3. รอให้เสร็จ — จะมี users 14 คน และ role_permissions 55 รายการถูกสร้าง

## ขั้นตอนที่ 3 — คัดลอก API Keys

1. Supabase Dashboard → **Project Settings** → **API**
2. คัดลอกค่าต่อไปนี้:
   - `Project URL` → จะใช้เป็น `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` (public) key → จะใช้เป็น `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secret) key → จะใช้เป็น `SUPABASE_SERVICE_ROLE_KEY`

## ขั้นตอนที่ 4 — Push โค้ดขึ้น GitHub

```bash
# ใน terminal ที่โฟลเดอร์ TTMFlow
git init
git add .
git commit -m "feat: TTMFlow with Supabase + RBAC"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ttmflow.git
git push -u origin main
```

(สร้าง repo ใหม่ที่ https://github.com/new ก่อน)

## ขั้นตอนที่ 5 — Deploy บน Vercel

1. ไปที่ https://vercel.com → **Sign up** ด้วย GitHub (ฟรี)
2. กด **Add New → Project** → เลือก repo `ttmflow`
3. Vercel auto-detect Next.js → ไม่ต้องแก้ไขอะไร
4. เปิด **Environment Variables** ใส่ค่าทั้ง 4:

   | Variable | ค่า |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... |
   | `SUPABASE_SERVICE_ROLE_KEY` | eyJ... (secret!) |
   | `JWT_SECRET` | สร้างด้วย: `openssl rand -hex 32` |

5. กด **Deploy** → รอ ~2 นาที → ได้ URL แบบ `ttmflow.vercel.app` 🎉

## ขั้นตอนที่ 6 — ทดสอบ

เปิด `https://ttmflow.vercel.app` → Login ด้วย `adm001` / `1234`

---

## สรุป Free Tier ที่ใช้

| Service | Plan | ขีดจำกัด |
|---|---|---|
| **Supabase** | Free | 500 MB DB, 5 GB bandwidth, 50,000 MAU |
| **Vercel** | Hobby (Free) | 100 GB bandwidth, ไม่จำกัด deploys |

---

## คำสั่งสำหรับ Local Dev

```bash
# คัดลอก env file
cp .env.local.example .env.local
# แก้ไขค่าใน .env.local ด้วย keys จาก Supabase

# รัน dev server
npm run dev
# เปิด http://localhost:3000
```
