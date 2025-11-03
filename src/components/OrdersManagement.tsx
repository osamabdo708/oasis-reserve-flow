import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  products: {
    name: string;
  };
}

export const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "خطأ في تحميل الطلبات", variant: "destructive" });
    } else {
      setOrders(data || []);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', orderId);

    if (error) {
      toast({ title: "خطأ في تحميل تفاصيل الطلب", variant: "destructive" });
    } else {
      setOrderItems(data || []);
      setSelectedOrder(orderId);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast({ title: "خطأ في تحديث حالة الطلب", variant: "destructive" });
    } else {
      toast({ title: "تم تحديث حالة الطلب" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      delivered: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "قيد الانتظار",
      confirmed: "مؤكد",
      delivered: "تم التوصيل",
      cancelled: "ملغي",
    };

    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">إدارة الطلبات</h2>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>الهاتف:</strong> {order.customer_phone}</p>
                  {order.customer_email && <p><strong>البريد:</strong> {order.customer_email}</p>}
                </div>
                <div>
                  <p className="text-xl font-bold text-accent">{order.total_amount} ₪</p>
                </div>
              </div>

              {order.notes && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm"><strong>ملاحظات:</strong> {order.notes}</p>
                </div>
              )}

              {selectedOrder === order.id && orderItems.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">تفاصيل الطلب:</h4>
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.products.name} × {item.quantity}</span>
                        <span>{item.price_at_time * item.quantity} ₪</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedOrder === order.id ? setSelectedOrder(null) : fetchOrderItems(order.id)}
                >
                  {selectedOrder === order.id ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                </Button>
                {order.status === 'pending' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                  >
                    تأكيد الطلب
                  </Button>
                )}
                {order.status === 'confirmed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                  >
                    تم التوصيل
                  </Button>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                  >
                    إلغاء الطلب
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد طلبات حتى الآن
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};