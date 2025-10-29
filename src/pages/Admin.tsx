import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, CheckCircle, MessageCircle, CalendarCheck, Sparkles, Package } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Booking {
  id: string;
  created_at: string;
  service: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  phone_number: string;
  notes: string | null;
  status: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      fetchBookings();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === "admin" && password === "admin") {
      sessionStorage.setItem("adminAuth", "true");
      setIsAuthenticated(true);
      fetchBookings();
      toast({
        title: "تم تسجيل الدخول",
        description: "مرحباً بك في لوحة التحكم",
      });
    } else {
      toast({
        title: "خطأ",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    navigate("/");
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-bookings');
      
      if (error) throw error;
      
      if (data?.bookings) {
        setBookings(data.bookings);
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

  const getServiceName = (serviceId: string) => {
    const services: Record<string, string> = {
      massage: "مساج استرخائي",
      skincare: "عناية بالبشرة",
      hammam: "حمام مغربي",
      facial: "تنظيف البشرة",
    };
    return services[serviceId] || serviceId;
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

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('approve-booking', {
        body: { bookingId },
      });

      if (error) throw error;

      toast({
        title: "تم التأكيد",
        description: "تم تأكيد الحجز وإرسال رسالة WhatsApp للعميل",
      });

      // Refresh bookings
      fetchBookings();
    } catch (error: any) {
      console.error('Error approving booking:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تأكيد الحجز",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-2xl text-center">لوحة التحكم</CardTitle>
            <CardDescription className="text-center">
              تسجيل دخول المدير
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                تسجيل الدخول
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30" dir="rtl">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">لوحة التحكم - الحجوزات</h1>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="w-full" dir="rtl">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="bookings" className="gap-2">
              <CalendarCheck className="w-4 h-4" />
              الحجوزات
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Sparkles className="w-4 h-4" />
              الخدمات
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              المنتجات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>جميع الحجوزات</CardTitle>
                    <CardDescription>
                      إجمالي الحجوزات: {bookings.length}
                    </CardDescription>
                  </div>
                  <Button onClick={fetchBookings} disabled={isLoading}>
                    {isLoading ? "جاري التحميل..." : "تحديث"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>
                ) : bookings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">لا توجد حجوزات</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">التاريخ</TableHead>
                          <TableHead className="text-right">الخدمة</TableHead>
                          <TableHead className="text-right">موعد الحجز</TableHead>
                          <TableHead className="text-right">الوقت</TableHead>
                          <TableHead className="text-right">اسم العميل</TableHead>
                          <TableHead className="text-right">رقم الهاتف</TableHead>
                          <TableHead className="text-right">ملاحظات</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="text-right">
                              {new Date(booking.created_at).toLocaleDateString('ar-SA')}
                            </TableCell>
                            <TableCell className="text-right">
                              {getServiceName(booking.service)}
                            </TableCell>
                            <TableCell className="text-right">
                              {new Date(booking.booking_date).toLocaleDateString('ar-SA')}
                            </TableCell>
                            <TableCell className="text-right">{booking.booking_time}</TableCell>
                            <TableCell className="text-right">{booking.customer_name}</TableCell>
<TableCell className="text-right">
  <a
    href={`https://wa.me/${booking.phone_number.replace(/[^0-9]/g, '')}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex flex-row-reverse justify-center items-center gap-2 bg-[#4dca5c5c] rounded-md p-1.5 border border-[#bbf7d0] text-[#25D366] hover:text-[#20BA5A] transition-colors"
    dir="ltr"
  >
    <img
      src="https://cdn-icons-png.flaticon.com/512/5968/5968841.png"
      alt="message icon"
      className="w-4 h-4"
    />
    {booking.phone_number}
  </a>
</TableCell>


                            <TableCell className="text-right">{booking.notes || "-"}</TableCell>
                            <TableCell className="text-right">
                              {getStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              {booking.status === 'pending' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" className="gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      تأكيد
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>تأكيد الحجز</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        هل تريد تأكيد هذا الحجز؟ سيتم إرسال رسالة WhatsApp تلقائياً للعميل.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleApproveBooking(booking.id)}>
                                        نعم، تأكيد الحجز
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الخدمات</CardTitle>
                <CardDescription>قريباً...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المنتجات</CardTitle>
                <CardDescription>قريباً...</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
