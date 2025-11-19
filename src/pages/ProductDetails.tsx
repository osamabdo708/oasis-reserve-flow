import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';

// Import product images
import productMassageOil from '@/assets/product-massage-oil.jpg';
import productBodyScrub from '@/assets/product-body-scrub.jpg';
import productFaceCream from '@/assets/product-face-cream.jpg';
import productBathSalts from '@/assets/product-bath-salts.jpg';
import productMudMask from '@/assets/product-mud-mask.jpg';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  is_active: boolean;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);

  // Update cart count from localStorage
  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
    setCartCount(totalItems);
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
    updateCartCount();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('فشل في تحميل تفاصيل المنتج');
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (imageUrl: string) => {
    const imageMap: { [key: string]: string } = {
      'product-massage-oil.jpg': productMassageOil,
      'product-body-scrub.jpg': productBodyScrub,
      'product-face-cream.jpg': productFaceCream,
      'product-bath-salts.jpg': productBathSalts,
      'product-mud-mask.jpg': productMudMask,
    };
    return imageMap[imageUrl] || productMassageOil;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    toast.success('تمت إضافة المنتج إلى السلة');
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30" dir="rtl">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-4 max-w-6xl">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center" dir="rtl">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-foreground">المنتج غير موجود</h2>
          <Button variant="spa" onClick={() => navigate('/shop')}>
            العودة إلى المتجر
            <ArrowRight className="mr-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/shop')}>
                <ArrowRight className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">تفاصيل المنتج</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Navigate to shop with cart open state
                navigate('/shop', { state: { openCart: true } });
              }}
              className="relative"
            >
              <ShoppingCart className="ml-2" />
              السلة
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -left-2">{cartCount}</Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Product Details */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <Card className="overflow-hidden group">
            <div className="relative aspect-square">
              <img 
                src={getProductImage(product.image_url || '')} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg px-6 py-3">
                    نفذت الكمية
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h2>
              {product.category && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {product.category}
                </Badge>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-bold text-accent">₪{product.price}</span>
            </div>

            <div>
              <p className="text-muted-foreground leading-relaxed text-lg">{product.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                {product.stock > 0 ? `متوفر: ${product.stock}` : "نفذ"}
              </Badge>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <span className="text-foreground font-semibold text-lg">الكمية:</span>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={decreaseQuantity}
                      className="px-4 rounded-none"
                    >
                      -
                    </Button>
                    <span className="px-6 py-2 font-semibold text-foreground min-w-[60px] text-center">{quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={increaseQuantity}
                      className="px-4 rounded-none"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  variant="spa"
                  size="lg"
                  className="w-full gap-2 text-lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  إضافة إلى السلة
                </Button>
              </div>
            )}

            {product.stock === 0 && (
              <Button disabled size="lg" className="w-full" variant="destructive">
                نفذت الكمية
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
