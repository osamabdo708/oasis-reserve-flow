import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import massageImg from "@/assets/massage.jpg";
import hammamImg from "@/assets/hammam.jpg";
import skincareImg from "@/assets/skincare.jpg";

interface Service {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  currency: string;
}

interface ServiceSelectorProps {
  selectedService: { id: string; name: string } | null;
  onServiceSelect: (serviceId: string, serviceName: string) => void;
}

export const ServiceSelector = ({ selectedService, onServiceSelect }: ServiceSelectorProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRTL, setIsRTL] = useState<boolean>(false);

  useEffect(() => {
    // Detect RTL direction from the document
    try {
      const dir = document?.documentElement?.getAttribute('dir') || getComputedStyle(document.documentElement).direction;
      if (dir === 'rtl') setIsRTL(true);
    } catch {}
    fetchServices();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getServiceImage = (imageUrl: string, serviceName: string) => {
    // If the image_url starts with http/https, use it directly (uploaded images)
    if (imageUrl?.startsWith('http')) {
      return imageUrl;
    }
    
    // Otherwise, use the imported local images based on service name
    if (serviceName.includes('مساج')) return massageImg;
    if (serviceName.includes('حمام')) return hammamImg;
    if (serviceName.includes('عناية')) return skincareImg;
    
    // Default fallback
    return massageImg;
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">جاري تحميل الخدمات...</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">لا توجد خدمات متاحة</p>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="w-full max-w-5xl mx-auto px-4 md:px-12">
      <Carousel
        opts={{
          align: "start",
          loop: true,
          containScroll: "trimSnaps",
        }}
        className="w-full"
      >
        <CarouselContent className={`${isRTL ? "flex-row-reverse -mr-2 md:-mr-4" : "-ml-2 md:-ml-4"}`}>
          {services.map((service) => (
            <CarouselItem key={service.id} className={`${isRTL ? "pr-2 md:pr-4" : "pl-2 md:pl-4"} basis-full md:basis-1/2 lg:basis-1/3`}>
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedService?.id === service.id
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => onServiceSelect(service.id, service.name)}
              >
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={getServiceImage(service.image_url, service.name)}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => { e.currentTarget.src = getServiceImage('', service.name); }}
                  />
                  {selectedService?.id === service.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="text-lg font-bold mb-2 text-foreground">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:left-0" />
        <CarouselNext className="-right-4 md:right-0" />
      </Carousel>
    </div>
  );
};
