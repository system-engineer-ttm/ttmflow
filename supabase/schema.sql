-- ═══════════════════════════════════════════════════════════════
--  TTMFlow — Supabase Schema + Seed
--  Run this in Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
  id            TEXT        PRIMARY KEY,
  name_th       TEXT        NOT NULL DEFAULT '',
  name_en       TEXT        NOT NULL DEFAULT '',
  title_th      TEXT        DEFAULT '',
  title_en      TEXT        DEFAULT '',
  dept          TEXT        DEFAULT '',
  avatar        TEXT        DEFAULT '',
  color         TEXT        DEFAULT '#3b82f6',
  username      TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'requester',
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Role Permissions ─────────────────────────────────────────
DROP TABLE IF EXISTS public.role_permissions CASCADE;
CREATE TABLE public.role_permissions (
  route      TEXT        NOT NULL,
  role       TEXT        NOT NULL,
  allowed    BOOLEAN     DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (route, role)
);

-- ── Row Level Security ───────────────────────────────────────
-- (API routes use service_role key — they bypass RLS automatically)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ── Seed: Users (รหัสผ่านทุกคน = "1234") ────────────────────
INSERT INTO public.users (id, name_th, name_en, title_th, title_en, dept, avatar, color, username, password_hash, role, is_active)
VALUES
  ('REQ001','สมชาย ใจดี',         'Somchai Jaidee',       'Call Center Agent',                 'Call Center Agent',                 'Operations / Project AIS',  'SJ','#3b82f6','req001', crypt('1234', gen_salt('bf',10)), 'requester', true),
  ('REQ002','ปิยะพร แสงทอง',      'Piyaporn Saengthong',  'Senior Agent',                      'Senior Agent',                      'Operations / Project TRUE', 'PS','#a855f7','req002', crypt('1234', gen_salt('bf',10)), 'requester', true),
  ('REQ003','ณัฐกานต์ วงศ์ใหญ่', 'Natthakan Wongyai',    'Team Leader',                       'Team Leader',                       'Operations / Project SCB',  'NW','#f59e0b','req003', crypt('1234', gen_salt('bf',10)), 'requester', true),
  ('APP001','ธนวัฒน์ ศรีสุวรรณ',  'Tanawat Srisuwan',     'Operations Manager',                'Operations Manager',                'Operations',                'TS','#0ea5e9','app001', crypt('1234', gen_salt('bf',10)), 'approver',  true),
  ('APP002','ชนิกานต์ พรหมศรี',   'Chanikan Phromsri',    'IT Manager',                        'IT Manager',                        'IT',                        'CP','#10b981','app002', crypt('1234', gen_salt('bf',10)), 'approver',  true),
  ('IT001', 'ปริญญา รักสะอาด',    'Parinya Raksaard',     'IT Support Engineer',               'IT Support Engineer',               'IT',                        'PR','#06b6d4','it001',  crypt('1234', gen_salt('bf',10)), 'it',        true),
  ('IT002', 'ภาสกร เลิศวิทย์',    'Paskorn Lertwit',      'Network & VoIP Engineer',           'Network & VoIP Engineer',           'IT',                        'PL','#8b5cf6','it002',  crypt('1234', gen_salt('bf',10)), 'it',        true),
  ('ADM001','ศิริพร ทองคำ',       'Siriporn Thongkam',    'Quality Management Representative', 'Quality Management Representative', 'QMR Office',                'ST','#ec4899','adm001', crypt('1234', gen_salt('bf',10)), 'admin',     true),
  ('AUD001','Mr. James Carter',    'Mr. James Carter',     'External Auditor',                  'External Auditor',                  'BSI Group',                 'JC','#64748b','aud001', crypt('1234', gen_salt('bf',10)), 'auditor',   true),
  ('SAL001','อนุพงษ์ มั่งมี',    'Anuphong Mangmee',     'Senior Sales Executive',            'Senior Sales Executive',            'Sales',                     'AM','#0284c7','sal001', crypt('1234', gen_salt('bf',10)), 'requester', true),
  ('SAL002','วรรณภา ใจกล้า',      'Wannapha Jaikla',      'Sales Director',                    'Sales Director',                    'Sales',                     'WJ','#0369a1','sal002', crypt('1234', gen_salt('bf',10)), 'approver',  true),
  ('HRM001','พิชญา แสนสวัสดิ์',   'Pitchaya Saensawat',   'HR Manager',                        'HR Manager',                        'Human Resources',           'PS','#0d9488','hrm001', crypt('1234', gen_salt('bf',10)), 'approver',  true),
  ('HRM002','ดวงใจ พิทักษ์',      'Duangjai Pitak',       'Recruitment Lead',                  'Recruitment Lead',                  'Human Resources',           'DP','#14b8a6','hrm002', crypt('1234', gen_salt('bf',10)), 'requester', true),
  ('FIN001','อรพรรณ บุญรอด',      'Orapan Boonrod',       'Finance Manager',                   'Finance Manager',                   'Finance',                   'OB','#059669','fin001', crypt('1234', gen_salt('bf',10)), 'approver',  true)
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Role Permissions ───────────────────────────────────
INSERT INTO public.role_permissions (route, role, allowed) VALUES
  ('dashboard',    'requester', true),  ('dashboard',    'approver', true),  ('dashboard',    'it', true),  ('dashboard',    'admin', true),  ('dashboard',    'auditor', true),
  ('flows',        'requester', true),  ('flows',        'approver', true),  ('flows',        'it', true),  ('flows',        'admin', true),  ('flows',        'auditor', true),
  ('new',          'requester', true),  ('new',          'approver', true),  ('new',          'it', true),  ('new',          'admin', true),  ('new',          'auditor', false),
  ('my',           'requester', true),  ('my',           'approver', true),  ('my',           'it', true),  ('my',           'admin', true),  ('my',           'auditor', false),
  ('approvals',    'requester', false), ('approvals',    'approver', true),  ('approvals',    'it', false), ('approvals',    'admin', true),  ('approvals',    'auditor', false),
  ('it',           'requester', false), ('it',           'approver', false), ('it',           'it', true),  ('it',           'admin', true),  ('it',           'auditor', false),
  ('archive',      'requester', true),  ('archive',      'approver', true),  ('archive',      'it', true),  ('archive',      'admin', true),  ('archive',      'auditor', true),
  ('notif',        'requester', false), ('notif',        'approver', false), ('notif',        'it', true),  ('notif',        'admin', true),  ('notif',        'auditor', false),
  ('settings',     'requester', false), ('settings',     'approver', false), ('settings',     'it', false), ('settings',     'admin', true),  ('settings',     'auditor', false),
  ('integrations', 'requester', false), ('integrations', 'approver', false), ('integrations', 'it', false), ('integrations', 'admin', true),  ('integrations', 'auditor', false),
  ('users',        'requester', false), ('users',        'approver', false), ('users',        'it', false), ('users',        'admin', true),  ('users',        'auditor', false)
ON CONFLICT (route, role) DO NOTHING;
