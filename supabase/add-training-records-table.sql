-- Security Awareness Training 2026 — results store
-- One row per completed course attempt. RLS is DISABLED (TTMFlow convention:
-- all access goes through server-side API routes using the service-role key,
-- gated by verifyToken()). Do NOT add anon policies.

create table if not exists public.training_records (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  user_id      text,                       -- TTMFlow user id (from session), for linkage/audit
  name         text,
  emp_id       text,
  dept         text,
  pre_score    int,
  post_best    int,
  post_last    int,
  total        int,
  attempts     int,
  passed       boolean,
  score_pct    int,
  threshold_pct int,
  started_at   timestamptz,
  completed_at timestamptz
);

alter table public.training_records disable row level security;

-- Make the new menu controllable from User Management → Permissions.
-- Everyone can take the training; the in-page admin dashboard is gated to
-- admin/auditor inside the app. Adjust here or in the Permissions tab later.
insert into public.role_permissions (route, role, allowed) values
  ('secAware', 'requester',    true),
  ('secAware', 'approver',     true),
  ('secAware', 'it',           true),
  ('secAware', 'admin',        true),
  ('secAware', 'auditor',      true),
  ('secAware', 'ticketreport', true)
on conflict (route, role) do nothing;
