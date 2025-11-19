-- Add duration_options column to services table
ALTER TABLE public.services 
ADD COLUMN duration_options jsonb DEFAULT '[
  {"value": "30 mins", "label": "30 دقيقة", "price": 100},
  {"value": "1 hr", "label": "ساعة", "price": 150},
  {"value": "1.5 hr", "label": "ساعة ونصف", "price": 200}
]'::jsonb;