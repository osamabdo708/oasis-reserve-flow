-- Add gender, address, and progress fields to clients table
ALTER TABLE public.clients 
ADD COLUMN gender text,
ADD COLUMN address text,
ADD COLUMN progress jsonb DEFAULT '[]'::jsonb;