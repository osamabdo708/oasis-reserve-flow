-- Remove the base price column from services table as pricing is now handled through duration_options
ALTER TABLE public.services DROP COLUMN IF EXISTS price;