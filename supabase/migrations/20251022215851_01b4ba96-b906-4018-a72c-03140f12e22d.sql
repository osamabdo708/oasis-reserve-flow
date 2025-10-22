-- Fix RLS policies for verification_codes table
-- Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read verification codes" ON verification_codes;

-- Remove overly permissive INSERT policy  
DROP POLICY IF EXISTS "Anyone can create verification codes" ON verification_codes;

-- Add attempts column for rate limiting
ALTER TABLE verification_codes 
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

-- Verification should be entirely server-side
-- No client access needed - edge functions use service role key