import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface BookingTimelineItem {
  id: string;
  customer_name: string;
  service: string;
  serviceName?: string;
  booking_date: string;
  booking_time: string;
  booking_duration: string;
  status: string;
  phone_number: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500/10 text-green-600 border-green-500/30';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'completed':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'مؤكد';
    case 'pending':
      return 'قيد الانتظار';
    case 'completed':
      return 'مكتمل';
    case 'cancelled':
      return 'ملغي';
    default:
      return status;
  }
};

const getDateLabel = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'اليوم';
  if (isTomorrow(date)) return 'غداً';
  return format(date, 'EEEE d MMMM', { locale: ar });
};

export const DashboardBookingsTimeline = () => {
  const [bookings, setBookings] = useState<BookingTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  const fetchUpcomingBookings = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [bookingsRes, servicesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .gte('booking_date', today)
          .neq('status', 'cancelled')
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(20),
        supabase.from('services').select('id, name'),
      ]);

      if (bookingsRes.data) {
        const bookingsWithServiceNames = bookingsRes.data.map(booking => ({
          ...booking,
          serviceName: servicesRes.data?.find(s => s.id === booking.service)?.name || booking.service,
        }));
        setBookings(bookingsWithServiceNames);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group bookings by date
  const groupedBookings = bookings.reduce((groups, booking) => {
    const date = booking.booking_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(booking);
    return groups;
  }, {} as Record<string, BookingTimelineItem[]>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            جدول الحجوزات القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">جاري التحميل...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          جدول الحجوزات القادمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2 opacity-50" />
            <p>لا توجد حجوزات قادمة</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {Object.entries(groupedBookings).map(([date, dayBookings]) => (
              <div key={date} className="relative">
                {/* Date Header */}
                <div className="sticky top-0 bg-background z-10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="font-semibold text-foreground">
                      {getDateLabel(date)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {dayBookings.length} حجز
                    </Badge>
                  </div>
                </div>

                {/* Timeline Items */}
                <div className="mr-1.5 border-r-2 border-border pr-4 space-y-3">
                  {dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="relative bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      {/* Time indicator dot */}
                      <div className="absolute -right-[1.4rem] top-4 h-2.5 w-2.5 rounded-full bg-primary/60 border-2 border-background" />
                      
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary text-lg">
                              {booking.booking_time}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({booking.booking_duration})
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-sm text-foreground mb-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium truncate">{booking.customer_name}</span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate">
                            {booking.serviceName}
                          </p>
                        </div>
                        
                        <Badge className={`shrink-0 ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
