import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
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
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="bg-primary text-primary-foreground py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
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
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-foreground">المنتج غير موجود</h2>
          <Button onClick={() => navigate('/shop')}>
            العودة إلى المتجر
            <ArrowRight className="mr-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">تفاصيل المنتج</h1>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/shop')}
            className="gap-2"
          >
            العودة إلى المتجر
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Product Details */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative">
            <img 
              src={getProductImage(product.image_url || '')} 
              alt={product.name}
              className="w-full h-auto rounded-lg shadow-lg object-cover"
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <span className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg text-lg font-bold">
                  نفذت الكمية
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">{product.name}</h2>
              {product.category && (
                <span className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                  {product.category}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">₪{product.price}</span>
            </div>

            <div className="prose prose-lg">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-5 w-5" />
              <span>الكمية المتوفرة: {product.stock}</span>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-foreground font-semibold">الكمية:</span>
                  <div className="flex items-center border border-border rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={decreaseQuantity}
                      className="px-4"
                    >
                      -
                    </Button>
                    <span className="px-6 py-2 font-semibold text-foreground">{quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={increaseQuantity}
                      className="px-4"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  size="lg"
                  className="w-full gap-2 text-lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  إضافة إلى السلة
                </Button>
              </div>
            )}

            {product.stock === 0 && (
              <Button disabled size="lg" className="w-full">
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
