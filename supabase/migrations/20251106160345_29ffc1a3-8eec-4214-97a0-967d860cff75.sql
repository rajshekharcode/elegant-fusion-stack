-- Drop the public access policy on blood_requests table
DROP POLICY IF EXISTS "Anyone can view blood requests" ON blood_requests;

-- Create a new policy that requires authentication to view blood requests
CREATE POLICY "Authenticated users can view blood requests"
ON blood_requests
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');