import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RatingFormProps {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  onSuccess?: () => void;
}

export const RatingForm = ({
  bookingId,
  serviceId,
  serviceName,
  customerName,
  onSuccess,
}: RatingFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("يرجى اختيار التقييم");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        service_id: serviceId,
        service_name: serviceName,
        customer_name: customerName,
        rating,
        feedback: feedback.trim() || null,
      });

      if (error) throw error;

      toast.success("تم إرسال التقييم بنجاح");
      setRating(0);
      setFeedback("");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("حدث خطأ أثناء إرسال التقييم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="space-y-2">
        <Label className="text-base">كيف كانت تجربتك مع {serviceName}؟</Label>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">ملاحظاتك (اختياري)</Label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="شاركنا رأيك في الخدمة..."
          className="resize-none"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-left">
          {feedback.length}/500
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
        {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
      </Button>
    </form>
  );
};
