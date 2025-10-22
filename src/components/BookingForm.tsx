import { useState } from "react";
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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const services = [
  { id: "massage", name: "مساج استرخائي", price: "200 ريال" },
  { id: "skincare", name: "عناية بالبشرة", price: "150 ريال" },
  { id: "hammam", name: "حمام مغربي", price: "180 ريال" },
  { id: "facial", name: "تنظيف البشرة", price: "120 ريال" },
];

const timeSlots = [
  "09:00 ص", "10:00 ص", "11:00 ص", "12:00 م",
  "01:00 م", "02:00 م", "03:00 م", "04:00 م",
  "05:00 م", "06:00 م", "07:00 م", "08:00 م",
];

export const BookingForm = () => {
  const [date, setDate] = useState<Date>();
  const [selectedService, setSelectedService] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  
  // Verification states
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendVerification = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم هاتف صحيح",
        variant: "destructive",
      });
      return;
    }

    setIsSendingCode(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-verification', {
        body: { phoneNumber: phone },
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

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { 
          phoneNumber: phone,
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

  const handleSubmit = (e: React.FormEvent) => {
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

    toast({
      title: "تم تأكيد الحجز بنجاح! ✅",
      description: `سيتم التواصل معك قريباً على الرقم ${phone}`,
    });

    // Reset form
    setSelectedService("");
    setDate(undefined);
    setSelectedTime("");
    setName("");
    setPhone("");
    setNotes("");
    setVerificationCode("");
    setCodeSent(false);
    setIsVerified(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="service" className="text-base">نوع الخدمة *</Label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger id="service" className="h-12">
            <SelectValue placeholder="اختر الخدمة" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - {service.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Label htmlFor="time" className="text-base">الوقت *</Label>
        <Select value={selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger id="time" className="h-12">
            <SelectValue placeholder="اختر الوقت" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="flex gap-2">
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setCodeSent(false);
              setIsVerified(false);
              setVerificationCode("");
            }}
            placeholder="05xxxxxxxx"
            className="h-12 flex-1"
            dir="ltr"
            disabled={isVerified}
          />
          {!isVerified && (
            <Button
              type="button"
              onClick={handleSendVerification}
              disabled={isSendingCode || !phone || phone.length < 10}
              variant="outline"
              className="h-12"
            >
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

      <div className="bg-secondary/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💳 <strong>الدفع:</strong> الدفع عند الوصول للمنتجع
        </p>
      </div>

      <Button type="submit" variant="spa" size="lg" className="w-full">
        تأكيد الحجز
      </Button>
    </form>
  );
};
