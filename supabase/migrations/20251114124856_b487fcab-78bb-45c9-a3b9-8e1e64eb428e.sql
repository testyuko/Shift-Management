-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'day',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_shift_type CHECK (type IN ('day', 'evening', 'night'))
);

-- Create notes table for calendar notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_shifts_employee_id ON public.shifts(employee_id);
CREATE INDEX idx_shifts_date ON public.shifts(date);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no authentication required for now)
-- This allows the app to work immediately without authentication

-- Employees policies
CREATE POLICY "Anyone can view employees" 
  ON public.employees FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert employees" 
  ON public.employees FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update employees" 
  ON public.employees FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete employees" 
  ON public.employees FOR DELETE 
  USING (true);

-- Shifts policies
CREATE POLICY "Anyone can view shifts" 
  ON public.shifts FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert shifts" 
  ON public.shifts FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update shifts" 
  ON public.shifts FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete shifts" 
  ON public.shifts FOR DELETE 
  USING (true);

-- Notes policies
CREATE POLICY "Anyone can view notes" 
  ON public.notes FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert notes" 
  ON public.notes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update notes" 
  ON public.notes FOR UPDATE 
  USING (true);

-- Insert a single notes record for the calendar
INSERT INTO public.notes (content) VALUES ('');