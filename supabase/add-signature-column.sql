-- Add signature column to users table
-- Stores a base64 PNG data URL of the user's signature
-- Required before user can submit forms or approve requests

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS signature TEXT DEFAULT NULL;

COMMENT ON COLUMN public.users.signature IS
  'Base64 data URL of user signature image (PNG). NULL means user has not set up signature yet.';
