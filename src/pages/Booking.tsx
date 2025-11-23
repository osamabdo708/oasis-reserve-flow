import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/BookingForm";
import { ServiceSelector } from "@/components/ServiceSelector";
import { ArrowRight } from "lucide-react";

const Booking = () => {
  const [selectedService, setSelectedService] = useState<{ id: string; name: string } | null>(null);


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
           <h1 className="text-2xl md:text-3xl font-bold text-foreground">احجز موعدك</h1>
           </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-12 max-w-6xl">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8">
            اختر الخدمة المناسبة لك ثم املأ النموذج
          </p>
        </div>

        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">اختر الخدمة</h2>
          <ServiceSelector
            selectedService={selectedService}
            onServiceSelect={(serviceId, serviceName) => setSelectedService({ id: serviceId, name: serviceName })}
          />
        </div>

        {selectedService && (
          <div className="mt-8 md:mt-12">
            <BookingForm 
              key={selectedService.id}
              preSelectedService={selectedService.id} 
              preSelectedServiceName={selectedService.name} 
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Booking;
