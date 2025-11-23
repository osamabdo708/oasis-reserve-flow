-- Add duration field to shipping_methods table
ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1-2 أيام عمل';