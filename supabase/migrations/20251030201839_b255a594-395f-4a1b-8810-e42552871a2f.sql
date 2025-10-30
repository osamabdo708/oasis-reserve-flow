-- Create services table
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT '₪',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active services
CREATE POLICY "Anyone can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_services_updated_at();

-- Insert default services
INSERT INTO public.services (name, description, image_url, price, display_order) VALUES
('مساج استرخائي', 'جلسة مساج متكاملة للاسترخاء التام وتخفيف التوتر مع زيوت طبيعية فاخرة', '/src/assets/massage.jpg', 200, 1),
('عناية بالبشرة', 'برامج عناية متخصصة لجميع أنواع البشرة باستخدام منتجات طبيعية عالية الجودة', '/src/assets/skincare.jpg', 150, 2),
('حمام مغربي', 'تجربة تقليدية أصيلة للتنظيف العميق والاسترخاء مع الصابون البلدي المغربي', '/src/assets/hammam.jpg', 180, 3);