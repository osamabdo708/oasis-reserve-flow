-- Allow anyone to view bookings for checking availability
CREATE POLICY "Anyone can view bookings for availability"
ON public.bookings
FOR SELECT
TO public
USING (true);