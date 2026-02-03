-- Fix nullable user_id in donors table (make it NOT NULL)
ALTER TABLE donors 
ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint for one donor profile per user (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'donors_user_id_unique'
  ) THEN
    ALTER TABLE donors ADD CONSTRAINT donors_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Fix the update_updated_at_column function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;