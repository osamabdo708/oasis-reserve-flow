import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/BookingForm";
import { ArrowRight } from "lucide-react";

const Booking = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="container mx-auto px-4 py-6">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-12 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            احجز موعدك
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            املأ النموذج أدناه وسنتواصل معك لتأكيد الحجز
          </p>
        </div>

        <BookingForm />
      </main>
    </div>
  );
};

export default Booking;
