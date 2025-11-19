import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2, Plus, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import userIcon from "@/assets/user-icon.png";

interface Client {
  id: string;
  name: string;
  age: number | null;
  phone_number: string;
  gender: string | null;
  address: string | null;
  progress: any;
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
    gender: "",
    address: "",
  });
  const [newProgress, setNewProgress] = useState("");
  const [openBookingSections, setOpenBookingSections] = useState<Record<string, boolean>>({});

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
            gender: newClient.gender || null,
            address: newClient.address || null,
          },
        ]);

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة العميل بنجاح",
      });

      setNewClient({ name: "", age: "", phone_number: "", gender: "", address: "" });
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

  const handleAddProgress = async () => {
    if (!newProgress.trim() || !selectedClient) return;

    const currentProgress = Array.isArray(selectedClient.progress) 
      ? selectedClient.progress 
      : selectedClient.progress 
        ? [selectedClient.progress]
        : [];

    const updatedProgress = [
      ...currentProgress,
      {
        note: newProgress,
        timestamp: new Date().toISOString(),
      },
    ];

    const { error } = await supabase
      .from("clients")
      .update({ progress: updatedProgress })
      .eq("id", selectedClient.id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة ملاحظة التقدم",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم الإضافة",
      description: "تم إضافة ملاحظة التقدم بنجاح",
    });
    
    setNewProgress("");
    fetchClients();
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

      if (error) {
        console.error("Error assigning booking:", error);
        throw error;
      }

      toast({
        title: "تم التعيين",
        description: "تم تعيين الحجز للعميل بنجاح",
      });

      fetchBookings();
      fetchClients();
    } catch (error: any) {
      console.error("Error assigning booking:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تعيين الحجز",
        variant: "destructive",
      });
    }
  };

  const handleUnassignBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ client_id: null })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء تعيين الحجز",
      });

      fetchBookings();
      fetchClients();
    } catch (error: any) {
      console.error("Error unassigning booking:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إلغاء تعيين الحجز",
        variant: "destructive",
      });
    }
  };

  const getClientBookings = (clientId: string) => {
    return bookings.filter((booking) => booking.client_id === clientId);
  };

  const getAvailableBookings = () => {
    return bookings.filter((booking) => !booking.client_id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">إدارة العملاء</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="ml-2 h-4 w-4" />
              إضافة عميل جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عميل جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل العميل الجديد
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({ ...newClient, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="age">العمر</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newClient.age}
                    onChange={(e) =>
                      setNewClient({ ...newClient, age: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={newClient.phone_number}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        phone_number: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gender">الجنس</Label>
                  <Input
                    id="gender"
                    value={newClient.gender}
                    onChange={(e) =>
                      setNewClient({ ...newClient, gender: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                  />
                </div>
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

      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
          <CardDescription>
            إدارة العملاء وربطهم بالحجوزات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex gap-4 items-start">
                    <img 
                      src={userIcon} 
                      alt="User" 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="mb-2">{client.name}</CardTitle>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>العمر: {client.age || "غير محدد"} | الجنس: {client.gender || "غير محدد"}</p>
                            <p>الهاتف: {client.phone_number}</p>
                            <p>العنوان: {client.address || "غير محدد"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedClient(client)}
                              >
                                <FileText className="h-4 w-4 ml-2" />
                                ملاحظات التقدم
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>ملاحظات التقدم - {client.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="max-h-96 overflow-y-auto space-y-2">
                                  {(Array.isArray(client.progress) ? client.progress : []).map((note: any, idx: number) => (
                                    <Card key={idx}>
                                      <CardContent className="pt-4">
                                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {new Date(note.timestamp).toLocaleString('ar-EG')}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  {(!client.progress || (Array.isArray(client.progress) && client.progress.length === 0)) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      لا توجد ملاحظات بعد
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Textarea
                                    placeholder="إضافة ملاحظة تقدم..."
                                    value={newProgress}
                                    onChange={(e) => setNewProgress(e.target.value)}
                                  />
                                  <Button onClick={handleAddProgress}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">حجوزات العميل</h4>
                      {getClientBookings(client.id).length > 0 ? (
                        <div className="space-y-2">
                          {getClientBookings(client.id).map((booking) => (
                            <div
                              key={booking.id}
                              className="flex justify-between items-center p-3 bg-muted rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{booking.service}</p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.customer_name} - {booking.booking_date} في{" "}
                                  {booking.booking_time}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  {booking.status}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnassignBooking(booking.id)}
                              >
                                <X className="h-4 w-4 ml-2" />
                                إزالة
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          لا توجد حجوزات معينة
                        </p>
                      )}
                    </div>

                    <Collapsible
                      open={openBookingSections[client.id]}
                      onOpenChange={(open) =>
                        setOpenBookingSections({ ...openBookingSections, [client.id]: open })
                      }
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">الحجوزات المتاحة</h4>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {openBookingSections[client.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="ml-2">
                              {getAvailableBookings().length} حجز متاح
                            </span>
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      
                      <CollapsibleContent className="mt-2">
                        {getAvailableBookings().length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {getAvailableBookings().map((booking) => (
                              <div
                                key={booking.id}
                                className="flex justify-between items-center p-3 bg-muted rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{booking.service}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {booking.customer_name} - {booking.booking_date} في{" "}
                                    {booking.booking_time}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleAssignBooking(booking.id, client.id)
                                  }
                                >
                                  <Plus className="h-4 w-4 ml-2" />
                                  تعيين
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            لا توجد حجوزات متاحة
                          </p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clients.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                لا يوجد عملاء بعد. قم بإضافة عميل جديد للبدء.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
