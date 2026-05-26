-- ═══════════════════════════════════════════════════════════════
--  Register FM-IT-01-01 (ขอใช้ระบบ / อุปกรณ์) — Rev 00
--  Effective: 01/03/2569 (01/03/2026)
--  Run in Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.form_templates (
  code, icon, color, category,
  title_th, title_en,
  desc_th, desc_en,
  approvers, sections, avg_days, is_active
) VALUES (
  'FM-IT-01-01',
  'monitor',
  'blue',
  'IT',
  'ขอใช้ระบบ / อุปกรณ์',
  'Request to Use System / Equipment',
  'ขอ Email, สิทธิ์ระบบ, PC, Notebook, Headset, VPN, License MS Office, บัตรพนักงาน',
  'Request email, system access, PC, notebook, headset, VPN, MS Office license, employee card',
  '[
    {"roleTh":"หัวหน้าฝ่ายผู้แจ้ง","roleEn":"Line Manager","slaDays":1},
    {"roleTh":"ผู้จัดการฝ่าย IT","roleEn":"IT Manager","slaDays":1},
    {"roleTh":"เจ้าหน้าที่ IT ผู้รับงาน","roleEn":"IT Staff (Assignee)","slaDays":2}
  ]'::jsonb,
  '[
    {
      "id":"sec1",
      "titleTh":"ส่วนที่ 1 — ข้อมูลผู้แจ้ง / ผู้ขอใช้บริการ",
      "titleEn":"Section 1 — Requester / End-user information",
      "fields":[
        {"id":"employeeName","type":"text","labelTh":"ชื่อ-นามสกุล","labelEn":"Full name","required":true,"span":2},
        {"id":"employeeId","type":"text","labelTh":"รหัสพนักงาน","labelEn":"Employee ID","required":true,"span":1},
        {"id":"position","type":"text","labelTh":"ตำแหน่ง","labelEn":"Position","required":true,"span":1},
        {"id":"department","type":"text","labelTh":"ฝ่ายงาน / แผนก","labelEn":"Department","required":true,"span":2},
        {"id":"section","type":"text","labelTh":"ส่วนงาน / โครงการ","labelEn":"Section / Project","span":2},
        {"id":"dateRequest","type":"date","labelTh":"วันที่แจ้ง","labelEn":"Request date","required":true,"span":1},
        {"id":"dateEffective","type":"date","labelTh":"วันที่ต้องการให้มีผล","labelEn":"Effective date","required":true,"span":1},
        {"id":"time","type":"time","labelTh":"เวลา","labelEn":"Time","span":1}
      ]
    },
    {
      "id":"sec2",
      "titleTh":"ส่วนที่ 2 — ประเภทพนักงาน",
      "titleEn":"Section 2 — Employment type",
      "fields":[
        {"id":"employeeType","type":"radio","labelTh":"ประเภทพนักงาน","labelEn":"Employment type","required":true,"span":3,
         "options":[
           {"id":"permanent","labelTh":"ประจำ","labelEn":"Permanent"},
           {"id":"contract","labelTh":"สัญญาจ้าง","labelEn":"Contract"}
         ]}
      ]
    },
    {
      "id":"sec3",
      "titleTh":"ส่วนที่ 3 — ประเภทการร้องขอ",
      "titleEn":"Section 3 — Request type",
      "fields":[
        {"id":"requestKind","type":"radio","labelTh":"ประเภทคำขอ","labelEn":"Request type","required":true,"span":3,
         "options":[
           {"id":"use","labelTh":"ใช้งาน","labelEn":"Use / Grant"},
           {"id":"cancel","labelTh":"ยกเลิก","labelEn":"Cancel"},
           {"id":"transfer","labelTh":"โอนสิทธิ์","labelEn":"Transfer"}
         ]}
      ]
    },
    {
      "id":"sec4",
      "titleTh":"ส่วนที่ 4 — รายการสิทธิ์และอุปกรณ์ที่ต้องการ",
      "titleEn":"Section 4 — Items & permissions requested",
      "fields":[
        {"id":"item_email","type":"checkbox","labelTh":"Email บริษัท","labelEn":"Company Email","span":3,
         "subFields":[
           {"id":"emailAddr","type":"text","labelTh":"ชื่ออีเมลที่ต้องการ","labelEn":"Desired email","hint":"@talktome.co.th","span":2},
           {"id":"emailRole","type":"radio","labelTh":"สิทธิ์","labelEn":"Role","span":1,
            "options":[
              {"id":"user","labelTh":"User","labelEn":"User"},
              {"id":"admin","labelTh":"Administrator","labelEn":"Administrator"}
            ]},
           {"id":"emailSize","type":"radio","labelTh":"ขนาดพื้นที่","labelEn":"Mailbox size","span":1,
            "options":[
              {"id":"5","labelTh":"5 GB","labelEn":"5 GB"},
              {"id":"10","labelTh":"10 GB","labelEn":"10 GB"},
              {"id":"custom","labelTh":"อื่นๆ","labelEn":"Custom"}
            ]},
           {"id":"emailCalendar","type":"toggle","labelTh":"ฟีเจอร์ปฏิทิน","labelEn":"Calendar feature","span":1}
         ]
        },
        {"id":"item_group","type":"checkbox","labelTh":"Group Email (สำหรับแจกจ่าย)","labelEn":"Group Email (distribution)","span":3,
         "subFields":[
           {"id":"members","type":"textarea","labelTh":"สมาชิก (1 บรรทัด/คน)","labelEn":"Members (one per line)","span":3,"hint":"member1@talktome.co.th"}
         ]
        },
        {"id":"item_pbx","type":"checkbox","labelTh":"User PBX (Extension)","labelEn":"PBX User (Extension)","span":3,
         "subFields":[
           {"id":"pbxRole","type":"radio","labelTh":"สิทธิ์","labelEn":"Role","span":3,
            "options":[
              {"id":"user","labelTh":"User","labelEn":"User"},
              {"id":"supervisor","labelTh":"Supervisor","labelEn":"Supervisor"},
              {"id":"admin","labelTh":"Administrator","labelEn":"Administrator"}
            ]}
         ]
        },
        {"id":"item_pc","type":"checkbox","labelTh":"คอมพิวเตอร์ตั้งโต๊ะ (PC - Personal)","labelEn":"Desktop PC (Personal)","span":1},
        {"id":"item_notebook","type":"checkbox","labelTh":"โน้ตบุ๊ก (Notebook - Personal)","labelEn":"Notebook (Personal)","span":1},
        {"id":"item_headset","type":"checkbox","labelTh":"หูฟัง (Headset - Personal)","labelEn":"Headset (Personal)","span":1},
        {"id":"item_vpn","type":"checkbox","labelTh":"VPN Account (Work from home)","labelEn":"VPN Account (WFH)","span":1},
        {"id":"item_msoffice","type":"checkbox","labelTh":"License MS Office","labelEn":"MS Office License","span":1},
        {"id":"item_idcard","type":"checkbox","labelTh":"บัตรพนักงาน + สายคล้องคอ","labelEn":"Employee card + lanyard","span":1},
        {"id":"item_project","type":"checkbox","labelTh":"อุปกรณ์เกี่ยวกับโครงการ","labelEn":"Project equipment","span":3,
         "subFields":[
           {"id":"project","type":"text","labelTh":"ชื่อโครงการ","labelEn":"Project name","span":3}
         ]
        },
        {"id":"item_other","type":"checkbox","labelTh":"อื่นๆ (ระบุ)","labelEn":"Other (please specify)","span":3,
         "subFields":[
           {"id":"other","type":"text","labelTh":"ระบุรายละเอียด","labelEn":"Please specify","span":3}
         ]
        }
      ]
    },
    {
      "id":"sec5",
      "titleTh":"ส่วนที่ 5 — วัตถุประสงค์การใช้งาน",
      "titleEn":"Section 5 — Purpose",
      "fields":[
        {"id":"purpose","type":"textarea","labelTh":"วัตถุประสงค์ของการขอใช้บริการ","labelEn":"Purpose of this request","required":true,"span":3,"rows":4}
      ]
    }
  ]'::jsonb,
  1.5,
  true
)
ON CONFLICT (code) DO UPDATE SET
  icon         = EXCLUDED.icon,
  color        = EXCLUDED.color,
  category     = EXCLUDED.category,
  title_th     = EXCLUDED.title_th,
  title_en     = EXCLUDED.title_en,
  desc_th      = EXCLUDED.desc_th,
  desc_en      = EXCLUDED.desc_en,
  approvers    = EXCLUDED.approvers,
  sections     = EXCLUDED.sections,
  avg_days     = EXCLUDED.avg_days,
  is_active    = EXCLUDED.is_active,
  updated_at   = NOW();

-- ── Verify ───────────────────────────────────────────────────
SELECT
  code,
  title_th,
  jsonb_array_length(sections) AS section_count,
  jsonb_array_length(approvers) AS approver_count,
  is_active,
  updated_at
FROM public.form_templates
WHERE code = 'FM-IT-01-01';
