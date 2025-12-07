import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BookingSlot {
  id: string;
  customer_name: string;
  serviceName: string;
  booking_time: string;
  booking_duration: string;
  status: string;
}

interface DayBookings {
  date: string;
  dayName: string;
  bookings: BookingSlot[];
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM to 6 PM

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500/80 hover:bg-green-500';
    case 'pending':
      return 'bg-yellow-500/80 hover:bg-yellow-500';
    case 'completed':
      return 'bg-blue-500/80 hover:bg-blue-500';
    default:
      return 'bg-primary/80 hover:bg-primary';
  }
};

const parseTimeToHour = (time: string): number => {
  const [hourPart] = time.split(':');
  let hour = parseInt(hourPart, 10);
  if (time.toLowerCase().includes('pm') && hour !== 12) hour += 12;
  if (time.toLowerCase().includes('am') && hour === 12) hour = 0;
  return hour;
};

export const DashboardBookingsTimeline = () => {
  const [weekData, setWeekData] = useState<DayBookings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeekBookings();
  }, []);

  const fetchWeekBookings = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      
      const startDate = format(weekDates[0], 'yyyy-MM-dd');
      const endDate = format(weekDates[6], 'yyyy-MM-dd');

      const [bookingsRes, servicesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .gte('booking_date', startDate)
          .lte('booking_date', endDate)
          .neq('status', 'cancelled'),
        supabase.from('services').select('id, name'),
      ]);

      const weekBookings: DayBookings[] = weekDates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEEE', { locale: ar }),
        bookings: [],
      }));

      if (bookingsRes.data) {
        bookingsRes.data.forEach(booking => {
          const dayIndex = weekBookings.findIndex(d => d.date === booking.booking_date);
          if (dayIndex !== -1) {
            weekBookings[dayIndex].bookings.push({
              id: booking.id,
              customer_name: booking.customer_name,
              serviceName: servicesRes.data?.find(s => s.id === booking.service)?.name || booking.service,
              booking_time: booking.booking_time,
              booking_duration: booking.booking_duration,
              status: booking.status,
            });
          }
        });
      }

      setWeekData(weekBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBookingAtHour = (bookings: BookingSlot[], hour: number): BookingSlot | null => {
    return bookings.find(b => parseTimeToHour(b.booking_time) === hour) || null;
  };

  const formatHour = (hour: number) => {
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${isPM ? 'م' : 'ص'}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            جدول الأسبوع
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
          جدول الأسبوع
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header - Days */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
                <div className="text-xs text-muted-foreground text-center">الوقت</div>
                {weekData.map((day) => (
                  <div 
                    key={day.date} 
                    className="text-center"
                  >
                    <div className="text-xs font-medium text-foreground">{day.dayName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(parseISO(day.date), 'd/M')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid - Hours x Days */}
              <div className="space-y-1">
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                    {/* Hour label */}
                    <div className="text-xs text-muted-foreground flex items-center justify-center">
                      {formatHour(hour)}
                    </div>
                    
                    {/* Day cells */}
                    {weekData.map((day) => {
                      const booking = getBookingAtHour(day.bookings, hour);
                      
                      return (
                        <Tooltip key={`${day.date}-${hour}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-10 rounded-md border transition-all cursor-pointer",
                                booking
                                  ? `${getStatusColor(booking.status)} text-white`
                                  : "bg-muted/20 border-border/50 hover:bg-muted/40"
                              )}
                            >
                              {booking && (
                                <div className="h-full flex items-center justify-center px-1">
                                  <span className="text-[10px] font-medium truncate text-center leading-tight">
                                    {booking.customer_name.split(' ')[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          {booking && (
                            <TooltipContent side="top" className="text-right">
                              <div className="space-y-1">
                                <p className="font-semibold">{booking.customer_name}</p>
                                <p className="text-xs text-muted-foreground">{booking.serviceName}</p>
                                <p className="text-xs">{booking.booking_time} - {booking.booking_duration}</p>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-green-500/80" />
                  <span className="text-muted-foreground">مؤكد</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-yellow-500/80" />
                  <span className="text-muted-foreground">قيد الانتظار</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-blue-500/80" />
                  <span className="text-muted-foreground">مكتمل</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-muted/20 border border-border/50" />
                  <span className="text-muted-foreground">متاح</span>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
