-- Create reminders table to track WhatsApp reminder messages
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Allow viewing reminders in admin
CREATE POLICY "Allow viewing all reminders"
  ON public.reminders
  FOR SELECT
  USING (true);

-- Allow creating reminders
CREATE POLICY "Allow creating reminders"
  ON public.reminders
  FOR INSERT
  WITH CHECK (true);

-- Allow updating reminders
CREATE POLICY "Allow updating reminders"
  ON public.reminders
  FOR UPDATE
  USING (true);

-- Create index for efficient queries
CREATE INDEX idx_reminders_status ON public.reminders(status);
CREATE INDEX idx_reminders_scheduled_for ON public.reminders(scheduled_for);
CREATE INDEX idx_reminders_booking_id ON public.reminders(booking_id);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;