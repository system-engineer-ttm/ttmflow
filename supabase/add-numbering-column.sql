-- Add a JSONB column to form_templates to store the running-number config:
--   { reset: "day" | "month" | "year" | "never",
--     digits: 4,
--     current: 0,
--     lastResetPeriod: "2026-05-29" }
-- The next-number API reads & writes this column atomically per form code.

ALTER TABLE public.form_templates
  ADD COLUMN IF NOT EXISTS numbering JSONB DEFAULT NULL;

COMMENT ON COLUMN public.form_templates.numbering IS
  'Document-number config for this form (reset cadence, digit width, current counter, last reset period).';
