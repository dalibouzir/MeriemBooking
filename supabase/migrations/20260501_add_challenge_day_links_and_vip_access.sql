-- Add multi-day challenge links and manual VIP access tracking

-- Challenge settings: explicit links for day 1, day 2, paid day 3 flow, and private VIP zoom
ALTER TABLE challenge_settings
  ADD COLUMN IF NOT EXISTS day1_zoom_url TEXT,
  ADD COLUMN IF NOT EXISTS day2_zoom_url TEXT,
  ADD COLUMN IF NOT EXISTS day3_paid_calendly_url TEXT,
  ADD COLUMN IF NOT EXISTS day3_vip_zoom_url TEXT;

-- Backfill: if day1 link is empty, reuse current meeting_url
UPDATE challenge_settings
SET day1_zoom_url = meeting_url
WHERE (day1_zoom_url IS NULL OR btrim(day1_zoom_url) = '')
  AND meeting_url IS NOT NULL
  AND btrim(meeting_url) <> '';

-- Challenge registrations: VIP day-3 manual grant metadata
ALTER TABLE challenge_registrations
  ADD COLUMN IF NOT EXISTS vip_day3_access BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_day3_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vip_day3_granted_by TEXT,
  ADD COLUMN IF NOT EXISTS vip_payment_source TEXT,
  ADD COLUMN IF NOT EXISTS vip_payment_note TEXT;

CREATE INDEX IF NOT EXISTS idx_challenge_registrations_vip_day3_access
  ON challenge_registrations(vip_day3_access);
