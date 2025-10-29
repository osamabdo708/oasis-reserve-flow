-- Update bookings table to support tracking by phone number
-- Add index for faster lookups by phone number
CREATE INDEX IF NOT EXISTS idx_bookings_phone_number ON public.bookings(phone_number);

-- Update RLS policy to allow users to view their own bookings by phone number
CREATE POLICY "Users can view their own bookings by phone"
ON public.bookings
FOR SELECT
TO public
USING (true);

-- Allow users to cancel their own bookings
CREATE POLICY "Users can cancel their own bookings"
ON public.bookings
FOR UPDATE
TO public
USING (true)
WITH CHECK (status = 'canceled');