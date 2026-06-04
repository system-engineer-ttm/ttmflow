-- ════════════════════════════════════════════════════════════════
-- DESTRUCTIVE RESET — Run only when you really want a fresh slate.
-- ════════════════════════════════════════════════════════════════
-- Wipes:
--   - signing_tokens (all external sign tokens)
--   - notifications  (all line / email / inapp logs)
--   - requests       (every submitted form)
--   - flow_instances (every flow run)
-- Keeps:
--   - users          (accounts + signatures stay)
--   - form_templates: only FM-IT-01-01, every other form template
--     row is deleted. The FM-IT-01-01 row stays as is; only its
--     numbering counter is reset to 0 so the next submit is -0001.

BEGIN;

-- 0) ensure the numbering column exists (safe to run repeatedly)
ALTER TABLE public.form_templates
  ADD COLUMN IF NOT EXISTS numbering JSONB DEFAULT NULL;

-- 1) transactional tables
DELETE FROM public.signing_tokens;
DELETE FROM public.notifications;
DELETE FROM public.requests;
DELETE FROM public.flow_instances;

-- 2) trim form_templates down to just FM-IT-01-01
DELETE FROM public.form_templates
WHERE code <> 'FM-IT-01-01';

-- 3) reset the running-number counter for FM-IT-01-01
UPDATE public.form_templates
   SET numbering   = jsonb_build_object(
                       'reset',           'day',
                       'digits',          4,
                       'current',         0,
                       'lastResetPeriod', ''
                     ),
       updated_at  = NOW()
 WHERE code = 'FM-IT-01-01';

COMMIT;

-- ── Sanity check after running ──
SELECT
  (SELECT COUNT(*) FROM public.signing_tokens)  AS signing_tokens_left,
  (SELECT COUNT(*) FROM public.notifications)    AS notifications_left,
  (SELECT COUNT(*) FROM public.requests)         AS requests_left,
  (SELECT COUNT(*) FROM public.flow_instances)   AS flow_instances_left,
  (SELECT array_agg(code) FROM public.form_templates) AS form_templates_remaining,
  (SELECT numbering FROM public.form_templates WHERE code = 'FM-IT-01-01') AS fm_it_numbering;
