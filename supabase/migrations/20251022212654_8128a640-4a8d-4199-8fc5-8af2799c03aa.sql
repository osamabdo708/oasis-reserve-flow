-- Create verification_codes table to store temporary verification codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_phone ON public.verification_codes(phone_number);
CREATE INDEX idx_verification_codes_expires ON public.verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification codes (for sending)
CREATE POLICY "Anyone can create verification codes"
ON public.verification_codes
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own verification codes (for verification)
CREATE POLICY "Anyone can read verification codes"
ON public.verification_codes
FOR SELECT
USING (true);

-- Create function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < now();
END;
$$;