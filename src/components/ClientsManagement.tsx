import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Client {
  id: string;
  name: string;
  age: number | null;
  phone_number: string;
  created_at: string;
}

interface Booking {
  id: string;
  service: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  status: string;
  client_id: string | null;
}

export const ClientsManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    age: "",
    phone_number: "",
  });

  useEffect(() => {
    fetchClients();
    fetchBookings();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل العملاء",
        variant: "destructive",
      });
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-bookings');
      
      if (error) throw error;
      
      if (data?.bookings) {
        setBookings(data.bookings);
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("clients")
        .insert([
          {
            name: newClient.name,
            age: newClient.age ? parseInt(newClient.age) : null,
            phone_number: newClient.phone_number,
          },
        ]);

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة العميل بنجاح",
      });

      setNewClient({ name: "", age: "", phone_number: "" });
      setIsDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة العميل",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف العميل بنجاح",
      });

      fetchClients();
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف العميل",
        variant: "destructive",
      });
    }
  };

  const handleAssignBooking = async (bookingId: string, clientId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ client_id: clientId })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "تم الربط",
        description: "تم ربط الحجز بالعميل بنجاح",
      });

      fetchBookings();
    } catch (error: any) {
      console.error("Error assigning booking:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في ربط الحجز",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ client_id: null })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء ربط الحجز بالعميل",
      });

      fetchBookings();
    } catch (error: any) {
      console.error("Error removing booking:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إلغاء ربط الحجز",
        variant: "destructive",
      });
    }
  };

  const getClientBookings = (clientId: string) => {
    return bookings.filter((b) => b.client_id === clientId);
  };

  const getAvailableBookings = () => {
    return bookings.filter((b) => !b.client_id);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>إدارة العملاء</CardTitle>
            <CardDescription>
              إجمالي العملاء: {clients.length}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                إضافة عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة عميل جديد</DialogTitle>
                <DialogDescription>
                  أدخل معلومات العميل
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">العمر</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newClient.age}
                    onChange={(e) => setNewClient({ ...newClient, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newClient.phone_number}
                    onChange={(e) => setNewClient({ ...newClient, phone_number: e.target.value })}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "جاري الإضافة..." : "إضافة"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {clients.map((client) => {
            const clientBookings = getClientBookings(client.id);
            return (
              <Card key={client.id} className="border-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription>
                        {client.age && `العمر: ${client.age} • `}
                        الهاتف: {client.phone_number}
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">الحجوزات ({clientBookings.length})</h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" />
                            إضافة حجز
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>إضافة حجز للعميل</DialogTitle>
                            <DialogDescription>
                              اختر حجز من الحجوزات المتاحة
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            {getAvailableBookings().length === 0 ? (
                              <p className="text-center text-muted-foreground py-4">
                                لا توجد حجوزات متاحة
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {getAvailableBookings().map((booking) => (
                                  <div
                                    key={booking.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                  >
                                    <div className="text-sm">
                                      <div className="font-medium">{getServiceName(booking.service)}</div>
                                      <div className="text-muted-foreground">
                                        {new Date(booking.booking_date).toLocaleDateString('ar-SA')} - {booking.booking_time}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {booking.customer_name}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAssignBooking(booking.id, client.id)}
                                    >
                                      إضافة
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {clientBookings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 border rounded-lg">
                        لا توجد حجوزات لهذا العميل
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {clientBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1 text-sm">
                              <div className="font-medium">{getServiceName(booking.service)}</div>
                              <div className="text-muted-foreground">
                                {new Date(booking.booking_date).toLocaleDateString('ar-SA')} - {booking.booking_time}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={booking.status === 'approved' ? 'default' : 'outline'}>
                                {booking.status === 'pending' ? 'قيد الانتظار' : booking.status === 'approved' ? 'مؤكد' : 'ملغي'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveBooking(booking.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {clients.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              لا توجد عملاء. ابدأ بإضافة عميل جديد.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
