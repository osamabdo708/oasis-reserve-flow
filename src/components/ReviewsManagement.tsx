import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  booking_id: string;
  service_name: string;
  customer_name: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export const ReviewsManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / total;
        setStats({ total, average });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("حدث خطأ أثناء تحميل التقييمات");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي التقييمات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>متوسط التقييم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{stats.average.toFixed(1)}</p>
              <div className="flex">
                {renderStars(Math.round(stats.average))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جميع التقييمات</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد تقييمات بعد</p>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right font-semibold">التاريخ</TableHead>
                      <TableHead className="text-right font-semibold">العميل</TableHead>
                      <TableHead className="text-right font-semibold">الخدمة</TableHead>
                      <TableHead className="text-right font-semibold">التقييم</TableHead>
                      <TableHead className="text-right font-semibold">الملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          {new Date(review.created_at).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>{review.customer_name}</TableCell>
                        <TableCell>{review.service_name}</TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell>
                          {review.feedback ? (
                            <span className="text-sm">{review.feedback}</span>
                          ) : (
                            <Badge variant="outline">لا توجد ملاحظات</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <span className="text-sm text-muted-foreground">
                  صفحة {currentPage} من {Math.ceil(reviews.length / itemsPerPage)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(reviews.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(reviews.length / itemsPerPage)}
                >
                  التالي
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
