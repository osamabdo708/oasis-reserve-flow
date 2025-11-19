import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import heroImage from "@/assets/hero-spa.jpg";
import { Calendar, Clock, MapPin, Phone, Menu, Home, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const HomeMobile = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const getServiceImage = (imageUrl: string, serviceName: string) => {
    if (imageUrl?.startsWith('http')) return imageUrl;
    if (serviceName.includes('مساج')) return massageImg;
    if (serviceName.includes('حمام')) return hammamImg;
    if (serviceName.includes('عناية')) return skincareImg;
    return massageImg;
  };

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

  return (
    <div className="min-h-screen pb-16">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold text-foreground">منتجع السكينة</h1>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/homemobile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">الرئيسية</span>
                </Link>
                <Link to="/booking" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">احجز الآن</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-14">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">
            ريا كلينيك
          </h2>
          <p className="text-base mb-6 text-white/95 leading-relaxed drop-shadow px-4">
            رحلة من الاسترخاء والجمال في أجواء هادئة ومريحة
          </p>
          <Link to="/booking">
            <Button variant="spa" size="lg" className="shadow-xl">
              احجز الآن
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Section - Mobile Optimized */}
      <section className="py-12 bg-gradient-to-b from-background to-secondary/30">
        <div className="container px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              خدماتنا المميزة
            </h2>
            <p className="text-sm text-muted-foreground px-4">
              نقدم لك تجربة فريدة من الاسترخاء والعناية بأعلى معايير الجودة
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground">جاري التحميل...</p>
            ) : services.length === 0 ? (
              <p className="text-center text-muted-foreground">لا توجد خدمات متاحة</p>
            ) : (
              services.map((service) => (
                <ServiceCard
                  key={service.id}
                  title={service.name}
                  description={service.description || ""}
                  image={getServiceImage(service.image_url, service.name)}
                  price="احجز الآن"
                />
              ))
            )}
          </div>

          <div className="text-center mt-8">
            <Link to="/booking">
              <Button variant="default" size="lg" className="w-full max-w-xs">
                احجز خدمتك المفضلة
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section className="py-12 bg-card">
        <div className="container px-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">حجز سهل</h3>
              <p className="text-xs text-muted-foreground">احجز موعدك بسهولة</p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">مواعيد مرنة</h3>
              <p className="text-xs text-muted-foreground">مواعيد تناسب جدولك</p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">موقع مميز</h3>
              <p className="text-xs text-muted-foreground">سهولة الوصول</p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">دعم متواصل</h3>
              <p className="text-xs text-muted-foreground">نحن هنا لمساعدتك</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-8">
        <div className="container px-4 text-center">
          <h3 className="text-lg font-bold mb-2 text-foreground">ريا كلينيك</h3>
          <p className="text-xs text-muted-foreground mb-4">
            وجهتك المثالية للاسترخاء والعناية بالنفس
          </p>
          <p className="text-xs text-muted-foreground">
            جميع الحقوق محفوظة © 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomeMobile;
