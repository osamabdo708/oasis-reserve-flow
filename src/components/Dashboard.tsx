import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Star, TrendingUp, ShoppingCart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalClients: number;
  averageRating: number;
  totalOrders: number;
  pendingBookings: number;
}

interface BookingTrend {
  date: string;
  count: number;
}

interface ServiceStats {
  name: string;
  count: number;
}

interface StatusDistribution {
  name: string;
  value: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalClients: 0,
    averageRating: 0,
    totalOrders: 0,
    pendingBookings: 0,
  });
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [bookingsRes, clientsRes, reviewsRes, ordersRes, servicesRes] = await Promise.all([
        supabase.from('bookings').select('*'),
        supabase.from('clients').select('id'),
        supabase.from('reviews').select('rating'),
        supabase.from('orders').select('total_amount'),
        supabase.from('services').select('id, name'),
      ]);

      if (bookingsRes.data) {
        // Calculate basic stats
        const totalBookings = bookingsRes.data.length;
        const totalRevenue = bookingsRes.data.reduce((sum, booking) => sum + Number(booking.price), 0);
        const pendingBookings = bookingsRes.data.filter(b => b.status === 'pending').length;

        // Calculate booking trends (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const trends = last7Days.map(date => ({
          date: new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
          count: bookingsRes.data.filter(b => b.booking_date === date).length,
        }));

        setBookingTrends(trends);

        // Calculate service popularity
        const serviceCounts: Record<string, number> = {};
        bookingsRes.data.forEach(booking => {
          serviceCounts[booking.service] = (serviceCounts[booking.service] || 0) + 1;
        });

        const serviceStatsData = await Promise.all(
          Object.entries(serviceCounts).map(async ([serviceId, count]) => {
            const service = servicesRes.data?.find(s => s.id === serviceId);
            return {
              name: service?.name || serviceId,
              count,
            };
          })
        );

        setServiceStats(serviceStatsData.sort((a, b) => b.count - a.count).slice(0, 5));

        // Calculate status distribution
        const statusCounts: Record<string, number> = {};
        bookingsRes.data.forEach(booking => {
          statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
        });

        const statusDist = Object.entries(statusCounts).map(([name, value]) => ({
          name: name === 'pending' ? 'قيد الانتظار' : name === 'confirmed' ? 'مؤكد' : name === 'completed' ? 'مكتمل' : 'ملغي',
          value,
        }));

        setStatusDistribution(statusDist);

        setStats({
          totalBookings,
          totalRevenue,
          totalClients: clientsRes.data?.length || 0,
          averageRating: reviewsRes.data && reviewsRes.data.length > 0
            ? reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length
            : 0,
          totalOrders: ordersRes.data?.length || 0,
          pendingBookings,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الحجوزات</CardTitle>
            <Calendar className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingBookings} قيد الانتظار
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalRevenue.toFixed(0)} ₪</div>
            <p className="text-xs text-muted-foreground mt-1">من الحجوزات</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي العملاء</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">عميل مسجل</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">متوسط التقييم</CardTitle>
            <Star className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">من 5 نجوم</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">طلب منتجات</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">معدل النمو</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">+12%</div>
            <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه الحجوزات (آخر 7 أيام)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="الحجوزات" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Popularity */}
        <Card>
          <CardHeader>
            <CardTitle>الخدمات الأكثر طلباً</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="عدد الحجوزات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع حالة الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
