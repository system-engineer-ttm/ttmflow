-- Patch FM-IT-01-01:
-- 1. Email mailbox size — add a follow-up text input "ระบุขนาด (GB)" that
--    appears only when emailSize === "custom".
-- 2. VPN Account — add a required text input "สิทธิ์ในการเข้าถึงระบบ / โครงการ"
--    that appears when item_vpn is checked.
-- 3. Mark a few obvious top-level fields as required so validation kicks in.
--
-- Safe to re-run: overwrites the sections jsonb wholesale with the corrected
-- version. Other columns are left alone.

UPDATE public.form_templates
SET
  sections = '[
    {
      "id":"sec1",
      "titleTh":"ส่วนที่ 1 — ข้อมูลผู้แจ้ง / ผู้ขอใช้บริการ",
      "titleEn":"Section 1 — Requester information",
      "fields":[
        {"id":"employeeName","type":"text","labelTh":"ชื่อ-นามสกุล","labelEn":"Full name","span":2,"required":true},
        {"id":"employeeId","type":"text","labelTh":"รหัสพนักงาน","labelEn":"Employee ID","span":1,"required":true},
        {"id":"position","type":"text","labelTh":"ตำแหน่ง","labelEn":"Position","span":1,"required":true},
        {"id":"department","type":"text","labelTh":"ฝ่ายงาน / แผนก","labelEn":"Department","span":1,"required":true},
        {"id":"section","type":"text","labelTh":"ส่วนงาน / โครงการ","labelEn":"Section / project","span":1},
        {"id":"dateRequest","type":"date","labelTh":"วันที่แจ้ง","labelEn":"Request date","span":1,"required":true},
        {"id":"dateEffective","type":"date","labelTh":"วันที่ต้องการให้มีผล","labelEn":"Effective date","span":1,"required":true},
        {"id":"time","type":"time","labelTh":"เวลา","labelEn":"Time","span":1}
      ]
    },
    {
      "id":"sec2",
      "titleTh":"ส่วนที่ 2 — ประเภทพนักงาน",
      "titleEn":"Section 2 — Employment type",
      "fields":[
        {"id":"employeeType","type":"radio","labelTh":"ประเภทพนักงาน","labelEn":"Employment type","span":3,"required":true,
         "options":[
           {"id":"permanent","labelTh":"ประจำ","labelEn":"Permanent"},
           {"id":"contract","labelTh":"สัญญาจ้าง","labelEn":"Contract"}
         ]}
      ]
    },
    {
      "id":"sec3",
      "titleTh":"ส่วนที่ 3 — ประเภทคำขอ",
      "titleEn":"Section 3 — Request type",
      "fields":[
        {"id":"requestKind","type":"radio","labelTh":"ประเภทคำขอ","labelEn":"Request type","span":3,"required":true,
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
           {"id":"emailAddr","type":"text","labelTh":"ชื่ออีเมลที่ต้องการ","labelEn":"Desired email","hint":"@talktome.co.th","span":2,"required":true},
           {"id":"emailRole","type":"radio","labelTh":"สิทธิ์","labelEn":"Role","span":1,"required":true,
            "options":[
              {"id":"user","labelTh":"User","labelEn":"User"},
              {"id":"admin","labelTh":"Administrator","labelEn":"Administrator"}
            ]},
           {"id":"emailSize","type":"radio","labelTh":"ขนาดพื้นที่","labelEn":"Mailbox size","span":1,"required":true,
            "options":[
              {"id":"5","labelTh":"5 GB","labelEn":"5 GB"},
              {"id":"10","labelTh":"10 GB","labelEn":"10 GB"},
              {"id":"custom","labelTh":"อื่นๆ","labelEn":"Custom"}
            ]},
           {"id":"emailSizeCustom","type":"number","labelTh":"ระบุขนาด (GB)","labelEn":"Specify size (GB)","span":1,"required":true,
            "showWhen":{"field":"emailSize","equals":"custom"}},
           {"id":"emailCalendar","type":"toggle","labelTh":"ฟีเจอร์ปฏิทิน","labelEn":"Calendar feature","span":1}
         ]
        },
        {"id":"item_group","type":"checkbox","labelTh":"Group Email (สำหรับแจกจ่าย)","labelEn":"Group Email (distribution)","span":3,
         "subFields":[
           {"id":"members","type":"textarea","labelTh":"สมาชิก (1 บรรทัด/คน)","labelEn":"Members (one per line)","span":3,"hint":"member1@talktome.co.th","required":true}
         ]
        },
        {"id":"item_pbx","type":"checkbox","labelTh":"User PBX (Extension)","labelEn":"PBX User (Extension)","span":3,
         "subFields":[
           {"id":"pbxRole","type":"radio","labelTh":"สิทธิ์","labelEn":"Role","span":3,"required":true,
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
        {"id":"item_vpn","type":"checkbox","labelTh":"VPN Account (Work from home)","labelEn":"VPN Account (WFH)","span":3,
         "subFields":[
           {"id":"vpnAccess","type":"text","labelTh":"สิทธิ์ในการเข้าถึงระบบ / โครงการ","labelEn":"System / project access","span":3,"required":true,"hint":"โปรดระบุ"}
         ]
        },
        {"id":"item_msoffice","type":"checkbox","labelTh":"License MS Office","labelEn":"MS Office License","span":1},
        {"id":"item_idcard","type":"checkbox","labelTh":"บัตรพนักงาน + สายคล้องคอ","labelEn":"Employee card + lanyard","span":1},
        {"id":"item_deskchair","type":"checkbox","labelTh":"โต๊ะ + เก้าอี้","labelEn":"Desk + chair","span":1},
        {"id":"item_other","type":"checkbox","labelTh":"อื่นๆ (ระบุ)","labelEn":"Other (please specify)","span":3,
         "subFields":[
           {"id":"other","type":"text","labelTh":"ระบุรายละเอียด","labelEn":"Please specify","span":3,"required":true}
         ]
        }
      ]
    },
    {
      "id":"sec5",
      "titleTh":"ส่วนที่ 5 — จุดประสงค์ในการขอ",
      "titleEn":"Section 5 — Purpose of request",
      "fields":[
        {"id":"purpose","type":"textarea","labelTh":"จุดประสงค์","labelEn":"Purpose","span":3,"rows":4,"required":true}
      ]
    }
  ]'::jsonb,
  updated_at = NOW()
WHERE code = 'FM-IT-01-01';
