import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart as ShoppingCartComponent } from "@/components/ShoppingCart";
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

const Shop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, getCartCount, getSubtotal } = useCart();

  useEffect(() => {
    fetchProducts();

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

  const handleAddToCart = (product: Product) => {
    const result = addToCart(product);
    toast({ 
      title: result.message, 
      variant: result.success ? "default" : "destructive" 
    });
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
              className="relative gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              السلة
              {getCartCount() > 0 && (
                <Badge variant="default" className="absolute -top-2 -left-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getCartCount()}
                </Badge>
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
                      handleAddToCart(product);
                    }}
                    disabled={product.stock === 0}
                    variant="default"
                  >
                    <Plus className="ml-2" size={18} />
                    أضف للسلة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Shopping Cart Component */}
        <ShoppingCartComponent
          cart={cart}
          showCart={showCart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          getSubtotal={getSubtotal}
        />
      </div>
    </div>
  );
};

export default Shop;