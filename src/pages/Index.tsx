import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import heroImage from "@/assets/hero-spa.jpg";
import massageImage from "@/assets/massage.jpg";
import skincareImage from "@/assets/skincare.jpg";
import hammamImage from "@/assets/hammam.jpg";
import { Calendar, Clock, MapPin, Phone } from "lucide-react";

const Index = () => {
  const services = [
    {
      title: "مساج استرخائي",
      description: "جلسة مساج متكاملة للاسترخاء التام وتخفيف التوتر مع زيوت طبيعية فاخرة",
      image: massageImage,
      price: "من 200 ريال",
    },
    {
      title: "عناية بالبشرة",
      description: "برامج عناية متخصصة لجميع أنواع البشرة باستخدام منتجات طبيعية عالية الجودة",
      image: skincareImage,
      price: "من 150 ريال",
    },
    {
      title: "حمام مغربي",
      description: "تجربة تقليدية أصيلة للتنظيف العميق والاسترخاء مع الصابون البلدي المغربي",
      image: hammamImage,
      price: "من 180 ريال",
    },
  ];

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
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg">
            منتجع السكينة الصحي
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/95 leading-relaxed drop-shadow">
            رحلة من الاسترخاء والجمال في أجواء هادئة ومريحة
          </p>
          <Link to="/booking">
            <Button variant="spa" size="lg" className="shadow-2xl text-lg px-12 py-6 h-auto">
              احجز الآن
            </Button>
          </Link>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/booking">
              <Button variant="default" size="lg">
                احجز خدمتك المفضلة
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">حجز سهل</h3>
              <p className="text-muted-foreground">احجز موعدك بكل سهولة عبر موقعنا</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">مواعيد مرنة</h3>
              <p className="text-muted-foreground">نوفر مواعيد تناسب جدولك اليومي</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">موقع مميز</h3>
              <p className="text-muted-foreground">في قلب المدينة مع سهولة الوصول</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">دعم متواصل</h3>
              <p className="text-muted-foreground">نحن هنا للإجابة على استفساراتك</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4 text-foreground">منتجع السكينة الصحي</h3>
          <p className="text-muted-foreground mb-6">
            وجهتك المثالية للاسترخاء والعناية بالنفس
          </p>
          <p className="text-sm text-muted-foreground">
            جميع الحقوق محفوظة © 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
