-- ==============================================================================
-- QUARDCUBE LABS REPORT MANAGEMENT & GENERATION SYSTEM
-- Database Migration Script
-- ==============================================================================

-- 1. Report Templates Table
CREATE TABLE IF NOT EXISTS public.report_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'sales',
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_type ON public.report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_at ON public.report_templates(created_at DESC);

-- 2. Generated Reports Table
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'sales',
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_url TEXT,
  file_format TEXT NOT NULL DEFAULT 'pdf',
  file_size TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  summary_metrics JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON public.generated_reports(type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON public.generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON public.generated_reports(created_at DESC);

-- 3. Report Generation Jobs Table (For asynchronous tracking)
CREATE TABLE IF NOT EXISTS public.report_jobs (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_jobs_status ON public.report_jobs(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins full access
CREATE POLICY "Admins full access on report_templates" ON public.report_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on generated_reports" ON public.generated_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins full access on report_jobs" ON public.report_jobs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow service role access
CREATE POLICY "Service role access on report_templates" ON public.report_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on generated_reports" ON public.generated_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access on report_jobs" ON public.report_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
