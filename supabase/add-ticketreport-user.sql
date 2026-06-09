-- ════════════════════════════════════════════════════════════════
-- Add the "ticketreport" report-only user + its permission rows
-- ════════════════════════════════════════════════════════════════
-- This user can see ONLY the "Service Ticket Summary" menu (route
-- key: caseSummary) and nothing else. The sidebar/route guard read
-- the static ROLE_PERMISSIONS in lib/data.js (already updated), so
-- this SQL just (a) creates the login and (b) keeps the DB
-- role_permissions table consistent for the admin Permissions UI.
--
-- Requires the pgcrypto extension (already enabled by schema.sql for
-- the crypt()/gen_salt() password hashing the rest of the seed uses).
--
-- Default password: 1234  →  CHANGE IT after first login.
-- Safe to re-run (upsert on conflict).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) the user
INSERT INTO public.users
  (id, name_th, name_en, title_th, title_en, dept, avatar, color, username, password_hash, role, is_active)
VALUES
  ('RPT001', 'Ticket Report', 'Ticket Report', 'รายงาน Ticket', 'Ticket Report',
   'Service Desk', 'TR', '#4338ca', 'ticketreport',
   crypt('1234', gen_salt('bf', 10)), 'ticketreport', true)
ON CONFLICT (username) DO UPDATE
  SET role      = EXCLUDED.role,
      is_active = true,
      name_th   = EXCLUDED.name_th,
      name_en   = EXCLUDED.name_en,
      updated_at = NOW();

-- 2) permission rows for the new role — only caseSummary is allowed.
--    (route, role, allowed)
INSERT INTO public.role_permissions (route, role, allowed) VALUES
  ('dashboard',    'ticketreport', false),
  ('flows',        'ticketreport', false),
  ('new',          'ticketreport', false),
  ('my',           'ticketreport', false),
  ('approvals',    'ticketreport', false),
  ('it',           'ticketreport', false),
  ('archive',      'ticketreport', false),
  ('notif',        'ticketreport', false),
  ('caseSummary',  'ticketreport', true ),
  ('settings',     'ticketreport', false),
  ('integrations', 'ticketreport', false),
  ('users',        'ticketreport', false)
ON CONFLICT (route, role) DO UPDATE SET allowed = EXCLUDED.allowed;

-- 3) make sure the caseSummary row exists for the other roles too,
--    matching the static defaults (IT + Admin + Auditor can view it).
INSERT INTO public.role_permissions (route, role, allowed) VALUES
  ('caseSummary', 'requester', false),
  ('caseSummary', 'approver',  false),
  ('caseSummary', 'it',        true ),
  ('caseSummary', 'admin',     true ),
  ('caseSummary', 'auditor',   true )
ON CONFLICT (route, role) DO UPDATE SET allowed = EXCLUDED.allowed;

-- ── Sanity check ──
SELECT id, username, role, is_active FROM public.users WHERE username = 'ticketreport';
SELECT route, role, allowed FROM public.role_permissions
  WHERE role = 'ticketreport' ORDER BY route;
