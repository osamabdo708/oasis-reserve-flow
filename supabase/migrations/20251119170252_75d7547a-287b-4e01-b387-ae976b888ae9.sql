-- Create shipping_methods table
CREATE TABLE public.shipping_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping methods
CREATE POLICY "Anyone can view active shipping methods" 
ON public.shipping_methods 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Allow shipping method management" 
ON public.shipping_methods 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add address and shipping_method_id to orders table
ALTER TABLE public.orders 
ADD COLUMN address TEXT,
ADD COLUMN shipping_method_id UUID REFERENCES public.shipping_methods(id),
ADD COLUMN shipping_fee NUMERIC DEFAULT 0;

-- Create trigger for automatic timestamp updates on shipping_methods
CREATE TRIGGER update_shipping_methods_updated_at
BEFORE UPDATE ON public.shipping_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_services_updated_at();