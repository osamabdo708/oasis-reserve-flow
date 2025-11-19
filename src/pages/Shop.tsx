import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import faceCream from "@/assets/product-face-cream.jpg";
import massageOil from "@/assets/product-massage-oil.jpg";
import mudMask from "@/assets/product-mud-mask.jpg";
import bodyScrub from "@/assets/product-body-scrub.jpg";
import bathSalts from "@/assets/product-bath-salts.jpg";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
}

const Shop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedShippingMethod, setSelectedShippingMethod] = useState("");
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchShippingMethods();

    // Check if we should open cart from navigation state
    const state = (location.state as any);
    if (state?.openCart) {
      setShowCart(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }

    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const getProductImage = (imageUrl: string) => {
    const imageMap: Record<string, string> = {
      'product-face-cream.jpg': faceCream,
      'product-massage-oil.jpg': massageOil,
      'product-mud-mask.jpg': mudMask,
      'product-body-scrub.jpg': bodyScrub,
      'product-bath-salts.jpg': bathSalts,
    };
    return imageMap[imageUrl] || imageUrl;
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "خطأ في تحميل المنتجات", variant: "destructive" });
    } else {
      setProducts(data || []);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({ title: "المخزون غير كافٍ", variant: "destructive" });
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({ title: "تمت الإضافة للسلة" });
  };

  const updateQuantity = (productId: string, change: number) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.stock) {
      toast({ title: "المخزون غير كافٍ", variant: "destructive" });
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getTotalAmount = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingFee = getShippingFee();
    return subtotal + shippingFee;
  };

  const getShippingFee = () => {
    if (!selectedShippingMethod) return 0;
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    return method ? method.price : 0;
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !customerAddress || !selectedShippingMethod) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
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
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({ title: "تم إرسال طلبك بنجاح!" });
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSelectedShippingMethod("");
      setNotes("");
    } catch (error) {
      toast({ title: "خطأ في إرسال الطلب", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowRight className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">المتجر</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCart(!showCart)}
              className="relative"
            >
              <ShoppingCart className="ml-2" />
              السلة
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -left-2">{cart.length}</Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <Card 
              key={product.id} 
              className="group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {product.image_url && (
                <div className="aspect-square overflow-hidden">
                  <img
                    src={getProductImage(product.image_url)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{product.name}</span>
                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                    {product.stock > 0 ? `متوفر: ${product.stock}` : "نفذ"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-accent">{product.price} ₪</span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock === 0}
                    variant="spa"
                  >
                    <Plus className="ml-2" size={18} />
                    أضف للسلة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)}>
            <div
              className="fixed left-0 top-0 h-full w-full max-w-md bg-background shadow-xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">سلة التسوق</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
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
                              onClick={() => removeFromCart(item.id)}
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
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus size={16} />
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, 1)}
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
                      <span>{getTotalAmount()} ₪</span>
                    </div>
                    <Button
                      className="w-full"
                      variant="spa"
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
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
                    variant="spa"
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
      </div>
    </div>
  );
};

export default Shop;