import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Check, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  currency: string;
}

interface ServiceSelectorProps {
  selectedService: string | null;
  onServiceSelect: (serviceName: string) => void;
}

export const ServiceSelector = ({ selectedService, onServiceSelect }: ServiceSelectorProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default service images
  const defaultImages = {
    massage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    hammam: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
    skincare: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
    default: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80"
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getServiceImage = (imageUrl: string, serviceName: string) => {
    // If the image_url starts with http/https, use it directly
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    
    // Use default images based on service name
    const lowerName = serviceName.toLowerCase();
    if (lowerName.includes('مساج') || lowerName.includes('massage')) {
      return defaultImages.massage;
    }
    if (lowerName.includes('حمام') || lowerName.includes('hammam')) {
      return defaultImages.hammam;
    }
    if (lowerName.includes('عناية') || lowerName.includes('skin') || lowerName.includes('بشرة')) {
      return defaultImages.skincare;
    }
    
    return defaultImages.default;
  };

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulated data - replace with actual Supabase call
      const mockServices: Service[] = [
        {
          id: "1",
          name: "مساج سويدي",
          description: "مساج كامل للجسم يساعد على الاسترخاء وتخفيف التوتر",
          image_url: "",
          price: 250,
          currency: "شيكل"
        },
        {
          id: "2",
          name: "حمام مغربي",
          description: "حمام تقليدي بالصابون البلدي والليفة المغربية",
          image_url: "",
          price: 200,
          currency: "شيكل"
        },
        {
          id: "3",
          name: "عناية بالبشرة",
          description: "جلسة عناية متكاملة بالوجه والبشرة",
          image_url: "",
          price: 180,
          currency: "شيكل"
        },
        {
          id: "4",
          name: "مساج بالأحجار الساخنة",
          description: "مساج علاجي باستخدام الأحجار البركانية الساخنة",
          image_url: "",
          price: 300,
          currency: "شيكل"
        },
        {
          id: "5",
          name: "باكج الاسترخاء الكامل",
          description: "باكج متكامل يشمل حمام مغربي ومساج وعناية بالبشرة",
          image_url: "",
          price: 500,
          currency: "شيكل"
        }
      ];

      // Uncomment this when using real Supabase:
      /*
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setServices(data || []);
      */

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setServices(mockServices);
      
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("فشل في تحميل الخدمات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceClick = (serviceName: string) => {
    // Toggle selection - if already selected, deselect it
    if (selectedService === serviceName) {
      onServiceSelect("");
    } else {
      onServiceSelect(serviceName);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-muted-foreground">جاري تحميل الخدمات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-destructive font-medium mb-3">{error}</p>
          <button
            onClick={fetchServices}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-muted rounded-lg p-8 max-w-md mx-auto">
          <p className="text-muted-foreground text-lg">لا توجد خدمات متاحة حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">اختر الخدمة</h2>
        <p className="text-muted-foreground">انقر على الخدمة التي تريد حجزها</p>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: services.length > 3,
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {services.map((service) => {
            const isSelected = selectedService === service.name;
            
            return (
              <CarouselItem 
                key={service.id} 
                className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 h-full group ${
                    isSelected
                      ? "ring-2 ring-primary shadow-xl scale-[1.02]"
                      : "hover:shadow-lg hover:scale-[1.01]"
                  }`}
                  onClick={() => handleServiceClick(service.name)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                    <img
                      src={getServiceImage(service.image_url, service.name)}
                      alt={service.name}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        isSelected ? 'scale-105' : 'group-hover:scale-110'
                      }`}
                      onError={(e) => {
                        e.currentTarget.src = defaultImages.default;
                      }}
                      loading="lazy"
                    />
                    
                    {/* Overlay gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
                      isSelected ? 'opacity-70' : 'opacity-0 group-hover:opacity-50'
                    }`} />
                    
                    {/* Selection check mark */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2 shadow-lg animate-in zoom-in-50 duration-200">
                        <Check className="w-5 h-5" />
                      </div>
                    )}

                    {/* Price badge on image */}
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-white/95 text-foreground hover:bg-white text-base font-bold px-3 py-1 shadow-md">
                        {service.price} {service.currency}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <h3 className={`text-xl font-bold mb-2 transition-colors ${
                      isSelected ? 'text-primary' : 'text-foreground'
                    }`}>
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed min-h-[3rem]">
                      {service.description || "خدمة مميزة في المنتجع"}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        {services.length > 1 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-4 hover:scale-110 transition-transform" />
            <CarouselNext className="hidden md:flex -right-4 hover:scale-110 transition-transform" />
          </>
        )}
      </Carousel>

      {/* Selection indicator */}
      {selectedService && (
        <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full border border-primary/20">
            <Check className="w-5 h-5" />
            <span className="font-medium">تم اختيار: {selectedService}</span>
          </div>
        </div>
      )}
    </div>
  );
};
