-- Add must_change_password flag to users table
-- When TRUE, the user is forced to set a new password on their next login
-- before they can use the app.
--
-- Set TRUE automatically when:
--   • an admin creates a user (POST /api/users)
--   • users are bulk-imported (POST /api/users/import)
--   • an admin resets a user's password (PUT /api/users/[id] with a new password)
-- Cleared (FALSE) when the user changes their own password
--   (PUT /api/users/me/password) or completes a reset (POST /api/auth/reset-password).
--
-- Existing users default to FALSE, so current accounts are NOT forced to change.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.users.must_change_password IS
  'When TRUE, force the user to change their password on next login (first login / admin reset).';
