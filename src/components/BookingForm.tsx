import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { BookingTimeline } from "@/components/BookingTimeline";
import { calculateTimeBlocks, parseDuration, type TimeBlock } from "@/utils/timeCalculations";

interface BookingFormProps {
  preSelectedService?: string;
  preSelectedServiceName?: string;
}

interface DurationOption {
  value: string;
  label: string;
  price: number;
}

export const BookingForm = ({ preSelectedService, preSelectedServiceName }: BookingFormProps) => {
  const [date, setDate] = useState<Date>();
  const [selectedService] = useState(preSelectedService || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+970");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [durationOptions, setDurationOptions] = useState<DurationOption[]>([]);
  
  // Verification states
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Bookings state
  const [bookedBlocks, setBookedBlocks] = useState<TimeBlock[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Fetch service duration options with real-time updates
  useEffect(() => {
    const fetchServiceDurations = async () => {
      if (!selectedService) return;

      try {
        const { data, error } = await supabase
          .from('services')
          .select('duration_options')
          .eq('id', selectedService)
          .single();

        if (error) throw error;

        if (data?.duration_options && Array.isArray(data.duration_options)) {
          const newOptions = data.duration_options as unknown as DurationOption[];
          setDurationOptions(newOptions);
          
          // If no duration is selected or current selection doesn't exist in new options
          if (newOptions.length > 0) {
            const durationExists = selectedDuration && newOptions.some(opt => opt.value === selectedDuration);
            if (!durationExists) {
              setSelectedDuration(newOptions[0].value);
              if (selectedDuration) {
                toast({
                  title: "تم تحديث الخيارات",
                  description: "تم تعديل خيارات المدة. تم اختيار أول خيار متاح تلقائياً.",
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching service durations:', error);
      }
    };

    fetchServiceDurations();

    // Set up real-time subscription
    const channel = supabase
      .channel('service-duration-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'services',
          filter: `id=eq.${selectedService}`
        },
        () => {
          fetchServiceDurations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedService, selectedDuration]);

  const selectedDurationPrice = durationOptions.find(d => d.value === selectedDuration)?.price || 0;

  const timeSlots = [
    "09:00 ص", "10:00 ص", "11:00 ص", "12:00 م",
    "01:00 م", "02:00 م", "03:00 م", "04:00 م",
    "05:00 م", "06:00 م", "07:00 م", "08:00 م",
  ];

  // Fetch existing bookings for the selected date
  useEffect(() => {
    const fetchBookings = async () => {
      if (!date) return;

      setIsLoadingBookings(true);
      try {
        const dateStr = date.toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_time, booking_duration')
          .eq('booking_date', dateStr)
          .eq('status', 'approved');

        if (error) throw error;

        // Calculate time blocks from bookings
        const blocks = calculateTimeBlocks(data || []);
        setBookedBlocks(blocks);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل المواعيد المحجوزة",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();

    // Set up real-time subscription for bookings
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const channel = supabase
        .channel('booking-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `booking_date=eq.${formattedDate}`
          },
          () => {
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [date]);

  const handleSendVerification = async () => {
    if (!phone) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    // Combine country code and phone number, remove + and spaces, and strip leading zeros from phone part
    let phoneDigits = phone.replace(/\D/g, '');
    // Remove leading zeros from the phone number part only
    phoneDigits = phoneDigits.replace(/^0+/, '');
    const fullPhoneNumber = `${countryCode}${phoneDigits}`.replace(/[\s+]/g, '');

    setIsSendingCode(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-verification', {
        body: { phoneNumber: fullPhoneNumber },
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: "تم إرسال رمز التحقق عبر WhatsApp",
      });
      
      setCodeSent(true);
    } catch (error: any) {
      console.error('Error sending verification:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال رمز التحقق",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    // Combine country code and phone number, remove + and spaces, and strip leading zeros from phone part
    let phoneDigits = phone.replace(/\D/g, '');
    // Remove leading zeros from the phone number part only
    phoneDigits = phoneDigits.replace(/^0+/, '');
    const fullPhoneNumber = `${countryCode}${phoneDigits}`.replace(/[\s+]/g, '');

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { 
          phoneNumber: fullPhoneNumber,
          code: verificationCode,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "تم التحقق",
          description: "تم التحقق من رقم الهاتف بنجاح",
        });
        setIsVerified(true);
      } else {
        toast({
          title: "خطأ",
          description: data?.message || "رمز التحقق غير صحيح",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في التحقق من الرمز",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !date || !selectedTime || !name || !phone) {
      toast({
        title: "معلومات ناقصة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!isVerified) {
      toast({
        title: "خطأ",
        description: "يرجى التحقق من رقم الهاتف أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save booking to database
// Prepare phone number for saving
let phoneDigits = phone.replace(/\D/g, '');
phoneDigits = phoneDigits.replace(/^0+/, ''); // remove leading zeros from the number part
const fullPhoneNumber = `${countryCode}${phoneDigits}`;

const { error } = await supabase
  .from('bookings')
  .insert({
    service: selectedService,
    booking_date: date.toISOString().split('T')[0],
    booking_time: selectedTime,
    booking_duration: selectedDuration,
    price: selectedDurationPrice,
    customer_name: name,
    phone_number: fullPhoneNumber,
    notes: notes || null,
    status: 'pending'
  });

      if (error) throw error;

      toast({
        title: "تم تأكيد الحجز بنجاح! ✅",
        description: `سيتم التواصل معك قريباً على الرقم ${phone}`,
      });

      // Reset form (keep service selected and reset to first duration option)
      setDate(undefined);
      setSelectedTime("");
      setSelectedDuration(durationOptions.length > 0 ? durationOptions[0].value : "");
      setName("");
      setPhone("");
      setCountryCode("+970");
      setNotes("");
      setVerificationCode("");
      setCodeSent(false);
      setIsVerified(false);
    } catch (error: any) {
      console.error('Error saving booking:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الحجز. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {preSelectedServiceName && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">الخدمة المختارة</p>
          <p className="text-lg font-bold text-primary">{preSelectedServiceName}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-base">المدة *</Label>
        <div className={cn(
          "grid gap-3",
          durationOptions.length === 1 ? "grid-cols-1" : 
          durationOptions.length === 2 ? "grid-cols-2" : 
          "grid-cols-3"
        )}>
          {durationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedDuration(option.value)}
              className={cn(
                "h-16 rounded-lg border-2 transition-all font-medium flex flex-col items-center justify-center gap-1",
                selectedDuration === option.value 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-border hover:border-primary hover:bg-primary/10"
              )}
            >
              <span className="text-sm">{option.label}</span>
              <span className="text-xs font-bold">{option.price} ₪</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base">التاريخ *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-12 justify-start text-right font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ar }) : "اختر التاريخ"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label className="text-base">اختيار الوقت *</Label>
        {isLoadingBookings ? (
          <div className="h-24 flex items-center justify-center border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : !date ? (
          <div className="h-24 flex items-center justify-center border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">الرجاء اختيار التاريخ أولاً</p>
          </div>
        ) : !selectedDuration ? (
          <div className="h-24 flex items-center justify-center border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">الرجاء اختيار المدة أولاً</p>
          </div>
        ) : (
          <BookingTimeline
            selectedDuration={selectedDuration}
            selectedTime={selectedTime}
            bookedBlocks={bookedBlocks}
            onTimeSelect={setSelectedTime}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-base">الاسم الكامل *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="أدخل اسمك الكامل"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base">رقم الهاتف *</Label>
        <div className="flex gap-2" dir="ltr">
          <Select value={countryCode} onValueChange={setCountryCode} disabled={isVerified}>
            <SelectTrigger className="w-[130px] h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+970">+970</SelectItem>
              <SelectItem value="+972">+972</SelectItem>
              {/* <SelectItem value="+966">🇸🇦 +966</SelectItem>
              <SelectItem value="+971">🇦🇪 +971</SelectItem>
              <SelectItem value="+973">🇧🇭 +973</SelectItem>
              <SelectItem value="+965">🇰🇼 +965</SelectItem>
              <SelectItem value="+968">🇴🇲 +968</SelectItem>
              <SelectItem value="+974">🇶🇦 +974</SelectItem>
              <SelectItem value="+20">🇪🇬 +20</SelectItem>
              <SelectItem value="+962">🇯🇴 +962</SelectItem>
              <SelectItem value="+961">🇱🇧 +961</SelectItem> */}

            </SelectContent>
          </Select>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              // Only allow digits
              const digits = e.target.value.replace(/\D/g, '');
              setPhone(digits);
              setCodeSent(false);
              setIsVerified(false);
              setVerificationCode("");
            }}
            placeholder="5xxxxxxxx"
            className="h-12 flex-1"
            disabled={isVerified}
          />
          {!isVerified && (
        <Button
  type="button"
  onClick={handleSendVerification}
  disabled={isSendingCode || !phone}
  className="h-12 whitespace-nowrap bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2 flex items-center justify-center"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/5968/5968841.png"
    alt="icon"
    className="w-5 h-5"
  />
  {isSendingCode ? "جاري الإرسال..." : codeSent ? "إعادة الإرسال" : "إرسال الرمز"}
</Button>

          )}
        </div>
      </div>

      {codeSent && !isVerified && (
        <div className="space-y-2">
          <Label htmlFor="verification-code" className="text-base">رمز التحقق من WhatsApp *</Label>
          <div className="flex gap-2">
            <Input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="أدخل الرمز المكون من 6 أرقام"
              maxLength={6}
              className="h-12 flex-1"
              dir="ltr"
            />
            <Button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifying || !verificationCode || verificationCode.length !== 6}
              className="h-12"
            >
              {isVerifying ? "جاري التحقق..." : "تحقق"}
            </Button>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-700 dark:text-green-300 text-sm text-center font-medium">✓ تم التحقق من رقم الهاتف بنجاح</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">ملاحظات إضافية (اختياري)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي ملاحظات أو طلبات خاصة..."
          className="min-h-[100px] resize-none"
        />
      </div>

      <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">المدة المختارة:</span>
          <span className="font-bold text-foreground">
            {durationOptions.find(d => d.value === selectedDuration)?.label}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">السعر:</span>
          <span className="font-bold text-primary text-lg">{selectedDurationPrice} ₪</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          💳 <strong>الدفع:</strong> الدفع عند الوصول للمنتجع
        </p>
      </div>

      <Button type="submit" variant="spa" size="lg" className="w-full">
        تأكيد الحجز
      </Button>
    </form>
  );
};
