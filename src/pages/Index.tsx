import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { ProductCard } from "@/components/ProductCard";
import heroImage from "@/assets/hero-spa.jpg";
import { Calendar, Clock, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import massageImg from "@/assets/massage.jpg";
import hammamImg from "@/assets/hammam.jpg";
import skincareImg from "@/assets/skincare.jpg";
import doctorReiaImg from "@/assets/doctor-reia.jpg";
import { LatestReviews } from "@/components/LatestReviews";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

interface Service {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  currency: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
}

const Index = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const getServiceImage = (imageUrl: string, serviceName: string) => {
    if (imageUrl?.startsWith('http')) return imageUrl;
    if (serviceName.includes('مساج')) return massageImg;
    if (serviceName.includes('حمام')) return hammamImg;
    if (serviceName.includes('عناية')) return skincareImg;
    return massageImg;
  };


  useEffect(() => {
    fetchServices();
    fetchProducts();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(3);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background"></div>
        </div>
        
<div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
  <img
    src="https://i.ibb.co/XZxPCbJq/Picsart-25-11-18-11-07-15-991-removebg-preview-1.png"
    alt="ريا كلينيك"
    className="mx-auto mb-6 w-60 md:w-80 drop-shadow-lg"
  />

  <p className="text-xl md:text-2xl mb-8 text-white/95 leading-relaxed drop-shadow">
    استرخِ، تعافَ، واستعد نشاطك وحيويتك
  </p>

  <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center items-center">
    <Link to="/booking">
      <Button
        variant="outline"
        size="lg"
        className="shadow-2xl text-lg px-12 py-6 h-auto border-2 border-white text-white hover:bg-white hover:text-primary"
        style={{ background: "#0000006e", border: "unset" }}
      >
        احجز الآن
      </Button>
    </Link>

    <Link to="/shop">
      <Button
        variant="outline"
        size="lg"
        className="shadow-2xl text-lg px-12 py-6 h-auto border-2 border-white text-white hover:bg-white hover:text-primary"
        style={{ background: "#0000006e", border: "unset" }}
      >
        المتجر
      </Button>
    </Link>

    <Link to="/booking-track">
      <Button
        variant="outline"
        size="lg"
        className="shadow-2xl text-lg px-12 py-6 h-auto border-2 border-white text-white hover:bg-white hover:text-primary"
        style={{ background: "#0000006e", border: "unset" }}
      >
        تتبع حجزك
      </Button>
    </Link>
  </div>
</div>

      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              خدماتنا المميزة
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نقدم لك تجربة فريدة من الاسترخاء والعناية بأعلى معايير الجودة
            </p>
          </div>

          {isMobile ? (
            <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-6xl mx-auto">
              <CarouselContent className="-ml-2">
                {isLoading ? (
                  <CarouselItem className="pl-2 basis-1/2">
                    <p className="text-center text-muted-foreground">جاري التحميل...</p>
                  </CarouselItem>
                ) : services.length === 0 ? (
                  <CarouselItem className="pl-2 basis-1/2">
                    <p className="text-center text-muted-foreground">لا توجد خدمات متاحة</p>
                  </CarouselItem>
                ) : (
                  services.map((service) => (
                    <CarouselItem key={service.id} className="pl-2 basis-1/2">
                      <ServiceCard
                        title={service.name}
                        description={service.description || ""}
                        image={getServiceImage(service.image_url, service.name)}
                        price="احجز الآن"
                      />
                    </CarouselItem>
                  ))
                )}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 max-w-6xl mx-auto">
              {isLoading ? (
                <p className="col-span-full text-center text-muted-foreground">جاري التحميل...</p>
              ) : services.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">لا توجد خدمات متاحة</p>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="md:block">
                    <ServiceCard
                      title={service.name}
                      description={service.description || ""}
                      image={getServiceImage(service.image_url, service.name)}
                      price="احجز الآن"
                    />
                  </div>
                ))
              )}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/booking">
              <Button variant="default" size="lg">
                احجز خدمتك المفضلة
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Reviews Section */}
      <LatestReviews />

      {/* Products Section */}
      <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              منتجاتنا المميزة
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              منتجات طبيعية عالية الجودة للعناية بالبشرة والجسم
            </p>
          </div>

          {isMobile ? (
            <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-6xl mx-auto">
              <CarouselContent className="-ml-2">
                {products.length === 0 ? (
                  <CarouselItem className="pl-2 basis-1/2">
                    <p className="text-center text-muted-foreground">لا توجد منتجات متاحة</p>
                  </CarouselItem>
                ) : (
                  products.map((product) => (
                    <CarouselItem key={product.id} className="pl-2 basis-1/2">
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        description={product.description}
                        image={product.image_url}
                        price={product.price}
                      />
                    </CarouselItem>
                  ))
                )}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 max-w-6xl mx-auto">
              {products.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">لا توجد منتجات متاحة</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="md:block">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      description={product.description}
                      image={product.image_url}
                      price={product.price}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/shop">
              <Button variant="default" size="lg">
                تصفح جميع المنتجات
              </Button>
            </Link>
          </div>
        </div>
      </section>

            {/* About Dr. Reia Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  الدكتورة ريا
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  تتمتع الدكتورة ريا بخبرة تزيد عن 15 عاماً في مجال العناية بالبشرة والعلاج الطبيعي. حاصلة على شهادات متخصصة في الطب التجميلي والعلاج بالتدليك من أفضل المعاهد العالمية.
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  تؤمن الدكتورة ريا بأن الجمال الحقيقي يبدأ من الداخل، وتسعى دائماً لتقديم أفضل الخدمات العلاجية والتجميلية بأساليب طبيعية وآمنة، مع التركيز على راحة ورفاهية كل عميل.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <p className="text-muted-foreground">دكتوراه في الطب التجميلي</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <p className="text-muted-foreground">خبيرة معتمدة في العلاج بالتدليك</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <p className="text-muted-foreground">عضو في الجمعية الدولية للعناية بالبشرة</p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-2xl"></div>
                  <img
                    src={doctorReiaImg}
                    alt="الدكتورة ريا"
                    className="relative w-full h-auto rounded-2xl shadow-2xl object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
            <div className="text-center p-3 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">حجز سهل</h3>
              <p className="text-xs md:text-base text-muted-foreground">احجز موعدك بكل سهولة عبر موقعنا</p>
            </div>

            <div className="text-center p-3 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">مواعيد مرنة</h3>
              <p className="text-xs md:text-base text-muted-foreground">نوفر مواعيد تناسب جدولك اليومي</p>
            </div>

            <div className="text-center p-3 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">موقع مميز</h3>
              <p className="text-xs md:text-base text-muted-foreground">في قلب المدينة مع سهولة الوصول</p>
            </div>

            <div className="text-center p-3 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">دعم متواصل</h3>
              <p className="text-xs md:text-base text-muted-foreground">نحن هنا للإجابة على استفساراتك</p>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-secondary/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="text-center lg:text-right">
              <h3 className="text-2xl font-bold mb-4 text-foreground">ريا كلينيك</h3>
              <p className="text-muted-foreground mb-4">
                مركز العناية والاسترخاء الأول في المنطقة
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground mb-4">
                <MapPin className="w-5 h-5" />
                <span> رام الله - عمارة شطارة - مقابل عمارة الانجلو - الطابق الرابع</span>
              </div>
              <p className="text-sm text-muted-foreground">
                جميع الحقوق محفوظة © 2025
              </p>
            </div>
            
           <div className="rounded-lg overflow-hidden shadow-lg h-64">
  <iframe
    src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAHqQMQh7eDCe7VCZJwHUbg--tpDQSFrwc
      &q=Angelos+Restaurant,Ramallah,West+Bank
      &center=31.9043388,35.2003899
      &zoom=17"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    allowFullScreen
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    title="موقع Angelos Restaurant"
/>
</div>

          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
