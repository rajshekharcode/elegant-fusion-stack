-- Add government_id column to donors table
ALTER TABLE public.donors 
ADD COLUMN government_id TEXT;

-- Add a comment to the column
COMMENT ON COLUMN public.donors.government_id IS 'Government-issued ID number (Aadhaar, Passport, etc)';