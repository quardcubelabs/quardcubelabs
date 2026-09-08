-- ==============================================================================
-- MIGRATION 0011: ENABLE ROW LEVEL SECURITY (RLS) FOR ALL PUBLIC TABLES
-- ==============================================================================

BEGIN;

-- 1. DYNAMICALLY ENABLE RLS FOR EVERY TABLE IN THE PUBLIC SCHEMA
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
        RAISE NOTICE 'Enabled RLS on table: public.%', r.tablename;
    END LOOP;
END $$;

-- 2. HELPER FUNCTION: public.is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Check user_metadata / app_metadata in auth token
  IF (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
     (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
     (auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true') THEN
    RETURN true;
  END IF;

  -- Check profile role in public.profiles table
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Check known admin email identifiers
  IF (auth.jwt() ->> 'email') ILIKE '%framan%' OR
     (auth.jwt() ->> 'email') ILIKE '%quardcube%' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. PROFILES POLICIES
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);

    CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id OR public.is_admin());

    CREATE POLICY "Admins have full access to profiles" ON public.profiles
      FOR ALL TO authenticated USING (public.is_admin());
  END IF;
END $$;

-- 4. PRODUCTS & CATEGORIES POLICIES
DO $$ BEGIN
  -- Products
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
    DROP POLICY IF EXISTS "Allow anonymous read access to products" ON public.products;
    DROP POLICY IF EXISTS "Allow authenticated read access to products" ON public.products;
    DROP POLICY IF EXISTS "Allow admin full access to products" ON public.products;

    CREATE POLICY "Allow public read access to products" ON public.products
      FOR SELECT USING (true);

    CREATE POLICY "Allow admin full access to products" ON public.products
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Categories
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
    DROP POLICY IF EXISTS "Allow anonymous read access to categories" ON public.categories;
    DROP POLICY IF EXISTS "Allow authenticated read access to categories" ON public.categories;
    DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.categories;

    CREATE POLICY "Allow public read access to categories" ON public.categories
      FOR SELECT USING (true);

    CREATE POLICY "Allow admin full access to categories" ON public.categories
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 5. SERVICES, PROJECTS, POSITIONS, BLOGS POLICIES
DO $$ BEGIN
  -- Services
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
    ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to services" ON public.services;
    DROP POLICY IF EXISTS "Allow admin full access to services" ON public.services;

    CREATE POLICY "Allow public read access to services" ON public.services
      FOR SELECT USING (true);

    CREATE POLICY "Allow admin full access to services" ON public.services
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Projects
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
    DROP POLICY IF EXISTS "Allow admin full access to projects" ON public.projects;

    CREATE POLICY "Allow public read access to projects" ON public.projects
      FOR SELECT USING (true);

    CREATE POLICY "Allow admin full access to projects" ON public.projects
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Positions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'positions') THEN
    ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to positions" ON public.positions;
    DROP POLICY IF EXISTS "Allow admin full access to positions" ON public.positions;

    CREATE POLICY "Allow public read access to positions" ON public.positions
      FOR SELECT USING (true);

    CREATE POLICY "Allow admin full access to positions" ON public.positions
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Blogs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blogs') THEN
    ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to published blogs" ON public.blogs;
    DROP POLICY IF EXISTS "Allow admin full access to blogs" ON public.blogs;

    CREATE POLICY "Allow public read access to published blogs" ON public.blogs
      FOR SELECT USING (status = 'published' OR public.is_admin());

    CREATE POLICY "Allow admin full access to blogs" ON public.blogs
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 6. APPLICATIONS POLICIES
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') THEN
    ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow anyone to submit an application" ON public.applications;
    DROP POLICY IF EXISTS "Allow admins to view and manage applications" ON public.applications;

    CREATE POLICY "Allow anyone to submit an application" ON public.applications
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "Allow admins to view and manage applications" ON public.applications
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 7. ORDERS, INVOICES, QUOTATIONS POLICIES
DO $$ BEGIN
  -- Orders
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
    DROP POLICY IF EXISTS "Allow guest and user order creation" ON public.orders;

    CREATE POLICY "Users can view their own orders" ON public.orders
      FOR SELECT USING (
        (auth.uid() IS NOT NULL AND (auth.uid()::text = user_id::text)) 
        OR public.is_admin()
      );

    CREATE POLICY "Allow guest and user order creation" ON public.orders
      FOR INSERT WITH CHECK (
        auth.uid() IS NULL 
        OR auth.uid()::text = user_id::text 
        OR public.is_admin()
      );

    CREATE POLICY "Users can update their own orders" ON public.orders
      FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text) 
        OR public.is_admin()
      );

    CREATE POLICY "Admins can manage all orders" ON public.orders
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Invoices
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
    DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;

    CREATE POLICY "Users can view their own invoices" ON public.invoices
      FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text) 
        OR public.is_admin()
      );

    CREATE POLICY "Admins can manage all invoices" ON public.invoices
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Quotations
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quotations') THEN
    ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
    DROP POLICY IF EXISTS "Admins can manage all quotations" ON public.quotations;

    CREATE POLICY "Users can view their own quotations" ON public.quotations
      FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text) 
        OR public.is_admin()
      );

    CREATE POLICY "Admins can manage all quotations" ON public.quotations
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 8. SYSTEM SETTINGS, REPORTS, TRANSACTIONS POLICIES
DO $$ BEGIN
  -- System Settings
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_settings') THEN
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to system settings" ON public.system_settings;
    DROP POLICY IF EXISTS "Allow admins to manage system settings" ON public.system_settings;

    CREATE POLICY "Allow public read access to system settings" ON public.system_settings
      FOR SELECT USING (true);

    CREATE POLICY "Allow admins to manage system settings" ON public.system_settings
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Reports
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins can manage all reports" ON public.reports;

    CREATE POLICY "Admins can manage all reports" ON public.reports
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Transactions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;

    CREATE POLICY "Admins can manage all transactions" ON public.transactions
      FOR ALL TO authenticated USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 9. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

COMMIT;
