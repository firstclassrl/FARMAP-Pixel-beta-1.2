/*
  # Create user profile trigger

  1. Functions
    - `handle_new_user()` - Creates a profile when a new user signs up
    - `set_first_user_as_admin()` - Sets the first user as admin

  2. Triggers
    - Automatically create profile on user signup
    - Set first user as admin

  3. Security
    - Profiles are linked to auth.users
    - RLS policies ensure users can only access their own data
*/

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'lettore'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set first user as admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM public.profiles) = 0 THEN
    NEW.role = 'admin'::user_role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update the existing trigger to use the correct function name
DROP TRIGGER IF EXISTS set_first_user_admin_trigger ON public.profiles;
CREATE TRIGGER set_first_user_admin_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_first_user_as_admin();