import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
  is_active: boolean;
}

export const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    stock: "",
    category: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "خطأ في تحميل المنتجات", variant: "destructive" });
    } else {
      setProducts(data || []);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار ملف صورة", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الملف يجب أن يكون أقل من 5 ميجابايت", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: data.publicUrl });
      
      toast({ title: "تم رفع الصورة بنجاح" });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({ title: error.message || "فشل في رفع الصورة", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image_url: "",
      stock: "",
      category: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      image_url: formData.image_url,
      stock: parseInt(formData.stock),
      category: formData.category,
      is_active: true,
    };

    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingId);

      if (error) {
        toast({ title: "خطأ في تحديث المنتج", variant: "destructive" });
      } else {
        toast({ title: "تم تحديث المنتج بنجاح" });
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        toast({ title: "خطأ في إضافة المنتج", variant: "destructive" });
      } else {
        toast({ title: "تم إضافة المنتج بنجاح" });
        resetForm();
      }
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image_url: product.image_url || "",
      stock: product.stock.toString(),
      category: product.category || "",
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "خطأ في حذف المنتج", variant: "destructive" });
    } else {
      toast({ title: "تم حذف المنتج" });
    }
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (error) {
      toast({ title: "خطأ في تحديث حالة المنتج", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المنتجات</h2>
        <Button onClick={() => setIsAdding(!isAdding)} variant="spa">
          <Plus className="ml-2" />
          إضافة منتج جديد
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "تعديل المنتج" : "إضافة منتج جديد"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">اسم المنتج *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم المنتج"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الوصف</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المنتج"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">السعر (₪) *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">المخزون *</label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الفئة</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="مثال: منتجات العناية"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">صورة المنتج</label>
              <div className="flex gap-2">
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="رابط الصورة أو قم بالرفع"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "جاري الرفع..." : "رفع"}
                </Button>
              </div>
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="معاينة"
                  className="w-full h-32 object-cover rounded-md mt-2"
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} variant="spa" className="flex-1">
                <Check className="ml-2" />
                {editingId ? "تحديث" : "إضافة"}
              </Button>
              <Button onClick={resetForm} variant="outline" className="flex-1">
                <X className="ml-2" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm space-y-1">
                      <p><strong>السعر:</strong> {product.price} ₪</p>
                      <p><strong>المخزون:</strong> {product.stock}</p>
                      {product.category && <p><strong>الفئة:</strong> {product.category}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(product)}
                      >
                        {product.is_active ? "إخفاء" : "إظهار"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};