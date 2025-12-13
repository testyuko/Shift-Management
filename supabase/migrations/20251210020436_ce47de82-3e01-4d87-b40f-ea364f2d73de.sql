-- Drop the broken trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the broken function
DROP FUNCTION IF EXISTS public.create_employee_for_new_user();

-- No automatic employee creation on signup - employees should be managed manually by authenticated users