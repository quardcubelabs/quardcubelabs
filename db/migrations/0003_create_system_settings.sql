-- Table for storing all system settings as a single JSONB row
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings row if not exists
INSERT INTO system_settings (id, settings)
VALUES ('main', '{}')
ON CONFLICT (id) DO NOTHING;
