-- Add RLS policies for managing services (INSERT, UPDATE, DELETE)

-- Allow anyone to insert services (admin panel functionality)
CREATE POLICY "Allow service creation"
ON public.services
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update services (admin panel functionality)
CREATE POLICY "Allow service updates"
ON public.services
FOR UPDATE
USING (true);

-- Allow anyone to delete services (admin panel functionality)
CREATE POLICY "Allow service deletion"
ON public.services
FOR DELETE
USING (true);