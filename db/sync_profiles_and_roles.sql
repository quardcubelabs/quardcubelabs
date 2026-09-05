-- ==============================================================================
-- QUARDCUBE LABS - PROFILES & USERS ROLE SYNCHRONIZATION MIGRATION
-- ==============================================================================
-- 1. Adds 'role' column to public.profiles table
-- 2. Syncs existing Supabase auth.users into public.profiles
-- 3. Creates automated triggers to keep profiles in sync with auth.users
-- ==============================================================================

BEGIN;

-- 1. Add 'role' column to public.profiles if it doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN role text NOT NULL DEFAULT 'customer' 
      CHECK (role IN ('admin', 'staff', 'customer'));
  END IF;
END $$;

-- 2. Sync existing auth.users into public.profiles table
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    CONCAT(u.raw_user_meta_data->>'firstName', ' ', u.raw_user_meta_data->>'lastName'),
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) AS full_name,
  COALESCE(
    u.raw_app_meta_data->>'role',
    u.raw_user_meta_data->>'role',
    CASE 
      WHEN u.email ILIKE '%framan%' OR u.email ILIKE '%quardcube%' THEN 'admin'
      ELSE 'customer'
    END
  ) AS role,
  u.created_at,
  COALESCE(u.updated_at, u.created_at)
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = CASE 
    WHEN public.profiles.role = 'admin' THEN 'admin'
    ELSE EXCLUDED.role 
  END,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  updated_at = now();

-- 3. Function and trigger to automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(NEW.raw_user_meta_data->>'firstName', ' ', NEW.raw_user_meta_data->>'lastName'),
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_app_meta_data->>'role',
      NEW.raw_user_meta_data->>'role',
      'customer'
    ),
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Function and trigger to sync profile on user metadata/email updates
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = COALESCE(NEW.email, public.profiles.email),
    full_name = COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(NEW.raw_user_meta_data->>'firstName', ' ', NEW.raw_user_meta_data->>'lastName'),
      NEW.raw_user_meta_data->>'name',
      public.profiles.full_name
    ),
    role = COALESCE(
      NEW.raw_app_meta_data->>'role',
      NEW.raw_user_meta_data->>'role',
      public.profiles.role
    ),
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

COMMIT;
