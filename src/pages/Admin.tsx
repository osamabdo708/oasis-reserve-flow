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
import { LogOut } from "lucide-react";

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
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "default",
      confirmed: "secondary",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "قيد الانتظار",
      confirmed: "مؤكد",
      cancelled: "ملغي",
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
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
                        <TableCell className="text-right" dir="ltr">{booking.phone_number}</TableCell>
                        <TableCell className="text-right">{booking.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(booking.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
