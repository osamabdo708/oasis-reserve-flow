import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Reminder {
  id: string;
  booking_id: string;
  phone_number: string;
  customer_name: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  message: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

const RemindersManagement = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('reminders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders'
        },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReminders(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجل التذكيرات",
        variant: "destructive",
      });
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            تم الإرسال
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            قيد الانتظار
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            فشل
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجل رسائل التذكير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            جاري التحميل...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل رسائل التذكير</CardTitle>
        <p className="text-sm text-muted-foreground">
          تتبع جميع رسائل التذكير المرسلة للعملاء قبل موعد الحجز بساعة
        </p>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد رسائل تذكير بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">الخدمة</TableHead>
                  <TableHead className="text-right">موعد الحجز</TableHead>
                  <TableHead className="text-right">موعد الإرسال</TableHead>
                  <TableHead className="text-right">تم الإرسال</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">
                      {reminder.customer_name}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {reminder.phone_number}
                    </TableCell>
                    <TableCell>{reminder.service_name}</TableCell>
                    <TableCell>
                      {new Date(reminder.booking_date).toLocaleDateString('ar-EG')}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {reminder.booking_time}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(reminder.scheduled_for)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reminder.sent_at ? (
                        formatDateTime(reminder.sent_at)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reminder.status)}
                      {reminder.error_message && (
                        <div className="text-xs text-red-500 mt-1">
                          {reminder.error_message}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RemindersManagement;