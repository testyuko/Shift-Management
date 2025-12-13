-- Drop the old constraint that only allows 'day', 'evening', 'night'
ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS valid_shift_type;

-- Add new constraint that allows 'work' and 'off'
ALTER TABLE public.shifts ADD CONSTRAINT valid_shift_type 
CHECK (type IN ('work', 'off'));

-- Update default value to 'work'
ALTER TABLE public.shifts ALTER COLUMN type SET DEFAULT 'work';