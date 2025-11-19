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

const services = [
  { id: "massage", name: "مساج استرخائي" },
  { id: "skincare", name: "عناية بالبشرة" },
  { id: "hammam", name: "حمام مغربي" },
  { id: "facial", name: "تنظيف البشرة" },
];

const BookingTrack = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (bookings.length > 0) {
      checkReviewedBookings();
    }
  }, [bookings]);

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

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          {/* <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            تتبع حجزك
          </h1> */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            أدخل رقم هاتفك لعرض حجوزاتك
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">رقم الهاتف</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="5xxxxxxxx"
                  className="h-12 flex-1"
                  dir="ltr"
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isLoading}
                  className="h-12"
                >
                  {isLoading ? "جاري البحث..." : "بحث"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {searched && bookings.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {getServiceName(booking.service)}
                      </CardTitle>
                      <CardDescription>
                        حجز رقم: {booking.id.substring(0, 8)}...
                      </CardDescription>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">الاسم:</span>
                      <span>{booking.customer_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">الهاتف:</span>
                      <span dir="ltr">{booking.phone_number}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">التاريخ:</span>
                      <span>{format(new Date(booking.booking_date), "PPP", { locale: ar })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">الوقت:</span>
                      <span>{booking.booking_time}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="flex items-start gap-2 text-sm pt-2 border-t">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">ملاحظات:</span>
                        <p className="text-muted-foreground mt-1">{booking.notes}</p>
                      </div>
                    </div>
                  )}

                  {booking.status === 'pending' && (
                    <div className="pt-4 border-t">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full gap-2">
                            <X className="w-4 h-4" />
                            إلغاء الحجز
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل تريد فعلاً إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>تراجع</AlertDialogCancel>
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
                    <div className="pt-4 border-t space-y-4">
                      <p className="text-sm text-green-600 dark:text-green-400 text-center font-medium">
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
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-green-600 text-center">
                            ✓ شكراً لك! تم إرسال تقييمك بنجاح
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {booking.status === 'canceled' && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground text-center">
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
