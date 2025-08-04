-- Reports table for admin dashboard
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  formats TEXT[],
  lastGenerated TIMESTAMP,
  status TEXT,
  size TEXT,
  downloads INTEGER DEFAULT 0
);
