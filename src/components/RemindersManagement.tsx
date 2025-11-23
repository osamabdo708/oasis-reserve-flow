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
import { toast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        .order('scheduled_for', { ascending: false });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const sentReminders = reminders.filter(r => r.status === 'sent');
  const failedReminders = reminders.filter(r => r.status === 'failed');

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
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          سجل رسائل التذكير
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          تتبع جميع رسائل التذكير المرسلة للعملاء قبل موعد الحجز بساعة (للحجوزات المؤكدة فقط)
        </p>
        <div className="flex gap-4 mt-4">
          <div className="text-sm">
            <span className="font-semibold text-yellow-600">قيد الانتظار:</span> {pendingReminders.length}
          </div>
          <div className="text-sm">
            <span className="font-semibold text-green-600">تم الإرسال:</span> {sentReminders.length}
          </div>
          <div className="text-sm">
            <span className="font-semibold text-red-600">فشل:</span> {failedReminders.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              قيد الانتظار ({pendingReminders.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              تم الإرسال ({sentReminders.length})
            </TabsTrigger>
            <TabsTrigger value="failed" className="gap-2">
              <XCircle className="w-4 h-4" />
              فشل ({failedReminders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingReminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد رسائل تذكير قيد الانتظار
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
                      <TableHead className="text-right">سيتم الإرسال في</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-medium">
                          {reminder.customer_name}
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {reminder.phone_number}
                        </TableCell>
                        <TableCell>{reminder.service_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(reminder.booking_date)}</span>
                            <span className="text-sm text-muted-foreground">
                              {reminder.booking_time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-yellow-600">
                              {formatDateTime(reminder.scheduled_for)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              (ساعة قبل الموعد)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(reminder.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {sentReminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد رسائل تذكير مرسلة بعد
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
                      <TableHead className="text-right">تم الإرسال في</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentReminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-medium">
                          {reminder.customer_name}
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {reminder.phone_number}
                        </TableCell>
                        <TableCell>{reminder.service_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(reminder.booking_date)}</span>
                            <span className="text-sm text-muted-foreground">
                              {reminder.booking_time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {reminder.sent_at ? formatDateTime(reminder.sent_at) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(reminder.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="failed">
            {failedReminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد رسائل فشلت
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
                      <TableHead className="text-right">كان مقرراً</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">سبب الفشل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedReminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-medium">
                          {reminder.customer_name}
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {reminder.phone_number}
                        </TableCell>
                        <TableCell>{reminder.service_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(reminder.booking_date)}</span>
                            <span className="text-sm text-muted-foreground">
                              {reminder.booking_time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(reminder.scheduled_for)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(reminder.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-red-500 max-w-xs">
                            {reminder.error_message || 'خطأ غير معروف'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RemindersManagement;