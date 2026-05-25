-- ═══════════════════════════════════════════════════════════════
--  TTMFlow v2 — Forms, Requests, Notifications, Flows
--  Run AFTER schema.sql (which creates users + role_permissions)
--  Run in Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ── Form Templates ───────────────────────────────────────────
DROP TABLE IF EXISTS public.form_templates CASCADE;
CREATE TABLE public.form_templates (
  code        TEXT        PRIMARY KEY,
  icon        TEXT        DEFAULT 'file-text',
  color       TEXT        DEFAULT 'blue',
  category    TEXT        NOT NULL,
  title_th    TEXT        NOT NULL,
  title_en    TEXT        NOT NULL,
  desc_th     TEXT        DEFAULT '',
  desc_en     TEXT        DEFAULT '',
  approvers   JSONB       DEFAULT '[]'::jsonb,
  sections    JSONB       DEFAULT '[]'::jsonb,
  avg_days    NUMERIC     DEFAULT 1.0,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.form_templates DISABLE ROW LEVEL SECURITY;

-- ── Requests ─────────────────────────────────────────────────
DROP TABLE IF EXISTS public.requests CASCADE;
CREATE TABLE public.requests (
  id            TEXT        PRIMARY KEY,
  template      TEXT        NOT NULL,
  title_th      TEXT        DEFAULT '',
  title_en     TEXT        DEFAULT '',
  requester     TEXT        NOT NULL,
  priority      TEXT        DEFAULT 'normal',
  status        TEXT        DEFAULT 'pending',
  current_step  INT         DEFAULT 0,
  steps         JSONB       DEFAULT '[]'::jsonb,
  payload       JSONB       DEFAULT '{}'::jsonb,
  links         JSONB       DEFAULT '{}'::jsonb,
  reject_reason TEXT        DEFAULT '',
  auto_spawned  BOOLEAN     DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_requester ON public.requests(requester);
CREATE INDEX idx_requests_template ON public.requests(template);

-- ── Notifications ────────────────────────────────────────────
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id          TEXT        PRIMARY KEY,
  channel     TEXT        NOT NULL,
  recipient   TEXT        DEFAULT '',
  subject     TEXT        DEFAULT '',
  status      TEXT        DEFAULT 'delivered',
  req_id      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_channel ON public.notifications(channel);
CREATE INDEX idx_notifications_req ON public.notifications(req_id);

-- ── Flow Templates ───────────────────────────────────────────
DROP TABLE IF EXISTS public.flow_templates CASCADE;
CREATE TABLE public.flow_templates (
  id          TEXT        PRIMARY KEY,
  title_th    TEXT        NOT NULL,
  title_en    TEXT        NOT NULL,
  desc_th     TEXT        DEFAULT '',
  desc_en     TEXT        DEFAULT '',
  icon        TEXT        DEFAULT 'trending-up',
  color       TEXT        DEFAULT 'blue',
  owner       TEXT        DEFAULT '',
  avg_days    NUMERIC     DEFAULT 7,
  steps       JSONB       DEFAULT '[]'::jsonb,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.flow_templates DISABLE ROW LEVEL SECURITY;

-- ── Flow Instances ───────────────────────────────────────────
DROP TABLE IF EXISTS public.flow_instances CASCADE;
CREATE TABLE public.flow_instances (
  id              TEXT        PRIMARY KEY,
  template        TEXT        NOT NULL,
  title_th        TEXT        DEFAULT '',
  title_en        TEXT        DEFAULT '',
  requester       TEXT        NOT NULL,
  status          TEXT        DEFAULT 'active',
  current_step_idx INT        DEFAULT 0,
  step_states     JSONB       DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.flow_instances DISABLE ROW LEVEL SECURITY;

-- ── Integration Settings (key/value JSON) ────────────────────
DROP TABLE IF EXISTS public.integration_settings CASCADE;
CREATE TABLE public.integration_settings (
  channel     TEXT        PRIMARY KEY,
  config      JSONB       DEFAULT '{}'::jsonb,
  is_active   BOOLEAN     DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.integration_settings DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
--  SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- ── Form Templates ───────────────────────────────────────────
INSERT INTO public.form_templates (code, icon, color, category, title_th, title_en, desc_th, desc_en, approvers, sections, avg_days) VALUES
('FM-IT-01-01','monitor','blue','IT','ขอใช้ระบบ / อุปกรณ์','Request to Use System / Equipment','ขอ Email, สิทธิ์ระบบ, PC, Notebook, Headset, VPN, License','Request email, system access, PC, notebook, headset, VPN, license','["หัวหน้าฝ่ายผู้แจ้ง","ผู้จัดการฝ่าย IT","เจ้าหน้าที่ IT ผู้รับงาน"]'::jsonb,'[]'::jsonb,1.5),
('FM-IT-01-09','phone','violet','IT','จัดการคิวรับสายระบบโทรศัพท์','PBX Queue Management','สร้าง/ยกเลิกคิว, ปรับ Ring Strategy, เพิ่ม/ลด/โอนย้าย Agent','Create/delete queue, ring strategy, add/remove/transfer agents','["หัวหน้าโปรเจกต์","ผู้จัดการฝ่าย IT","เจ้าหน้าที่ IT"]'::jsonb,'[]'::jsonb,0.8),
('FM-IT-01-10','wrench','amber','IT','ขอจัดการติดตั้งอุปกรณ์ไอที','IT Equipment Installation','เพิ่ม/ย้าย/ยกเลิกจุดติดตั้ง PC, IP Phone, SIM Gateway','Add/move/decommission stations, IP phone, SIM gateway','["หัวหน้าโปรเจกต์","ผู้จัดการฝ่าย IT","เจ้าหน้าที่ IT"]'::jsonb,'[]'::jsonb,2.0),
('FM-IT-01-11','lifebuoy','rose','IT','แจ้งซ่อมและขอความช่วยเหลือทางไอที','IT Support & Repair Ticket','แจ้งอุปกรณ์เสีย, ลืมรหัสผ่าน, ขัดข้องเครือข่าย, VPN','Report broken equipment, password reset, network, VPN','["เจ้าหน้าที่ IT"]'::jsonb,'[]'::jsonb,0.3),
('FM-SL-04-01','trending-up','blue','SL','ใบแจ้งเปิดโครงการใหม่','New Project Kickoff','ใช้โดยฝ่ายขายเพื่อแจ้งเปิดโครงการใหม่ สามารถผูกเข้ากับ Flow ข้ามแผนกได้','Sales-led form for opening a new project; can be attached to a multi-dept Flow','["Sales Manager","Operations Director","CEO Office"]'::jsonb,'[]'::jsonb,2.0),
('FM-HR-02-01','users','teal','HR','ใบขอกำลังพล (Headcount Request)','Headcount Request','ฝ่ายใดก็ใช้ได้ — ขอรับพนักงานเพิ่มสำหรับโครงการ/แผนก','For any dept — request additional headcount','["หัวหน้าฝ่ายผู้ขอ","HR Manager","ฝ่ายการเงิน"]'::jsonb,'[]'::jsonb,2.5),
('FM-HR-02-03','user-plus','teal','HR','ขอเปิดข้อมูลพนักงานใหม่','New Employee Onboarding Request','ตัวอย่างฟอร์มข้ามแผนก ออก Employee ID, ขอ Email จาก IT อัตโนมัติ','Cross-dept template, generate Employee ID, auto-link IT email request','["HR Manager","หัวหน้าฝ่ายปลายทาง","ฝ่าย IT"]'::jsonb,'[]'::jsonb,2.5),
('FM-FI-03-02','wallet','emerald','FI','ขอเบิกค่าใช้จ่ายโครงการ','Project Expense Reimbursement','ตัวอย่างฟอร์มข้ามแผนก ขออนุมัติเบิกตามลำดับ Approver','Cross-dept template, multi-level approval reimbursement','["หัวหน้าโครงการ","ผู้จัดการฝ่าย","ฝ่ายบัญชี","CFO"]'::jsonb,'[]'::jsonb,3.5)
ON CONFLICT (code) DO NOTHING;

-- ── Requests (seed) ──────────────────────────────────────────
INSERT INTO public.requests (id, template, title_th, title_en, requester, priority, status, current_step, steps, payload, links, auto_spawned, created_at, updated_at) VALUES
('SL0401-260515-0028','FM-SL-04-01','เปิดโครงการใหม่ — AIS Premier Outbound Q3/2026','New Project — AIS Premier Outbound Q3/2026','SAL001','high','approved',3,
 '[{"role":"Requester","user":"SAL001","action":"submitted","at":"2026-05-15 09:30","signed":true},{"role":"Sales Manager","user":"SAL002","action":"approved","at":"2026-05-15 14:00","signed":true},{"role":"Operations Director","user":"APP001","action":"approved","at":"2026-05-17 10:45","signed":true},{"role":"CEO Office","user":"ADM001","action":"approved","at":"2026-05-18 16:20","signed":true}]'::jsonb,
 '{"projectName":"AIS Premier Outbound Q3/2026","client":"AIS (Advanced Info Service)","seatCount":30,"goLive":"2026-07-01","monthlyRevenue":"THB 3,200,000"}'::jsonb,
 '{"triggers":["HR0201-260518-0042","IT0110-260518-0145"]}'::jsonb,
 false,'2026-05-15 09:30','2026-05-18 16:20'),
('HR0201-260518-0042','FM-HR-02-01','ขอกำลังพล 30 คน สำหรับโครงการ AIS Premier','Headcount Request — 30 agents for AIS Premier','REQ003','high','approved',3,
 '[{"role":"Requester","user":"REQ003","action":"submitted","at":"2026-05-18 16:25","signed":true,"auto":true},{"role":"หัวหน้าฝ่ายผู้ขอ","user":"APP001","action":"approved","at":"2026-05-19 09:15","signed":true},{"role":"HR Manager","user":"HRM001","action":"approved","at":"2026-05-20 14:30","signed":true},{"role":"ฝ่ายการเงิน","user":"FIN001","action":"approved","at":"2026-05-22 11:00","signed":true}]'::jsonb,
 '{"headcount":30,"positions":["Call Center Agent x 26","Team Leader x 3","QA x 1"],"startDate":"2026-06-15","project":"AIS Premier Outbound Q3/2026"}'::jsonb,
 '{"triggeredBy":"SL0401-260515-0028","triggers":["IT0101-260523-0149","IT0101-260524-0150","IT0101-260524-0151"]}'::jsonb,
 true,'2026-05-18 16:25','2026-05-22 11:00'),
('IT0110-260518-0145','FM-IT-01-10','ติดตั้งจุดทำงาน 30 ที่ — โครงการ AIS Premier ชั้น 7','Install 30 stations — Project AIS Premier floor 7','IT002','high','inProgress',3,
 '[{"role":"Requester","user":"IT002","action":"submitted","at":"2026-05-18 16:25","signed":true,"auto":true},{"role":"หัวหน้าโปรเจกต์","user":"APP001","action":"approved","at":"2026-05-19 11:00","signed":true},{"role":"ผู้จัดการ IT","user":"APP002","action":"approved","at":"2026-05-20 15:00","signed":true},{"role":"เจ้าหน้าที่ IT","user":"IT002","action":"in_progress","at":"2026-05-23 09:30","signed":false}]'::jsonb,
 '{"stations":30,"includes":["PC Desktop","Headset","IP Phone","Softphone License"],"goLive":"2026-06-30"}'::jsonb,
 '{"triggeredBy":"SL0401-260515-0028"}'::jsonb,
 true,'2026-05-18 16:25','2026-05-23 09:30'),
('IT0101-260523-0149','FM-IT-01-01','เปิดสิทธิ์ใช้ระบบ — กชกร ผ่องใส (รุ่นแรก)','System access — Kotchakorn Phongsai (cohort 1)','HRM002','normal','approved',3,
 '[{"role":"Requester","user":"HRM002","action":"submitted","at":"2026-05-23 10:00","signed":true,"auto":true},{"role":"หัวหน้าฝ่าย","user":"APP001","action":"approved","at":"2026-05-23 16:30","signed":true},{"role":"ผู้จัดการ IT","user":"APP002","action":"approved","at":"2026-05-24 09:45","signed":true},{"role":"เจ้าหน้าที่ IT","user":"IT001","action":"in_progress","at":"2026-05-24 14:15","signed":false}]'::jsonb,
 '{"employeeName":"กชกร ผ่องใส","employeeId":"EMP-2526-018","position":"Call Center Agent","department":"Operations / AIS Premier","effectiveDate":"2026-06-15"}'::jsonb,
 '{"triggeredBy":"HR0201-260518-0042"}'::jsonb,
 true,'2026-05-23 10:00','2026-05-24 14:15'),
('IT0101-260524-0142','FM-IT-01-01','ขอเปิด Email และสิทธิ์ PBX สำหรับพนักงานใหม่','New email + PBX access for new hire','REQ003','normal','pending',2,
 '[{"role":"Requester","user":"REQ003","action":"submitted","at":"2026-05-24 09:14","signed":true},{"role":"หัวหน้าฝ่าย","user":"APP001","action":"approved","at":"2026-05-24 14:32","signed":true},{"role":"ผู้จัดการ IT","user":"APP002","action":"pending","at":null,"signed":false},{"role":"เจ้าหน้าที่ IT","user":"IT001","action":"queued","at":null,"signed":false}]'::jsonb,
 '{"employeeName":"นพดล ศรีจันทร์","employeeId":"EMP-2526-014","position":"Call Center Agent","department":"Operations / Project AIS","effectiveDate":"2026-06-01"}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-24 09:14','2026-05-25 11:02'),
('IT0109-260525-0143','FM-IT-01-09','สร้างคิวใหม่ Project SCB-Premier','New PBX queue for Project SCB-Premier','REQ003','high','pending',1,
 '[{"role":"Requester","user":"REQ003","action":"submitted","at":"2026-05-25 08:42","signed":true},{"role":"หัวหน้าโปรเจกต์","user":"APP001","action":"pending","at":null,"signed":false},{"role":"ผู้จัดการ IT","user":"APP002","action":"queued","at":null,"signed":false},{"role":"เจ้าหน้าที่ IT","user":"IT002","action":"queued","at":null,"signed":false}]'::jsonb,
 '{"queueName":"SCB-Premier-Inbound","ringStrategy":"Round Robin","outbound":["Domestic"],"members":12,"goLive":"2026-06-03 09:00"}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-25 08:42','2026-05-25 08:42'),
('IT0111-260525-0144','FM-IT-01-11','หูฟัง Jabra Evolve 30 ไม่มีเสียง — ด่วนมาก','Jabra Evolve 30 headset no audio — urgent','REQ001','urgent','inProgress',1,
 '[{"role":"Requester","user":"REQ001","action":"submitted","at":"2026-05-25 10:18","signed":true},{"role":"เจ้าหน้าที่ IT","user":"IT001","action":"in_progress","at":"2026-05-25 10:51","signed":false}]'::jsonb,
 '{"assetId":"TTM-HS-0431","severity":"เร่งด่วนมาก (Impact 100%)","symptoms":"หูฟังไม่มีเสียงทั้งซ้ายและขวา ทดสอบเสียบเครื่องอื่นก็ไม่ได้ยิน","ticketNo":"TKT-0598"}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-25 10:18','2026-05-25 10:51'),
('IT0110-260523-0140','FM-IT-01-10','ขยายจุดติดตั้ง 8 ที่นั่ง Project TRUE ชั้น 5','Expand 8 stations, Project TRUE floor 5','REQ002','normal','approved',3,
 '[{"role":"Requester","user":"REQ002","action":"submitted","at":"2026-05-23 15:02","signed":true},{"role":"หัวหน้าโปรเจกต์","user":"APP001","action":"approved","at":"2026-05-23 17:11","signed":true},{"role":"ผู้จัดการ IT","user":"APP002","action":"approved","at":"2026-05-24 09:45","signed":true},{"role":"เจ้าหน้าที่ IT","user":"IT002","action":"in_progress","at":"2026-05-25 09:30","signed":false}]'::jsonb,
 '{"stations":8,"includes":["PC Desktop","Headset","IP Phone"],"goLive":"2026-06-10"}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-23 15:02','2026-05-25 09:30'),
('IT0101-260522-0138','FM-IT-01-01','ขอ VPN Account สำหรับ Work from home','VPN account for work from home','REQ002','normal','done',4,
 '[{"role":"Requester","user":"REQ002","action":"submitted","at":"2026-05-22 11:30","signed":true},{"role":"หัวหน้าฝ่าย","user":"APP001","action":"approved","at":"2026-05-22 14:00","signed":true},{"role":"ผู้จัดการ IT","user":"APP002","action":"approved","at":"2026-05-23 09:00","signed":true},{"role":"เจ้าหน้าที่ IT","user":"IT002","action":"done","at":"2026-05-23 10:14","signed":true}]'::jsonb,
 '{"items":["VPN Account"],"purpose":"ทำงานจากบ้านวันศุกร์"}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-22 11:30','2026-05-23 10:14'),
('IT0111-260521-0136','FM-IT-01-11','ลืมรหัสผ่าน Email','Forgot email password','REQ001','normal','done',2,
 '[{"role":"Requester","user":"REQ001","action":"submitted","at":"2026-05-21 08:05","signed":true},{"role":"เจ้าหน้าที่ IT","user":"IT001","action":"done","at":"2026-05-21 08:42","signed":true}]'::jsonb,
 '{}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-21 08:05','2026-05-21 08:42'),
('HR0203-260520-0089','FM-HR-02-03','เปิดข้อมูลพนักงานใหม่ — กชกร ผ่องใส','New employee onboarding — Kotchakorn Phongsai','REQ003','normal','approved',3,
 '[{"role":"Requester","user":"REQ003","action":"submitted","at":"2026-05-20 09:00","signed":true},{"role":"HR Manager","user":"APP001","action":"approved","at":"2026-05-20 13:15","signed":true},{"role":"หัวหน้าฝ่าย","user":"APP002","action":"approved","at":"2026-05-21 09:30","signed":true},{"role":"ฝ่าย IT","user":"IT001","action":"in_progress","at":"2026-05-22 16:10","signed":false}]'::jsonb,
 '{}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-20 09:00','2026-05-22 16:10'),
('IT0109-260518-0131','FM-IT-01-09','ย้าย Agent 5 คน จาก Queue AIS-A ไป AIS-B','Transfer 5 agents from AIS-A to AIS-B','REQ001','normal','rejected',1,
 '[{"role":"Requester","user":"REQ001","action":"submitted","at":"2026-05-18 10:00","signed":true},{"role":"หัวหน้าโปรเจกต์","user":"APP001","action":"rejected","at":"2026-05-19 11:20","signed":true}]'::jsonb,
 '{}'::jsonb,
 '{}'::jsonb,
 false,'2026-05-18 10:00','2026-05-19 11:20')
ON CONFLICT (id) DO NOTHING;

UPDATE public.requests SET reject_reason = 'ต้องได้รับการยืนยันจาก Project Manager AIS-B ก่อน' WHERE id = 'IT0109-260518-0131';

-- ── Notifications ────────────────────────────────────────────
INSERT INTO public.notifications (id, channel, recipient, subject, status, req_id, created_at) VALUES
('N-0421','line','Group: IT Operations','📋 คำขอใหม่ IT0109-260525-0143 — สร้างคิว SCB-Premier','delivered','IT0109-260525-0143','2026-05-25 08:42'),
('N-0420','email','it-team@talktome.co.th','[Approve Required] IT0109-260525-0143','delivered','IT0109-260525-0143','2026-05-25 08:42'),
('N-0419','inapp','APP001','มีคำขอใหม่รออนุมัติ (1 รายการ)','read','IT0109-260525-0143','2026-05-25 08:42'),
('N-0418','line','Group: IT Support','🚨 แจ้งซ่อมด่วนมาก — หูฟัง TTM-HS-0431','delivered','IT0111-260525-0144','2026-05-25 10:18'),
('N-0417','email','parinya.r@talktome.co.th','[Ticket TKT-0598] Headset no audio — urgent','delivered','IT0111-260525-0144','2026-05-25 10:18'),
('N-0416','line','REQ001 (สมชาย)','✅ คำขอ TKT-0598 ถูกรับเข้าคิวงานแล้ว — IT001 รับงาน','delivered','IT0111-260525-0144','2026-05-25 10:51'),
('N-0415','email','tanawat.s@talktome.co.th','[Approve Required] IT0101-260524-0142','delivered','IT0101-260524-0142','2026-05-24 09:14'),
('N-0414','line','APP001 (ธนวัฒน์)','📋 รออนุมัติคำขอเปิด Email พนักงานใหม่','delivered','IT0101-260524-0142','2026-05-24 09:14'),
('N-0413','email','chanikan.p@talktome.co.th','[Approve Required] IT0101-260524-0142 (ขั้นที่ 2)','delivered','IT0101-260524-0142','2026-05-24 14:32'),
('N-0412','line','REQ003 (ณัฐกานต์)','✅ ขั้นที่ 1/3 อนุมัติแล้วโดย ธนวัฒน์ ศ.','delivered','IT0101-260524-0142','2026-05-24 14:32')
ON CONFLICT (id) DO NOTHING;

-- ── Flow Templates ───────────────────────────────────────────
INSERT INTO public.flow_templates (id, title_th, title_en, desc_th, desc_en, icon, color, owner, avg_days, steps) VALUES
('FT-NEW-PROJECT','เปิดโครงการใหม่','New Project Setup','ตั้งแต่ฝ่ายขายเปิดโครงการ → HR เปิดอัตรากำลัง → IT เตรียมอุปกรณ์ + เปิดสิทธิ์พนักงาน','End-to-end: Sales kickoff → HR headcount → IT setup → User access','trending-up','blue','Sales',14,
 '[{"id":"s1","form":"FM-SL-04-01","deptTh":"ฝ่ายขาย","deptEn":"Sales","optional":false},{"id":"s2","form":"FM-HR-02-01","deptTh":"ฝ่ายบุคคล","deptEn":"HR","optional":false,"dependsOn":"s1"},{"id":"s3","form":"FM-IT-01-10","deptTh":"ฝ่ายไอที","deptEn":"IT","optional":false,"dependsOn":"s1","parallelWith":"s2"},{"id":"s4","form":"FM-IT-01-01","deptTh":"ฝ่ายไอที","deptEn":"IT","optional":false,"dependsOn":"s2","multiplePerHeadcount":true},{"id":"s5","form":"FM-IT-01-09","deptTh":"ฝ่ายไอที","deptEn":"IT","optional":true,"dependsOn":"s3"}]'::jsonb),
('FT-NEW-EMPLOYEE','รับพนักงานใหม่','New Employee Onboarding','HR เปิดข้อมูลพนักงาน → IT เปิดสิทธิ์ + อุปกรณ์','HR opens employee record → IT issues access + equipment','user-plus','teal','HR',5,
 '[{"id":"s1","form":"FM-HR-02-03","deptTh":"ฝ่ายบุคคล","deptEn":"HR","optional":false},{"id":"s2","form":"FM-IT-01-01","deptTh":"ฝ่ายไอที","deptEn":"IT","optional":false,"dependsOn":"s1"}]'::jsonb),
('FT-CLOSE-PROJECT','ปิดโครงการ / ส่งคืนทรัพย์สิน','Project Closure & Asset Return','ฝ่ายขายแจ้งปิด → HR เลิกจ้าง → IT คืนสิทธิ์ + เก็บอุปกรณ์ → การเงินทำรอบปิดสุดท้าย','Sales notice → HR offboarding → IT revoke access + collect → Finance final billing','archive','rose','Sales',10,
 '[{"id":"s1","form":"FM-SL-04-01","deptTh":"ฝ่ายขาย","deptEn":"Sales","optional":false,"labelTh":"แจ้งปิดโครงการ","labelEn":"Closure notice"},{"id":"s2","form":"FM-IT-01-01","deptTh":"ฝ่ายไอที","deptEn":"IT","optional":false,"dependsOn":"s1","labelTh":"ยกเลิกสิทธิ์พนักงาน","labelEn":"Revoke user access"},{"id":"s3","form":"FM-IT-01-10","deptTh":"ฝ่ายไอที","deptEn":"IT","optional":false,"dependsOn":"s2","labelTh":"เก็บอุปกรณ์","labelEn":"Collect equipment"},{"id":"s4","form":"FM-FI-03-02","deptTh":"ฝ่ายการเงิน","deptEn":"Finance","optional":false,"dependsOn":"s3","labelTh":"ปิดงบโครงการ","labelEn":"Final billing"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── Flow Instances ───────────────────────────────────────────
INSERT INTO public.flow_instances (id, template, title_th, title_en, requester, status, current_step_idx, step_states, created_at, updated_at) VALUES
('FL-260515-001','FT-NEW-PROJECT','AIS Premier Outbound Q3/2026','AIS Premier Outbound Q3/2026','SAL001','active',2,
 '[{"stepId":"s1","reqIds":["SL0401-260515-0028"],"status":"approved","completedAt":"2026-05-18 16:20"},{"stepId":"s2","reqIds":["HR0201-260518-0042"],"status":"approved","completedAt":"2026-05-22 11:00"},{"stepId":"s3","reqIds":["IT0110-260518-0145"],"status":"inProgress"},{"stepId":"s4","reqIds":["IT0101-260523-0149"],"status":"inProgress"},{"stepId":"s5","reqIds":[],"status":"pending"}]'::jsonb,
 '2026-05-15 09:30','2026-05-25 09:30'),
('FL-260522-002','FT-NEW-EMPLOYEE','Onboarding กชกร ผ่องใส','Onboarding — Kotchakorn Phongsai','HRM001','active',1,
 '[{"stepId":"s1","reqIds":["HR0203-260520-0089"],"status":"approved","completedAt":"2026-05-22 16:10"},{"stepId":"s2","reqIds":[],"status":"inProgress"}]'::jsonb,
 '2026-05-20 09:00','2026-05-24 14:15'),
('FL-260510-003','FT-NEW-PROJECT','TRUE Mobile Care Outbound','TRUE Mobile Care Outbound','SAL002','done',4,
 '[{"stepId":"s1","reqIds":["SL0401-260422-0019"],"status":"approved","completedAt":"2026-04-24 11:00"},{"stepId":"s2","reqIds":["HR0201-260425-0028"],"status":"approved","completedAt":"2026-04-28 09:00"},{"stepId":"s3","reqIds":["IT0110-260425-0098"],"status":"approved","completedAt":"2026-04-30 16:00"},{"stepId":"s4","reqIds":["IT0101-260502-0112","IT0101-260502-0113"],"status":"done","completedAt":"2026-05-05 14:00"},{"stepId":"s5","reqIds":["IT0109-260506-0102"],"status":"done","completedAt":"2026-05-08 16:00"}]'::jsonb,
 '2026-04-22 10:00','2026-05-08 16:00')
ON CONFLICT (id) DO NOTHING;

-- ── Integration Settings ─────────────────────────────────────
INSERT INTO public.integration_settings (channel, config, is_active) VALUES
('line', '{"botName":"TTMFlow Bot","groups":["IT Operations","IT Support","HR Notify","Sales Ops","Finance"]}'::jsonb, true),
('email', '{"provider":"Microsoft 365","fromAddress":"no-reply@talktome.co.th","replyTo":"qmr@talktome.co.th"}'::jsonb, true),
('inapp', '{"bellEnabled":true,"soundEnabled":false}'::jsonb, true),
('webhook', '{"endpoints":[]}'::jsonb, false)
ON CONFLICT (channel) DO NOTHING;
