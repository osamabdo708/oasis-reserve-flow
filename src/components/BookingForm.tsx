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
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05xxxxxxxx"
          className="h-12"
          dir="ltr"
        />
      </div>

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
