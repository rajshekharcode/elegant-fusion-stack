-- Add email column to blood_requests table
ALTER TABLE public.blood_requests 
ADD COLUMN IF NOT EXISTS email text;

-- Add a comment to the column
COMMENT ON COLUMN public.blood_requests.email IS 'Contact person email address for notifications';