import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/hooks/useCart';

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
}

interface ShoppingCartProps {
  cart: CartItem[];
  showCart: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, change: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  getSubtotal: () => number;
}

export const ShoppingCart = ({
  cart,
  showCart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  getSubtotal,
}: ShoppingCartProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (showCart) {
      fetchShippingMethods();
    }
  }, [showCart]);

  const fetchShippingMethods = async () => {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching shipping methods:', error);
    } else {
      setShippingMethods(data || []);
    }
  };

  const getShippingFee = () => {
    if (!selectedShippingMethod) return 0;
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    return method ? method.price : 0;
  };

  const getTotalAmount = () => {
    return getSubtotal() + getShippingFee();
  };

  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !customerAddress || !selectedShippingMethod) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          address: customerAddress,
          shipping_method_id: selectedShippingMethod,
          shipping_fee: getShippingFee(),
          total_amount: getTotalAmount(),
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({ title: 'تم إرسال طلبك بنجاح!' });
      onClearCart();
      setShowCheckout(false);
      onClose();
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setSelectedShippingMethod('');
      setNotes('');
    } catch (error) {
      toast({ title: 'خطأ في إرسال الطلب', variant: 'destructive' });
    }
  };

  if (!showCart) return null;

  return (
    <>
      {/* Cart Sidebar */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
        <div
          className="fixed left-0 top-0 h-full w-full max-w-md bg-background shadow-xl p-6 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">سلة التسوق</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X />
            </Button>
          </div>

          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">السلة فارغة</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <X size={18} />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.price} ₪ × {item.quantity} = {item.price * item.quantity} ₪
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>المجموع:</span>
                  <span>{getSubtotal().toFixed(2)} ₪</span>
                </div>
                <Button
                  className="w-full"
                  variant="default"
                  size="lg"
                  onClick={() => setShowCheckout(true)}
                >
                  إتمام الطلب
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>إتمام الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">الاسم *</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسمك"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">رقم الهاتف *</label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">العنوان *</label>
                <Textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="أدخل عنوانك الكامل"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">طريقة الشحن *</label>
                <select
                  value={selectedShippingMethod}
                  onChange={(e) => setSelectedShippingMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">اختر طريقة الشحن</option>
                  {shippingMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} - {method.price.toFixed(2)} ₪
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">ملاحظات</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية (اختياري)"
                  rows={3}
                />
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span>{getSubtotal().toFixed(2)} ₪</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم الشحن:</span>
                  <span>{getShippingFee().toFixed(2)} ₪</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>المجموع الكلي:</span>
                  <span>{getTotalAmount().toFixed(2)} ₪</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCheckout(false)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleCheckout}
                >
                  تأكيد الطلب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
