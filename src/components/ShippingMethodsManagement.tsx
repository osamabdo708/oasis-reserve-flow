import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Truck, Clock } from "lucide-react";

interface ShippingMethod {
  id: string;
  name: string;
  duration: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export const ShippingMethodsManagement = () => {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodDuration, setNewMethodDuration] = useState("");
  const [newMethodPrice, setNewMethodPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchShippingMethods();
    
    const channel = supabase
      .channel('shipping-methods-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_methods' }, () => {
        fetchShippingMethods();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShippingMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setShippingMethods(data || []);
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل طرق الشحن",
        variant: "destructive",
      });
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMethodName.trim() || !newMethodDuration.trim() || !newMethodPrice || parseFloat(newMethodPrice) < 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول بشكل صحيح",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .insert([{
          name: newMethodName.trim(),
          duration: newMethodDuration.trim(),
          price: parseFloat(newMethodPrice),
          is_active: true,
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تمت إضافة طريقة الشحن",
      });

      setNewMethodName("");
      setNewMethodDuration("");
      setNewMethodPrice("");
    } catch (error) {
      console.error('Error adding shipping method:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة طريقة الشحن",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة طريقة الشحن",
      });
    } catch (error) {
      console.error('Error toggling shipping method:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث طريقة الشحن",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف طريقة الشحن",
      });
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف طريقة الشحن",
        variant: "destructive",
      });
    }
  };

  const paginatedMethods = shippingMethods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-6 w-6 text-primary" />
            إضافة طريقة شحن جديدة
          </CardTitle>
          <CardDescription>
            أضف طريقة شحن جديدة مع تحديد المدة والسعر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMethod} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="methodName" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  اسم طريقة الشحن
                </Label>
                <Input
                  id="methodName"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder="مثال: توصيل سريع"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodDuration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  المدة الزمنية
                </Label>
                <Input
                  id="methodDuration"
                  value={newMethodDuration}
                  onChange={(e) => setNewMethodDuration(e.target.value)}
                  placeholder="مثال: 1-2 أيام عمل"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodPrice">السعر (₪)</Label>
                <Input
                  id="methodPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newMethodPrice}
                  onChange={(e) => setNewMethodPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto" size="lg">
              <Plus className="h-4 w-4 ml-2" />
              إضافة طريقة الشحن
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            طرق الشحن المتاحة ({shippingMethods.length})
          </CardTitle>
          <CardDescription>
            إدارة وتعديل طرق الشحن الحالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shippingMethods.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد طرق شحن متاحة</p>
              <p className="text-sm text-muted-foreground mt-2">ابدأ بإضافة طريقة شحن جديدة من الأعلى</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right font-semibold">اسم الطريقة</TableHead>
                      <TableHead className="text-right font-semibold">المدة الزمنية</TableHead>
                      <TableHead className="text-right font-semibold">السعر</TableHead>
                      <TableHead className="text-right font-semibold">الحالة</TableHead>
                      <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMethods.map((method) => (
                    <TableRow key={method.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {method.duration}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{method.price.toFixed(2)} ₪</TableCell>
                      <TableCell>
                        <Badge variant={method.is_active ? "default" : "secondary"} className="font-medium">
                          {method.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(method.id, method.is_active)}
                          >
                            {method.is_active ? "إيقاف" : "تفعيل"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(method.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <span className="text-sm text-muted-foreground">
                  صفحة {currentPage} من {Math.ceil(shippingMethods.length / itemsPerPage)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(shippingMethods.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(shippingMethods.length / itemsPerPage)}
                >
                  التالي
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
