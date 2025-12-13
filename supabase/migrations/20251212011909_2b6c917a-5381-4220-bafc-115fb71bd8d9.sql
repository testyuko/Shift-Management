-- Ensure RLS is enabled on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on employees to start fresh
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can read own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employees" ON public.employees;
DROP POLICY IF EXISTS "public_read_employees" ON public.employees;

-- Drop all existing policies on shifts
DROP POLICY IF EXISTS "Allow all authenticated users to update shifts" ON public.shifts;
DROP POLICY IF EXISTS "Authenticated users can delete shifts" ON public.shifts;
DROP POLICY IF EXISTS "Authenticated users can insert shifts" ON public.shifts;
DROP POLICY IF EXISTS "Authenticated users can update shifts" ON public.shifts;
DROP POLICY IF EXISTS "Authenticated users can view shifts" ON public.shifts;

-- Drop all existing policies on notes
DROP POLICY IF EXISTS "Authenticated users can delete notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can insert notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can update notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can view notes" ON public.notes;

-- Create simple policies that allow all authenticated users to manage all data
-- This allows all staff to see and edit the same data

-- Employees policies - all authenticated users can CRUD all employees
CREATE POLICY "authenticated_select_employees" ON public.employees
FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_employees" ON public.employees
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_employees" ON public.employees
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_employees" ON public.employees
FOR DELETE TO authenticated USING (true);

-- Shifts policies - all authenticated users can CRUD all shifts
CREATE POLICY "authenticated_select_shifts" ON public.shifts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_shifts" ON public.shifts
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_shifts" ON public.shifts
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_shifts" ON public.shifts
FOR DELETE TO authenticated USING (true);

-- Notes policies - all authenticated users can CRUD all notes
CREATE POLICY "authenticated_select_notes" ON public.notes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_notes" ON public.notes
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_notes" ON public.notes
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_notes" ON public.notes
FOR DELETE TO authenticated USING (true);