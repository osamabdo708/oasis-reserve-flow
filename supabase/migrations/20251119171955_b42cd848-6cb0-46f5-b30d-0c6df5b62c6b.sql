-- Allow admins to delete bookings
CREATE POLICY "Allow booking deletion" 
ON public.bookings 
FOR DELETE 
USING (true);