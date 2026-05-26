-- ═══════════════════════════════════════════════════════════════
--  Register IT Forms (FM-IT-01-09, FM-IT-01-10, FM-IT-01-11)
--  Source: official PDFs in C:\Users\TTM-NB-7\Documents\TTMFlow\FM-IT\
--  Run in Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- FM-IT-01-09 : จัดการคิวรับสายระบบโทรศัพท์ (PBX Queue Management)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.form_templates (
  code, icon, color, category,
  title_th, title_en, desc_th, desc_en,
  approvers, sections, avg_days, is_active
) VALUES (
  'FM-IT-01-09', 'phone', 'violet', 'IT',
  'จัดการคิวรับสายระบบโทรศัพท์',
  'PBX Queue Management',
  'สร้าง/ยกเลิกคิว, ปรับ Ring Strategy, เพิ่ม/ลด/โอนย้าย Agent',
  'Create/delete queue, ring strategy, add/remove/transfer agents',
  '[
    {"roleTh":"หัวหน้าโปรเจกต์","roleEn":"Project Lead","slaDays":1},
    {"roleTh":"ผู้จัดการฝ่าย IT","roleEn":"IT Manager","slaDays":1},
    {"roleTh":"เจ้าหน้าที่ IT ผู้รับงาน","roleEn":"IT Staff (Assignee)","slaDays":1}
  ]'::jsonb,
  '[
    {
      "id":"sec1",
      "titleTh":"ส่วนที่ 1 — ข้อมูลผู้แจ้ง",
      "titleEn":"Section 1 — Requester information",
      "fields":[
        {"id":"employeeName","type":"text","labelTh":"ชื่อ-นามสกุล","labelEn":"Full name","required":true,"span":2},
        {"id":"position","type":"text","labelTh":"ตำแหน่ง","labelEn":"Position","required":true,"span":1},
        {"id":"department","type":"text","labelTh":"ฝ่ายงาน / โครงการ","labelEn":"Department / Project","required":true,"span":2},
        {"id":"dateRequest","type":"date","labelTh":"วันที่แจ้ง","labelEn":"Request date","required":true,"span":1},
        {"id":"dateEffective","type":"date","labelTh":"วันที่ต้องการให้มีผล","labelEn":"Effective date","required":true,"span":1}
      ]
    },
    {
      "id":"sec2",
      "titleTh":"ส่วนที่ 2 — ประเภทคำขอ (เลือกได้ 1 รายการ)",
      "titleEn":"Section 2 — Request type (choose 1)",
      "fields":[
        {"id":"requestType","type":"radio","labelTh":"ประเภทคำขอ","labelEn":"Request type","required":true,"span":3,
         "options":[
           {"id":"create","labelTh":"สร้างคิวใหม่ (Create New Queue) — ต้องกรอกส่วนที่ 3","labelEn":"Create New Queue — fill section 3"},
           {"id":"delete","labelTh":"ยกเลิก / หยุดใช้คิว (Delete / Deactivate Queue) — ต้องกรอกส่วนที่ 3","labelEn":"Delete / Deactivate Queue — fill section 3"},
           {"id":"change","labelTh":"เปลี่ยนการตั้งค่าคิว (Change Configuration Queue)","labelEn":"Change Configuration Queue"},
           {"id":"member","labelTh":"เพิ่ม / ลด Member","labelEn":"Add / Remove Member"},
           {"id":"transfer","labelTh":"โอน / ย้าย Member (Transfer / Move Member)","labelEn":"Transfer / Move Member"}
         ]}
      ]
    },
    {
      "id":"sec3",
      "titleTh":"ส่วนที่ 3 — รายละเอียด Queue",
      "titleEn":"Section 3 — Queue details",
      "fields":[
        {"id":"queueName","type":"text","labelTh":"ชื่อคิว (Queue Name)","labelEn":"Queue Name","required":true,"span":3},
        {"id":"ringStrategy","type":"radio","labelTh":"กลยุทธ์การกระจายสาย (Ring Strategy)","labelEn":"Ring Strategy","required":true,"span":3,
         "options":[
           {"id":"ringAll","labelTh":"กระจายทุก Agent (Ring All)","labelEn":"Ring All"},
           {"id":"priorityHurt","labelTh":"ลำดับความสำคัญ (Priority Hurt)","labelEn":"Priority Hurt"},
           {"id":"roundRobin","labelTh":"วนรับสาย ตามลำดับ Agent (Round Robin)","labelEn":"Round Robin"},
           {"id":"longestIdle","labelTh":"กระจายไป Agent ที่ว่างนานสุด (Longest Idle)","labelEn":"Longest Idle"},
           {"id":"leastTalk","labelTh":"กระจายไป Agent ที่คุยน้อยสุด (Least Talk Time)","labelEn":"Least Talk Time"},
           {"id":"random","labelTh":"สุ่ม (Random)","labelEn":"Random"}
         ]},
        {"id":"outboundRule","type":"radio","labelTh":"การโทรออก (Outbound rule)","labelEn":"Outbound rule","span":3,
         "options":[
           {"id":"domestic","labelTh":"ในประเทศ (Domestic)","labelEn":"Domestic"},
           {"id":"international","labelTh":"ต่างประเทศ (International)","labelEn":"International"}
         ]},
        {"id":"reason","type":"textarea","labelTh":"เหตุผล / รายละเอียดเพิ่มเติม","labelEn":"Reason / Additional notes","span":3,"rows":2}
      ]
    },
    {
      "id":"sec4",
      "titleTh":"ส่วนที่ 4 — รายชื่อ Member (1 บรรทัด/คน : ชื่อ - Ext. - หน้าที่/Agent)",
      "titleEn":"Section 4 — Member list (one per line: name - ext. - role)",
      "fields":[
        {"id":"members","type":"textarea","labelTh":"รายชื่อสมาชิกในคิว","labelEn":"Queue members","span":3,"rows":6,"hint":"เช่น สมชาย ใจดี - 1001 - Agent"}
      ]
    }
  ]'::jsonb,
  0.8, true
)
ON CONFLICT (code) DO UPDATE SET
  icon = EXCLUDED.icon, color = EXCLUDED.color, category = EXCLUDED.category,
  title_th = EXCLUDED.title_th, title_en = EXCLUDED.title_en,
  desc_th = EXCLUDED.desc_th, desc_en = EXCLUDED.desc_en,
  approvers = EXCLUDED.approvers, sections = EXCLUDED.sections,
  avg_days = EXCLUDED.avg_days, is_active = EXCLUDED.is_active,
  updated_at = NOW();


-- ─────────────────────────────────────────────────────────────
-- FM-IT-01-10 : ขอจัดการติดตั้งอุปกรณ์ไอที (IT Equipment Installation)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.form_templates (
  code, icon, color, category,
  title_th, title_en, desc_th, desc_en,
  approvers, sections, avg_days, is_active
) VALUES (
  'FM-IT-01-10', 'wrench', 'amber', 'IT',
  'ขอจัดการติดตั้งอุปกรณ์ไอที',
  'IT Equipment Installation',
  'เพิ่ม/ย้าย/ยกเลิกจุดติดตั้ง PC, IP Phone, SIM Gateway',
  'Add/move/decommission stations, IP phone, SIM gateway',
  '[
    {"roleTh":"หัวหน้าโปรเจกต์","roleEn":"Project Lead","slaDays":1},
    {"roleTh":"ผู้จัดการฝ่าย IT","roleEn":"IT Manager","slaDays":1},
    {"roleTh":"เจ้าหน้าที่ IT ผู้รับงาน","roleEn":"IT Staff (Assignee)","slaDays":2}
  ]'::jsonb,
  '[
    {
      "id":"sec1",
      "titleTh":"ส่วนที่ 1 — ข้อมูลผู้แจ้ง",
      "titleEn":"Section 1 — Requester information",
      "fields":[
        {"id":"employeeName","type":"text","labelTh":"ชื่อ-นามสกุล","labelEn":"Full name","required":true,"span":2},
        {"id":"position","type":"text","labelTh":"ตำแหน่ง","labelEn":"Position","required":true,"span":1},
        {"id":"department","type":"text","labelTh":"ฝ่ายงาน / โครงการ","labelEn":"Department / Project","required":true,"span":2},
        {"id":"location","type":"text","labelTh":"สถานที่ติดตั้ง (ชั้น / โซน)","labelEn":"Install location (floor / zone)","required":true,"span":1},
        {"id":"dateRequest","type":"date","labelTh":"วันที่แจ้ง","labelEn":"Request date","required":true,"span":1},
        {"id":"dateEffective","type":"date","labelTh":"วันที่ต้องการให้มีผล (Go-live)","labelEn":"Go-live date","required":true,"span":1}
      ]
    },
    {
      "id":"sec2",
      "titleTh":"ส่วนที่ 2 — ประเภทการขอ",
      "titleEn":"Section 2 — Request type",
      "fields":[
        {"id":"requestType","type":"radio","labelTh":"ประเภทคำขอ","labelEn":"Request type","required":true,"span":3,
         "options":[
           {"id":"add_new","labelTh":"เพิ่มจุดติดตั้งใหม่ (New stations)","labelEn":"Add new stations"},
           {"id":"move","labelTh":"ย้ายจุดติดตั้งเดิม (Move stations)","labelEn":"Move stations"},
           {"id":"adjust_seat","labelTh":"เพิ่ม / ลด Seat (Adjust seats)","labelEn":"Adjust seats"},
           {"id":"decommission","labelTh":"ยกเลิก / รื้อถอน (Decommission)","labelEn":"Decommission"}
         ]}
      ]
    },
    {
      "id":"sec3",
      "titleTh":"ส่วนที่ 3 — รายละเอียดจุดติดตั้ง",
      "titleEn":"Section 3 — Station details",
      "fields":[
        {"id":"stationCount","type":"number","labelTh":"จำนวนจุดติดตั้ง","labelEn":"Number of stations","required":true,"span":1},
        {"id":"stationIds","type":"textarea","labelTh":"Station ID / รหัสจุด (1 บรรทัด/จุด)","labelEn":"Station IDs (one per line)","span":3,"rows":3},
        {"id":"computer","type":"checkbox","labelTh":"คอมพิวเตอร์","labelEn":"Computer","span":1,
         "subFields":[
           {"id":"computerType","type":"radio","labelTh":"ประเภท","labelEn":"Type","span":3,
            "options":[
              {"id":"pc","labelTh":"PC Desktop","labelEn":"PC Desktop"},
              {"id":"notebook","labelTh":"Notebook","labelEn":"Notebook"},
              {"id":"other","labelTh":"อื่นๆ","labelEn":"Other"}
            ]}
         ]},
        {"id":"phone","type":"checkbox","labelTh":"โทรศัพท์","labelEn":"Phone","span":1,
         "subFields":[
           {"id":"phoneType","type":"radio","labelTh":"ประเภท","labelEn":"Type","span":3,
            "options":[
              {"id":"ipPhone","labelTh":"IP Phone","labelEn":"IP Phone"},
              {"id":"softphone","labelTh":"Softphone","labelEn":"Softphone"}
            ]}
         ]},
        {"id":"sim","type":"checkbox","labelTh":"SIM / SIM Gateway","labelEn":"SIM / SIM Gateway","span":1,
         "subFields":[
           {"id":"simType","type":"radio","labelTh":"ประเภท","labelEn":"Type","span":3,
            "options":[
              {"id":"simGateway","labelTh":"SIM Gateway","labelEn":"SIM Gateway"},
              {"id":"sim","labelTh":"SIM","labelEn":"SIM"}
            ]}
         ]},
        {"id":"otherItems","type":"text","labelTh":"อุปกรณ์อื่นๆ (ระบุ)","labelEn":"Other equipment (specify)","span":3},
        {"id":"remark","type":"textarea","labelTh":"หมายเหตุ","labelEn":"Notes","span":3,"rows":2}
      ]
    }
  ]'::jsonb,
  2.0, true
)
ON CONFLICT (code) DO UPDATE SET
  icon = EXCLUDED.icon, color = EXCLUDED.color, category = EXCLUDED.category,
  title_th = EXCLUDED.title_th, title_en = EXCLUDED.title_en,
  desc_th = EXCLUDED.desc_th, desc_en = EXCLUDED.desc_en,
  approvers = EXCLUDED.approvers, sections = EXCLUDED.sections,
  avg_days = EXCLUDED.avg_days, is_active = EXCLUDED.is_active,
  updated_at = NOW();


-- ─────────────────────────────────────────────────────────────
-- FM-IT-01-11 : แจ้งซ่อมและขอความช่วยเหลือทางไอที (IT Support Ticket)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.form_templates (
  code, icon, color, category,
  title_th, title_en, desc_th, desc_en,
  approvers, sections, avg_days, is_active
) VALUES (
  'FM-IT-01-11', 'lifebuoy', 'rose', 'IT',
  'แจ้งซ่อมและขอความช่วยเหลือทางไอที',
  'IT Support & Repair Ticket',
  'แจ้งอุปกรณ์เสีย, ลืมรหัสผ่าน, ขัดข้องเครือข่าย, VPN',
  'Report broken equipment, password reset, network, VPN',
  '[
    {"roleTh":"เจ้าหน้าที่ IT ผู้รับงาน","roleEn":"IT Staff (Assignee)","slaDays":0.3}
  ]'::jsonb,
  '[
    {
      "id":"sec1",
      "titleTh":"ส่วนที่ 1 — ข้อมูลผู้แจ้ง",
      "titleEn":"Section 1 — Requester information",
      "fields":[
        {"id":"employeeName","type":"text","labelTh":"ชื่อ-นามสกุล","labelEn":"Full name","required":true,"span":2},
        {"id":"position","type":"text","labelTh":"ตำแหน่ง","labelEn":"Position","required":true,"span":1},
        {"id":"department","type":"text","labelTh":"ฝ่ายงาน / โครงการ","labelEn":"Department / Project","required":true,"span":2},
        {"id":"contactPhone","type":"text","labelTh":"เบอร์ติดต่อกลับ / Ext.","labelEn":"Contact phone / Ext.","span":1},
        {"id":"dateRequest","type":"date","labelTh":"วันที่แจ้ง","labelEn":"Request date","required":true,"span":1},
        {"id":"time","type":"time","labelTh":"เวลา","labelEn":"Time","span":1}
      ]
    },
    {
      "id":"sec2",
      "titleTh":"ส่วนที่ 2 — ประเภทแจ้งซ่อม",
      "titleEn":"Section 2 — Issue category",
      "fields":[
        {"id":"issueCategory","type":"radio","labelTh":"ประเภท","labelEn":"Category","required":true,"span":3,
         "options":[
           {"id":"station","labelTh":"Station-Based : ระบุรหัสจุด (Station ID) หรือรหัสอุปกรณ์ (Asset ID)","labelEn":"Station-Based: Station ID or Asset ID"},
           {"id":"personal","labelTh":"Personal Asset : ระบุรหัสอุปกรณ์ส่วนตัว (Asset ID)","labelEn":"Personal Asset: Asset ID"},
           {"id":"software","labelTh":"Software / System : ระบุระบบ (เช่น Email, CRM, Yeastar, VPN)","labelEn":"Software/System (e.g. Email, CRM, Yeastar, VPN)"}
         ]},
        {"id":"assetId","type":"text","labelTh":"รหัสจุด / รหัสอุปกรณ์ / ชื่อระบบ","labelEn":"Station ID / Asset ID / System name","span":3}
      ]
    },
    {
      "id":"sec3",
      "titleTh":"ส่วนที่ 3 — รายการอาการ / ปัญหา",
      "titleEn":"Section 3 — Symptoms / issue list",
      "fields":[
        {"id":"sym_hw","type":"checkbox","labelTh":"เครื่องคอมพิวเตอร์ / อุปกรณ์เสีย / ใช้งานไม่ได้","labelEn":"Computer / equipment broken or unusable","span":3},
        {"id":"sym_net","type":"checkbox","labelTh":"เครือข่าย / อินเทอร์เน็ตขัดข้อง","labelEn":"Network / internet down","span":3},
        {"id":"sym_email","type":"checkbox","labelTh":"อีเมล / ระบบงานเข้าใช้ไม่ได้","labelEn":"Email / system access failure","span":3},
        {"id":"sym_headset","type":"checkbox","labelTh":"หูฟัง (Headset) ขัดข้อง","labelEn":"Headset malfunction","span":3},
        {"id":"sym_password","type":"checkbox","labelTh":"ลืมรหัสผ่าน / รีเซ็ต / ขอเพิ่มสิทธิ์","labelEn":"Forgot password / reset / request access","span":3},
        {"id":"sym_vpn","type":"checkbox","labelTh":"VPN Account (Work from home) ขัดข้อง","labelEn":"VPN Account (WFH) issue","span":3},
        {"id":"sym_help","type":"checkbox","labelTh":"ขอความช่วยเหลือ — อื่นๆ","labelEn":"Other support request","span":3},
        {"id":"sym_other","type":"text","labelTh":"อื่นๆ (ระบุ)","labelEn":"Other (please specify)","span":3},
        {"id":"symptoms","type":"textarea","labelTh":"อาการที่พบ / รายละเอียด","labelEn":"Symptoms / details","required":true,"span":3,"rows":4}
      ]
    },
    {
      "id":"sec4",
      "titleTh":"ส่วนที่ 4 — ความรุนแรง / ความเร่งด่วน",
      "titleEn":"Section 4 — Severity / urgency",
      "fields":[
        {"id":"severity","type":"radio","labelTh":"ระดับความรุนแรง","labelEn":"Severity","required":true,"span":3,
         "options":[
           {"id":"urgent","labelTh":"เร่งด่วนมาก : ใช้งานไม่ได้เลย (Impact 100%)","labelEn":"Urgent: completely unusable (Impact 100%)"},
           {"id":"high","labelTh":"ปานกลาง : ทำงานได้บางส่วน (Impact 50%)","labelEn":"High: partial impact (Impact 50%)"},
           {"id":"normal","labelTh":"ไม่ด่วน : ขอแก้ไข / ปรับแต่ง (No Impact)","labelEn":"Normal: no impact"}
         ]}
      ]
    },
    {
      "id":"sec5",
      "titleTh":"ส่วนที่ 5 — สำหรับเจ้าหน้าที่ IT (กรอกหลังรับงาน)",
      "titleEn":"Section 5 — For IT Staff (filled after pickup)",
      "fields":[
        {"id":"ticketNo","type":"text","labelTh":"Ticket No.","labelEn":"Ticket No.","span":1},
        {"id":"ticketStatus","type":"radio","labelTh":"สถานะ","labelEn":"Status","span":3,
         "options":[
           {"id":"received","labelTh":"รับงานแล้ว","labelEn":"Received"},
           {"id":"inProgress","labelTh":"กำลังดำเนินการ","labelEn":"In progress"},
           {"id":"done","labelTh":"เสร็จสิ้น","labelEn":"Done"},
           {"id":"transferred","labelTh":"โอนต่อ (ระบุผู้รับ)","labelEn":"Transferred (specify assignee)"}
         ]},
        {"id":"assignee","type":"text","labelTh":"ผู้รับโอน (ถ้ามี)","labelEn":"Transferred to (if any)","span":3},
        {"id":"resolution","type":"textarea","labelTh":"วิธีการแก้ไข / สรุปงาน","labelEn":"Resolution / summary","span":3,"rows":3}
      ]
    }
  ]'::jsonb,
  0.3, true
)
ON CONFLICT (code) DO UPDATE SET
  icon = EXCLUDED.icon, color = EXCLUDED.color, category = EXCLUDED.category,
  title_th = EXCLUDED.title_th, title_en = EXCLUDED.title_en,
  desc_th = EXCLUDED.desc_th, desc_en = EXCLUDED.desc_en,
  approvers = EXCLUDED.approvers, sections = EXCLUDED.sections,
  avg_days = EXCLUDED.avg_days, is_active = EXCLUDED.is_active,
  updated_at = NOW();


-- ── Verify ───────────────────────────────────────────────────
SELECT
  code,
  title_th,
  jsonb_array_length(sections)  AS section_count,
  jsonb_array_length(approvers) AS approver_count,
  avg_days,
  is_active
FROM public.form_templates
WHERE code LIKE 'FM-IT-%'
ORDER BY code;
