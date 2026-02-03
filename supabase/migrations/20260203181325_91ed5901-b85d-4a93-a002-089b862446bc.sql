-- Fix overly permissive blood_requests INSERT policy
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Anyone can create blood requests" ON blood_requests;

-- Create a more restrictive policy that requires authentication
CREATE POLICY "Authenticated users can create blood requests"
ON blood_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix overly permissive UPDATE policy - only admins can update (not any authenticated user)
DROP POLICY IF EXISTS "Authenticated users can update blood requests" ON blood_requests;

-- Admins can manage all already covers UPDATE, so no need for separate policy