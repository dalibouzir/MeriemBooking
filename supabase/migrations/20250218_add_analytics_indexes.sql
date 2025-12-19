-- Add indexes to keep analytics queries fast and enrich download_requests with tracking context
BEGIN;

ALTER TABLE download_requests
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS click_id text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS idx_download_requests_created_at ON download_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_requests_product_slug ON download_requests (product_slug);
CREATE INDEX IF NOT EXISTS idx_download_requests_email ON download_requests (email);
CREATE INDEX IF NOT EXISTS idx_download_requests_country ON download_requests (country);
CREATE INDEX IF NOT EXISTS idx_download_requests_source ON download_requests (source);
CREATE INDEX IF NOT EXISTS idx_download_requests_click_id ON download_requests (click_id);

CREATE INDEX IF NOT EXISTS idx_download_clicks_created_at ON download_clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_clicks_product_slug ON download_clicks (product_slug);
CREATE INDEX IF NOT EXISTS idx_download_clicks_source ON download_clicks (source);
CREATE INDEX IF NOT EXISTS idx_download_clicks_referrer ON download_clicks (referrer);
CREATE INDEX IF NOT EXISTS idx_download_clicks_click_id ON download_clicks (click_id);

COMMIT;
