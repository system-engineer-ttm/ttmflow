-- Signing tokens for external (non-user) signers
-- Each request can have multiple tokens (one per external step).
-- Token is stored hashed; only the URL contains the plaintext.

CREATE TABLE IF NOT EXISTS public.signing_tokens (
  id              SERIAL PRIMARY KEY,
  request_id      TEXT        NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  step_idx        INTEGER     NOT NULL,
  token_hash      TEXT        NOT NULL UNIQUE,
  recipient_name  TEXT        DEFAULT '',     -- resolved from form field at creation
  recipient_title TEXT        DEFAULT '',
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  open_ip         TEXT,
  open_ua         TEXT,
  signature       TEXT,                       -- base64 PNG once signed
  created_by      TEXT        REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signing_tokens_request   ON public.signing_tokens(request_id);
CREATE INDEX IF NOT EXISTS idx_signing_tokens_hash      ON public.signing_tokens(token_hash);

-- Disable RLS — handled at the API layer with token verification
ALTER TABLE public.signing_tokens DISABLE ROW LEVEL SECURITY;
