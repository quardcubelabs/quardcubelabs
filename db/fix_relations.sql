-- ==============================================================================
-- QUARDCUBE LABS - DATABASE SCHEMA RELATIONSHIPS & CONSTRAINTS MIGRATION
-- ==============================================================================
-- This script fixes missing foreign key relations, ensures data integrity, 
-- and creates performant indexes across all tables.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PRODUCTS & CATEGORIES RELATION
-- -----------------------------------------------------------------------------
-- First, ensure all existing product categories exist in categories table
INSERT INTO public.categories (name)
SELECT DISTINCT p.category 
FROM public.products p
WHERE p.category IS NOT NULL 
  AND p.category != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.name = p.category
  )
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint linking products.category to categories.name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_category_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_fkey 
      FOREIGN KEY (category) REFERENCES public.categories(name)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 2. ATTENDANCE & ATTENDANCE SESSIONS RELATIONS
-- -----------------------------------------------------------------------------
-- Ensure session_id column exists on attendance table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN session_id uuid;
  END IF;
END $$;

-- Link attendance to profiles and attendance_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_member_id_fkey'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_member_id_fkey 
      FOREIGN KEY (member_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_recorded_by_fkey'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_recorded_by_fkey 
      FOREIGN KEY (recorded_by) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_session_id_fkey'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_session_id_fkey 
      FOREIGN KEY (session_id) REFERENCES public.attendance_sessions(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Link attendance_sessions to profiles and qr_attendance_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_sessions_created_by_fkey'
  ) THEN
    ALTER TABLE public.attendance_sessions
      ADD CONSTRAINT attendance_sessions_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_sessions_qr_session_id_fkey'
  ) THEN
    ALTER TABLE public.attendance_sessions
      ADD CONSTRAINT attendance_sessions_qr_session_id_fkey 
      FOREIGN KEY (qr_session_id) REFERENCES public.qr_attendance_sessions(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'qr_attendance_sessions_created_by_fkey'
  ) THEN
    ALTER TABLE public.qr_attendance_sessions
      ADD CONSTRAINT qr_attendance_sessions_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 3. RECRUITMENT: POSITIONS & APPLICATIONS
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'applications_position_id_fkey'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_position_id_fkey 
      FOREIGN KEY (position_id) REFERENCES public.positions(id)
      ON DELETE CASCADE;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 4. PERFORMANCE & FOREIGN KEY INDEXES
-- -----------------------------------------------------------------------------
-- Products & Orders
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(date);

-- Applications & Positions
CREATE INDEX IF NOT EXISTS idx_applications_position_id ON public.applications(position_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_positions_status ON public.positions(status);

-- Slugs (for fast routing lookup)
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);

COMMIT;
