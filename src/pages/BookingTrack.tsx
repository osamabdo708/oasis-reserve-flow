import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Clock, Phone, User, FileText, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RatingForm } from "@/components/RatingForm";

interface Booking {
  id: string;
  service: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  phone_number: string;
  notes: string | null;
  status: string;
  created_at: string;
}

const BookingTrack = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (bookings.length > 0) {
      checkReviewedBookings();
    }
  }, [bookings]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const checkReviewedBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookings.map(b => b.id));

      if (error) throw error;

      const reviewedIds = new Set(data?.map(r => r.booking_id) || []);
      setReviewedBookings(reviewedIds);
    } catch (error) {
      console.error("Error checking reviews:", error);
    }
  };

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || serviceId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">قيد الانتظار</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مؤكد</Badge>;
      case "canceled":
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    if (phoneNumber.replace(/\D/g, '').length < 9) {
      toast({
        title: "خطأ",
        description: "رقم الهاتف يجب أن يكون 9 أرقام على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSearched(true);
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .like('phone_number', `%${phoneNumber}%`)
        .order('booking_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "لا توجد حجوزات",
          description: "لم يتم العثور على حجوزات لهذا الرقم",
        });
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الحجوزات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'canceled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء الحجز بنجاح",
      });

      // Refresh bookings
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'canceled' } : b
      ));
    } catch (error: any) {
      console.error('Error canceling booking:', error);
      toast({
        title: "خطأ",
        description: "فشل في إلغاء الحجز",
        variant: "destructive",
      });
    }
  };

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
           <h1 className="text-2xl md:text-3xl font-bold text-foreground">تتبع حجزك</h1>
           </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-12 max-w-6xl">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            أدخل رقم هاتفك لعرض حجوزاتك
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-6 md:mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm md:text-base">رقم الهاتف</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="5xxxxxxxx"
                  className="h-10 md:h-12 flex-1 text-base"
                  dir="ltr"
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isLoading}
                  className="h-10 md:h-12 px-4 md:px-6"
                >
                  {isLoading ? "جاري..." : "بحث"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {searched && bookings.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-3 md:pb-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg md:text-xl mb-1 md:mb-2 truncate">
                        {getServiceName(booking.service)}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm truncate">
                        حجز رقم: {booking.id.substring(0, 8)}...
                      </CardDescription>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium shrink-0">الاسم:</span>
                      <span className="truncate">{booking.customer_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium shrink-0">الهاتف:</span>
                      <span dir="ltr" className="truncate">{booking.phone_number}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium shrink-0">التاريخ:</span>
                      <span className="truncate">{format(new Date(booking.booking_date), "PPP", { locale: ar })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium shrink-0">الوقت:</span>
                      <span className="truncate">{booking.booking_time}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="flex items-start gap-2 text-xs md:text-sm pt-2 border-t">
                      <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">ملاحظات:</span>
                        <p className="text-muted-foreground mt-1 break-words">{booking.notes}</p>
                      </div>
                    </div>
                  )}

                  {booking.status === 'pending' && (
                    <div className="pt-3 md:pt-4 border-t">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full gap-2 h-9 md:h-10">
                            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            إلغاء الحجز
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base md:text-lg">هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm md:text-base">
                              هل تريد فعلاً إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="mt-0">تراجع</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              نعم، إلغاء الحجز
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {booking.status === 'approved' && (
                    <div className="pt-3 md:pt-4 border-t space-y-3 md:space-y-4">
                      <p className="text-xs md:text-sm text-green-600 dark:text-green-400 text-center font-medium">
                        ✓ تم تأكيد حجزك! نراك قريباً
                      </p>
                      {!reviewedBookings.has(booking.id) && (
                        <RatingForm
                          bookingId={booking.id}
                          serviceId={booking.service}
                          serviceName={getServiceName(booking.service)}
                          customerName={booking.customer_name}
                          onSuccess={() => {
                            setReviewedBookings(prev => new Set([...prev, booking.id]));
                          }}
                        />
                      )}
                      {reviewedBookings.has(booking.id) && (
                        <div className="p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-xs md:text-sm text-green-600 text-center">
                            ✓ شكراً لك! تم إرسال تقييمك بنجاح
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {booking.status === 'canceled' && (
                    <div className="pt-3 md:pt-4 border-t">
                      <p className="text-xs md:text-sm text-muted-foreground text-center">
                        تم إلغاء هذا الحجز
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingTrack;
