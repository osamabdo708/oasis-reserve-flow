-- Fix security warning: set search_path for security definer function
ALTER FUNCTION public.cleanup_expired_verification_codes() SET search_path = public, pg_temp;