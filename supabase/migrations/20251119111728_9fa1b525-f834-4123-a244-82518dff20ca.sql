-- Add duration and price columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN booking_duration text NOT NULL DEFAULT '1 hr',
ADD COLUMN price numeric NOT NULL DEFAULT 150;