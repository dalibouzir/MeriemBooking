-- Extend download_requests with richer lead-capture fields
BEGIN;

ALTER TABLE download_requests
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean,
  ADD COLUMN IF NOT EXISTS preferred_contact_channel text,
  ADD COLUMN IF NOT EXISTS preferred_contact_time text,
  ADD COLUMN IF NOT EXISTS children_ages text,
  ADD COLUMN IF NOT EXISTS parenting_stage text,
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS biggest_challenge text,
  ADD COLUMN IF NOT EXISTS notes text;

COMMIT;
