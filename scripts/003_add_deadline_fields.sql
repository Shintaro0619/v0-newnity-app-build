-- Add optional fields for future deadline expansion
-- These fields prepare for future features like time + timezone input
-- For MVP, we only use end_date (normalized to UTC 23:59:59)

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS deadline_input_type VARCHAR(20) DEFAULT 'date_only',
ADD COLUMN IF NOT EXISTS deadline_input_tz VARCHAR(50);

COMMENT ON COLUMN campaigns.deadline_input_type IS 'Type of deadline input: date_only (MVP), datetime_utc, datetime_tz (future)';
COMMENT ON COLUMN campaigns.deadline_input_tz IS 'Timezone for deadline input (future use)';

-- Add index for deadline queries
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_end_date ON campaigns(status, end_date);
