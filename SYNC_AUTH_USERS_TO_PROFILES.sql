-- Backfill missing profiles from auth.users and create auto-insert trigger
-- Run in Supabase SQL editor

-- 1) Backfill existing users not present in public.profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) AS full_name,
  NULLIF(u.raw_user_meta_data->>'avatar_url', '') AS avatar_url,
  (
    CASE 
      WHEN u.raw_user_meta_data ? 'role' AND (u.raw_user_meta_data->>'role') IN (
        SELECT enumlabel FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
      ) THEN (u.raw_user_meta_data->>'role')::user_role
      ELSE 'lettore'::user_role
    END
  ) AS role,
  NOW() AS created_at,
  NOW() AS updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2) Create function to auto insert into public.profiles when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'lettore';
  v_full_name text := NULL;
  v_avatar text := NULL;
BEGIN
  -- Extract optional metadata safely
  BEGIN
    IF NEW.raw_user_meta_data ? 'role' AND (NEW.raw_user_meta_data->>'role') IN (
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    ELSE
      v_role := 'lettore';
    END IF;
  EXCEPTION WHEN others THEN
    v_role := 'lettore';
  END;

  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_avatar := NULLIF(NEW.raw_user_meta_data->>'avatar_url', '');

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_full_name, v_avatar, v_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Create trigger on auth.users for inserts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Optional: keep email/metadata updates in sync
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
