import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  currency: string;
}

interface ServiceSelectorProps {
  selectedService?: string;
  onServiceSelect: (serviceId: string, serviceName: string) => void;
}

export const ServiceSelector = ({ selectedService, onServiceSelect }: ServiceSelectorProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

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
      <div className="text-center py-8 text-muted-foreground">
        جاري تحميل الخدمات...
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد خدمات متاحة
      </div>
    );
  }

  return (
    <div className="w-full px-12">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {services.map((service) => {
            const isSelected = selectedService === service.id;
            return (
              <CarouselItem key={service.id} className="md:basis-1/2 lg:basis-1/3">
                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    isSelected ? "ring-2 ring-primary shadow-lg" : ""
                  }`}
                  onClick={() => onServiceSelect(service.id, service.name)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-square overflow-hidden rounded-t-lg">
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="text-lg font-bold mb-2 text-foreground">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <p className="text-accent font-bold text-lg">
                        من {service.price} {service.currency}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};
