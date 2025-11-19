-- Fix RLS policy for updating bookings to allow assigning client_id
DROP POLICY IF EXISTS "Users can cancel their own bookings" ON public.bookings;

-- Allow anyone to update bookings (for admin functionality)
CREATE POLICY "Allow booking updates"
ON public.bookings
FOR UPDATE
USING (true)
WITH CHECK (true);