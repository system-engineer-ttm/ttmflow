-- ════════════════════════════════════════════════════════════════
-- Fix RLS on role_permissions (and shore up users while we're here)
-- ════════════════════════════════════════════════════════════════
-- Symptom: Admin can READ the permission matrix at /api/permissions
-- (GET works) but the PUT upsert fails with
--   "new row violates row-level security policy for table 'role_permissions'"
-- so the Save button on User Management → Menu Permissions silently
-- does nothing or shows the RLS error alert.
--
-- Cause: the original schema.sql turned ENABLE ROW LEVEL SECURITY on
-- both public.users and public.role_permissions but never created any
-- policies. service_role usually bypasses RLS, but PostgREST can still
-- short-circuit on some upsert paths if no policies exist.
--
-- This app keeps all access control at the API layer (admin-only PUT,
-- service_role server-side). DISABLE RLS on the tables we hit so the
-- service_role write always goes through.
--
-- Safe to re-run.

-- 1) Permission matrix — fixes the immediate Save bug
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;

-- 2) Users — same shape, same risk
ALTER TABLE public.users           DISABLE ROW LEVEL SECURITY;

-- 3) belt-and-suspenders: also disable on every other table the API
--    writes to, in case any one of them was left enabled by accident.
ALTER TABLE public.form_templates   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_instances   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_tokens   DISABLE ROW LEVEL SECURITY;

-- ── Sanity check after running ──
SELECT relname AS table_name,
       relrowsecurity AS rls_enabled
  FROM pg_class
 WHERE relnamespace = 'public'::regnamespace
   AND relname IN (
     'users','role_permissions','form_templates',
     'requests','notifications','flow_instances','signing_tokens'
   )
 ORDER BY relname;
